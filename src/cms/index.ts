import type { Frame11Module } from '../core/init';
import { debugLog, readBooleanAttribute } from '../core/utils';

const CMS_TOGGLE_SELECTOR = '[data-f11-cms-toggle]';
const CMS_BUTTON_SELECTOR = '[data-f11-cms-button]';
const CMS_LABEL_SELECTOR = '[data-f11-cms-label]';
const CMS_ITEM_SELECTOR = '[data-f11-cms-item], .w-dyn-item';

const initializedToggles = new WeakSet<HTMLElement>();
let generatedListId = 0;

interface CmsToggleConfig {
  duration: number;
  easing: string;
  initial: number;
  lessLabel: string;
  moreLabel: string;
  stagger: number;
  distance: number;
}

export interface CmsToggleDetail {
  expanded: boolean;
  root: HTMLElement;
  visibleItems: number;
}

function readNumber(
  element: HTMLElement,
  attribute: string,
  fallback: number,
  minimum = 0,
): number {
  const rawValue = element.getAttribute(attribute);
  const value = rawValue === null ? Number.NaN : Number(rawValue);

  return Number.isFinite(value) && value >= minimum ? value : fallback;
}

function readConfig(root: HTMLElement): CmsToggleConfig {
  const isGerman = document.documentElement.lang
    .toLowerCase()
    .startsWith('de');

  return {
    duration: readNumber(root, 'data-f11-cms-duration', 360),
    easing:
      root.getAttribute('data-f11-cms-easing')?.trim() ||
      'cubic-bezier(0.22, 1, 0.36, 1)',
    initial: Math.floor(readNumber(root, 'data-f11-cms-initial', 6, 1)),
    lessLabel:
      root.getAttribute('data-f11-cms-less-label')?.trim() ||
      (isGerman ? 'Weniger anzeigen' : 'Show less'),
    moreLabel:
      root.getAttribute('data-f11-cms-more-label')?.trim() ||
      (isGerman ? 'Mehr anzeigen' : 'Show more'),
    stagger: readNumber(root, 'data-f11-cms-stagger', 60),
    distance: readNumber(root, 'data-f11-cms-distance', 16),
  };
}

function getItems(list: HTMLElement): HTMLElement[] {
  return Array.from(list.children).filter(
    (element): element is HTMLElement =>
      element instanceof HTMLElement && element.matches(CMS_ITEM_SELECTOR),
  );
}

function getOwnedElement(
  root: HTMLElement,
  selector: string,
): HTMLElement | null {
  return (
    Array.from(root.querySelectorAll<HTMLElement>(selector)).find(
      (element) => element.closest(CMS_TOGGLE_SELECTOR) === root,
    ) ?? null
  );
}

function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function setLabel(
  button: HTMLElement,
  expanded: boolean,
  config: CmsToggleConfig,
): void {
  const label = expanded ? config.lessLabel : config.moreLabel;
  const labelElement = button.querySelector<HTMLElement>(CMS_LABEL_SELECTOR);

  if (labelElement) {
    labelElement.textContent = label;
  } else if (button.childElementCount === 0) {
    button.textContent = label;
  }

  button.setAttribute('aria-label', label);
}

function prepareButton(button: HTMLElement, list: HTMLElement): void {
  if (!list.id) {
    generatedListId += 1;
    list.id = `f11-cms-list-${generatedListId}`;
  }

  button.setAttribute('aria-controls', list.id);

  if (button instanceof HTMLButtonElement) {
    button.type = 'button';
    return;
  }

  button.setAttribute('role', 'button');

  if (!button.hasAttribute('tabindex')) {
    button.tabIndex = 0;
  }
}

function animateItem(
  item: HTMLElement,
  opening: boolean,
  index: number,
  config: CmsToggleConfig,
): Animation | null {
  if (prefersReducedMotion() || typeof item.animate !== 'function') {
    return null;
  }

  const hiddenFrame = {
    opacity: 0,
    transform: `translateY(${config.distance}px)`,
  };
  const visibleFrame = {
    opacity: 1,
    transform: 'translateY(0)',
  };

  return item.animate(
    opening ? [hiddenFrame, visibleFrame] : [visibleFrame, hiddenFrame],
    {
      delay: index * config.stagger,
      duration: config.duration,
      easing: config.easing,
      fill: 'both',
    },
  );
}

