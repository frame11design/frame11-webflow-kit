import type { Frame11Module } from '../core/init';
import { debugLog, readBooleanAttribute } from '../core/utils';

const SLIDER_SELECTOR = '[data-f11-slider]';
const VIEWPORT_SELECTOR = '[data-f11-slider-viewport], .slider-viewport';
const TRACK_SELECTOR = '[data-f11-slider-track], .slider-track';
const ITEM_SELECTOR = '[data-f11-slider-item], .slider-element';
const PREVIOUS_SELECTOR = '[data-f11-slider-prev], .slider-button.prev';
const NEXT_SELECTOR = '[data-f11-slider-next], .slider-button.next';

const initializedSliders = new WeakSet<HTMLElement>();

interface SliderConfig {
  autoplay: number;
  cardsDesktop: number;
  cardsMobile: number;
  cardsTablet: number;
}

export interface SliderChangeDetail {
  index: number;
  root: HTMLElement;
}

function readPositiveNumber(
  element: HTMLElement,
  attribute: string,
  fallback: number,
): number {
  const rawValue = element.getAttribute(attribute);
  const value = rawValue === null ? Number.NaN : Number(rawValue);

  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function readConfig(root: HTMLElement): SliderConfig {
  const desktop = readPositiveNumber(
    root,
    'data-f11-slider-cards-desktop',
    3.4,
  );
  const tablet = readPositiveNumber(
    root,
    'data-f11-slider-cards-tablet',
    2.4,
  );
  const mobile = readPositiveNumber(
    root,
    'data-f11-slider-cards-mobile',
    1.4,
  );
  const autoplayValue = root.getAttribute('data-f11-slider-autoplay');

  let autoplay = 0;
  if (autoplayValue === '' || autoplayValue === 'true') {
    autoplay = 3500;
  } else if (autoplayValue !== null && autoplayValue !== 'false') {
    autoplay = readPositiveNumber(
      root,
      'data-f11-slider-autoplay',
      0,
    );
  }

  return {
    autoplay,
    cardsDesktop: desktop,
    cardsMobile: mobile,
    cardsTablet: tablet,
  };
}

function getOwnedElement(
  root: HTMLElement,
  selector: string,
): HTMLElement | null {
  return (
    Array.from(root.querySelectorAll<HTMLElement>(selector)).find(
      (element) => element.closest(SLIDER_SELECTOR) === root,
    ) ?? null
  );
}

function getItems(root: HTMLElement, track: HTMLElement): HTMLElement[] {
  return Array.from(track.children).filter(
    (element): element is HTMLElement =>
      element instanceof HTMLElement &&
      element.matches(ITEM_SELECTOR) &&
      element.closest(SLIDER_SELECTOR) === root,
  );
}

function setButtonDisabled(button: HTMLElement, disabled: boolean): void {
  button.setAttribute('aria-disabled', String(disabled));
  button.toggleAttribute('data-f11-slider-disabled', disabled);

  if (button instanceof HTMLButtonElement) {
    button.disabled = disabled;
    button.type = 'button';
  }
}

function prepareButton(button: HTMLElement, label: string): void {
  if (!button.hasAttribute('aria-label')) {
    button.setAttribute('aria-label', label);
  }

  if (!(button instanceof HTMLButtonElement)) {
    button.setAttribute('role', 'button');

    if (!button.hasAttribute('tabindex')) {
      button.tabIndex = 0;
    }
  }
}

function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function getGapPixels(track: HTMLElement): number {
  const value = Number.parseFloat(getComputedStyle(track).gap || '0');
  return Number.isFinite(value) ? value : 0;
}

function initSlider(root: HTMLElement, debug: boolean): void {
  if (
    initializedSliders.has(root) ||
    !readBooleanAttribute(root, 'data-f11-slider')
  ) {
    return;
  }

  const viewport = getOwnedElement(root, VIEWPORT_SELECTOR);
  const track = getOwnedElement(root, TRACK_SELECTOR);
  const previous = getOwnedElement(root, PREVIOUS_SELECTOR);
  const next = getOwnedElement(root, NEXT_SELECTOR);

  if (!viewport || !track || !previous || !next) {
    debugLog(
      debug,
      'Slider skipped: viewport, track, previous or next control is missing',
    );
    return;
  }

  initializedSliders.add(root);

  const config = readConfig(root);
  const isGerman = document.documentElement.lang
    .toLowerCase()
    .startsWith('de');
  const reducedMotion = prefersReducedMotion();
  const gap = root.getAttribute('data-f11-slider-gap')?.trim();

  let autoplayTimer: number | null = null;
  let inView = typeof IntersectionObserver === 'undefined';
  let paused = false;
  let pausedUntil = 0;
  let currentIndex = -1;
  let scrollFrame: number | null = null;
  let cardsPerView = config.cardsDesktop;

  if (gap) {
    root.style.setProperty('--f11-slider-gap', gap);
  }

  if (!viewport.hasAttribute('tabindex')) {
    viewport.tabIndex = 0;
  }
  if (!viewport.hasAttribute('aria-label')) {
    viewport.setAttribute(
      'aria-label',
      isGerman ? 'Karten-Slider' : 'Card slider',
    );
  }
  viewport.setAttribute('role', 'region');

  prepareButton(previous, isGerman ? 'Vorherige Karte' : 'Previous card');
  prepareButton(next, isGerman ? 'Nächste Karte' : 'Next card');

  const getStep = (): number => {
    const firstItem = getItems(root, track)[0];
    if (!firstItem) return 0;

    const gapValue = getGapPixels(track);
    return firstItem.getBoundingClientRect().width + gapValue;
  };

  const syncCardsPerView = (): void => {
    const width = window.innerWidth;
    cardsPerView =
      width <= 479
        ? config.cardsMobile
        : width <= 991
          ? config.cardsTablet
          : config.cardsDesktop;

    root.style.setProperty('--f11-slider-cards', String(cardsPerView));

    const gapValue = getGapPixels(track);
    if (viewport.clientWidth > 0) {
      const cardWidth =
        (viewport.clientWidth - gapValue * (cardsPerView - 1)) /
        cardsPerView;
      root.style.setProperty(
        '--f11-slider-card-width',
        `${Math.max(0, cardWidth)}px`,
      );
    }
  };

  const syncState = (): void => {
    const maxScrollLeft = Math.max(
      0,
      viewport.scrollWidth - viewport.clientWidth,
    );
    const tolerance = 2;
    const canScroll = maxScrollLeft > tolerance;

    setButtonDisabled(previous, !canScroll || viewport.scrollLeft <= tolerance);
    setButtonDisabled(
      next,
      !canScroll || viewport.scrollLeft >= maxScrollLeft - tolerance,
    );
    root.toggleAttribute('data-f11-slider-scrollable', canScroll);

    const step = getStep();
    const nextIndex = step > 0 ? Math.round(viewport.scrollLeft / step) : 0;

    if (nextIndex !== currentIndex) {
      currentIndex = nextIndex;
      root.setAttribute('data-f11-slider-index', String(currentIndex));
      root.dispatchEvent(
        new CustomEvent<SliderChangeDetail>('f11:slider-change', {
          bubbles: true,
          detail: { index: currentIndex, root },
        }),
      );
    }
  };

  const scheduleSync = (): void => {
    if (scrollFrame !== null) return;

    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = null;
      syncState();
    });
  };

  const scrollByOne = (direction: -1 | 1, manual = true): void => {
    const step = getStep();
    if (!step) return;

    if (manual) {
      pausedUntil = Date.now() + 4000;
    }

    viewport.scrollBy({
      behavior: reducedMotion ? 'auto' : 'smooth',
      left: step * direction,
    });
  };

  const stopAutoplay = (): void => {
    if (autoplayTimer !== null) {
      window.clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  };

  const startAutoplay = (): void => {
    stopAutoplay();
    if (!config.autoplay || reducedMotion || !inView || paused) return;

    autoplayTimer = window.setInterval(() => {
      if (Date.now() < pausedUntil) return;

      const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth;
      if (maxScrollLeft <= 2) return;

      const step = getStep();
      if (viewport.scrollLeft + step >= maxScrollLeft - 2) {
        viewport.scrollTo({ behavior: 'smooth', left: 0 });
      } else {
        scrollByOne(1, false);
      }
    }, config.autoplay);
  };

  const activateControl = (
    button: HTMLElement,
    direction: -1 | 1,
  ): void => {
    if (button.getAttribute('aria-disabled') === 'true') return;
    scrollByOne(direction);
  };

  previous.addEventListener('click', (event) => {
    event.preventDefault();
    activateControl(previous, -1);
  });
  next.addEventListener('click', (event) => {
    event.preventDefault();
    activateControl(next, 1);
  });

  for (const [button, direction] of [
    [previous, -1],
    [next, 1],
  ] as const) {
    button.addEventListener('keydown', (event) => {
      if (button instanceof HTMLButtonElement) return;
      if (event.key !== 'Enter' && event.key !== ' ') return;

      event.preventDefault();
      activateControl(button, direction);
    });
  }

  viewport.addEventListener('keydown', (event) => {
    if (event.target !== viewport) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      scrollByOne(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      scrollByOne(1);
    }
  });
  viewport.addEventListener('scroll', scheduleSync, { passive: true });
  viewport.addEventListener('pointerdown', () => {
    pausedUntil = Date.now() + 4000;
  });
  root.addEventListener('pointerenter', () => {
    paused = true;
    stopAutoplay();
  });
  root.addEventListener('pointerleave', () => {
    paused = false;
    startAutoplay();
  });
  root.addEventListener('focusin', () => {
    paused = true;
    stopAutoplay();
  });
  root.addEventListener('focusout', (event) => {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && root.contains(nextTarget)) return;

    paused = false;
    startAutoplay();
  });

  const intersectionObserver =
    typeof IntersectionObserver === 'undefined'
      ? null
      : new IntersectionObserver(
          ([entry]) => {
            inView = entry?.isIntersecting === true;
            if (inView) startAutoplay();
            else stopAutoplay();
          },
          { threshold: 0.4 },
        );
  intersectionObserver?.observe(viewport);

  const resize = (): void => {
    syncCardsPerView();
    scheduleSync();
  };

  window.addEventListener('resize', resize, { passive: true });

  const resizeObserver =
    typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(resize);
  resizeObserver?.observe(viewport);

  const mutationObserver = new MutationObserver(scheduleSync);
  mutationObserver.observe(track, { childList: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAutoplay();
    else startAutoplay();
  });

  root.setAttribute('data-f11-slider-ready', '');
  syncCardsPerView();
  syncState();
  startAutoplay();
  debugLog(debug, 'Multi-card slider ready');
}

export const sliderModule: Frame11Module = {
  name: 'slider',
  selector: SLIDER_SELECTOR,
  init: ({ debug }) => {
    document
      .querySelectorAll<HTMLElement>(SLIDER_SELECTOR)
      .forEach((root) => initSlider(root, debug));
  },
};