function waitForAnimations(animations: Array<Animation | null>): Promise<void> {
  const activeAnimations = animations.filter(
    (animation): animation is Animation => animation !== null,
  );

  if (!activeAnimations.length) {
    return Promise.resolve();
  }

  return Promise.allSettled(
    activeAnimations.map((animation) => animation.finished),
  ).then(() => undefined);
}

function initCmsToggle(root: HTMLElement, debug: boolean): void {
  if (
    initializedToggles.has(root) ||
    !readBooleanAttribute(root, 'data-f11-cms-toggle')
  ) {
    return;
  }

  const list =
    getOwnedElement(root, '[data-f11-cms-list]') ??
    getOwnedElement(root, '.w-dyn-items');
  const button = getOwnedElement(root, CMS_BUTTON_SELECTOR);

  if (!list || !button) {
    debugLog(
      debug,
      'CMS toggle skipped: list or button is missing',
    );
    return;
  }

  initializedToggles.add(root);

  const config = readConfig(root);
  let expanded = false;
  let animating = false;

  prepareButton(button, list);

  const sync = (): void => {
    const items = getItems(list);
    const extraItems = items.slice(config.initial);
    const hasExtraItems = extraItems.length > 0;

    items.forEach((item, index) => {
      const extra = index >= config.initial;
      item.toggleAttribute('data-f11-cms-extra', extra);

      if (!extra || expanded) {
        item.hidden = false;
        item.inert = false;
        item.removeAttribute('aria-hidden');
      } else {
        item.hidden = true;
        item.inert = true;
        item.setAttribute('aria-hidden', 'true');
      }
    });

    button.hidden = !hasExtraItems;
    button.setAttribute('aria-expanded', String(expanded && hasExtraItems));
    setLabel(button, expanded, config);
    root.toggleAttribute(
      'data-f11-cms-expanded',
      expanded && hasExtraItems,
    );
  };

  const toggle = async (): Promise<void> => {
    if (animating || button.hidden) return;

    const items = getItems(list);
    const extraItems = items.slice(config.initial);

    if (!extraItems.length) return;

    animating = true;
    root.setAttribute('data-f11-cms-animating', '');
    button.setAttribute('aria-disabled', 'true');

    const opening = !expanded;

    if (opening) {
      extraItems.forEach((item) => {
        item.hidden = false;
        item.inert = false;
        item.removeAttribute('aria-hidden');
      });
    }

    const animationItems = opening ? extraItems : [...extraItems].reverse();
    const animations = animationItems.map((item, index) =>
      animateItem(item, opening, index, config),
    );

    await waitForAnimations(animations);

    animations.forEach((animation) => animation?.cancel());
    expanded = opening;

    if (!expanded) {
      extraItems.forEach((item) => {
        item.hidden = true;
        item.inert = true;
        item.setAttribute('aria-hidden', 'true');
      });
    }

    animating = false;
    root.removeAttribute('data-f11-cms-animating');
    button.removeAttribute('aria-disabled');
    sync();

    root.dispatchEvent(
      new CustomEvent<CmsToggleDetail>('f11:cms-toggle', {
        bubbles: true,
        detail: {
          expanded,
          root,
          visibleItems: expanded
            ? items.length
            : Math.min(config.initial, items.length),
        },
      }),
    );
  };

  button.addEventListener('click', (event) => {
    event.preventDefault();
    void toggle();
  });

  button.addEventListener('keydown', (event) => {
    if (button instanceof HTMLButtonElement) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;

    event.preventDefault();
    void toggle();
  });

  const observer = new MutationObserver(sync);
  observer.observe(list, { childList: true });

  root.setAttribute('data-f11-cms-ready', '');
  sync();
  debugLog(debug, 'CMS show more/less ready');
}

export const cmsModule: Frame11Module = {
  name: 'cms',
  selector: CMS_TOGGLE_SELECTOR,
  init: ({ debug }) => {
    document
      .querySelectorAll<HTMLElement>(CMS_TOGGLE_SELECTOR)
      .forEach((root) => initCmsToggle(root, debug));
  },
};
