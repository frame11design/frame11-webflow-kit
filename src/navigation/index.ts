import type { Frame11Module } from '../core/init';
import { debugLog, readBooleanAttribute } from '../core/utils';

const NAVIGATION_SELECTOR = '[data-f11-nav]';
const NAV_BUTTON_SELECTOR = '.w-nav-button';
const NAV_MENU_SELECTOR = '.w-nav-menu';
const NAV_OVERLAY_SELECTOR = '.w-nav-overlay';
const NAV_THEME_SECTION_SELECTOR = '[data-f11-nav-theme]';

type NavigationTheme = 'dark' | 'light';
type StickyMode = 'always' | 'direction';

const initializedNavigations = new WeakSet<HTMLElement>();

export interface NavigationThemeDetail {
  root: HTMLElement;
  theme: NavigationTheme;
}

function isNavigationOpen(navigation: HTMLElement): boolean {
  const button = navigation.querySelector<HTMLElement>(NAV_BUTTON_SELECTOR);
  const menu = navigation.querySelector<HTMLElement>(NAV_MENU_SELECTOR);

  return (
    button?.classList.contains('w--open') === true ||
    button?.getAttribute('aria-expanded') === 'true' ||
    menu?.classList.contains('w--nav-menu-open') === true
  );
}

function readTheme(value: string | null): NavigationTheme | null {
  return value === 'light' || value === 'dark' ? value : null;
}

function readStickyMode(value: string | null): StickyMode | null {
  return value === 'always' || value === 'direction' ? value : null;
}

function readNonNegativeNumber(
  element: HTMLElement,
  attribute: string,
  fallback: number,
): number {
  const rawValue = element.getAttribute(attribute);
  const value = rawValue === null ? Number.NaN : Number(rawValue);

  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function setupThemeSwitch(navigation: HTMLElement): () => void {
  const defaultTheme =
    readTheme(navigation.getAttribute('data-f11-nav-theme-default')) ??
    'light';
  let currentTheme: NavigationTheme | null = null;

  const setTheme = (theme: NavigationTheme): void => {
    if (theme === currentTheme) return;

    currentTheme = theme;
    navigation.setAttribute('data-f11-nav-theme-current', theme);
    navigation.dispatchEvent(
      new CustomEvent<NavigationThemeDetail>('f11:nav-theme', {
        bubbles: true,
        detail: { root: navigation, theme },
      }),
    );
  };

  return (): void => {
    const navigationRect = navigation.getBoundingClientRect();
    const navigationHeight = Math.max(
      navigation.offsetHeight,
      navigationRect.height,
    );
    const sampleY = Math.max(0, navigationRect.top) + navigationHeight / 2;
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>(NAV_THEME_SECTION_SELECTOR),
    ).filter(
      (section) => section !== navigation && !navigation.contains(section),
    );

    let nextTheme = defaultTheme;

    for (const section of sections) {
      const theme = readTheme(section.getAttribute('data-f11-nav-theme'));
      if (!theme) continue;

      const rect = section.getBoundingClientRect();
      if (rect.top <= sampleY && rect.bottom > sampleY) {
        nextTheme = theme;
      }
    }

    setTheme(nextTheme);
  };
}

function setupStickyNavigation(
  navigation: HTMLElement,
  mode: StickyMode,
): () => void {
  navigation.setAttribute('data-f11-nav-sticky-ready', '');

  const offset = readNonNegativeNumber(
    navigation,
    'data-f11-nav-sticky-offset',
    250,
  );
  const tolerance = readNonNegativeNumber(
    navigation,
    'data-f11-nav-sticky-tolerance',
    6,
  );
  const explicitSpace = navigation.getAttribute('data-f11-nav-sticky-space');
  const originalPosition = getComputedStyle(navigation).position;
  const preserveSpace =
    explicitSpace === null
      ? originalPosition !== 'fixed' && originalPosition !== 'absolute'
      : readBooleanAttribute(navigation, 'data-f11-nav-sticky-space');

  const spacer = document.createElement('div');
  spacer.setAttribute('data-f11-nav-sticky-spacer', '');
  spacer.setAttribute('aria-hidden', 'true');
  navigation.after(spacer);

  let active = false;
  let lastScrollY = Math.max(0, window.scrollY);

  const setVisible = (visible: boolean): void => {
    navigation.toggleAttribute('data-f11-nav-sticky-visible', visible);
  };

  const syncSpacer = (): void => {
    spacer.style.height =
      active && preserveSpace ? `${navigation.offsetHeight}px` : '0px';
  };

  const activate = (): void => {
    if (active) return;

    active = true;
    navigation.setAttribute('data-f11-nav-sticky-active', '');
    setVisible(false);
    syncSpacer();

    // Make the off-canvas fixed state observable before revealing it.
    navigation.getBoundingClientRect();
  };

  const deactivate = (): void => {
    if (!active) return;

    active = false;
    navigation.removeAttribute('data-f11-nav-sticky-active');
    navigation.removeAttribute('data-f11-nav-sticky-visible');
    navigation.removeAttribute('data-f11-nav-scroll-direction');
    syncSpacer();
  };

  return (): void => {
    const scrollY = Math.max(0, window.scrollY);
    const delta = scrollY - lastScrollY;
    const pastOffset = scrollY >= offset;
    const wasActive = active;

    if (!pastOffset) {
      deactivate();
      lastScrollY = scrollY;
      return;
    }

    activate();

    if (mode === 'always') {
      setVisible(true);
      lastScrollY = scrollY;
    } else if (isNavigationOpen(navigation)) {
      setVisible(true);
      lastScrollY = scrollY;
    } else if (!wasActive) {
      // Crossing the threshold while scrolling down keeps the header hidden.
      setVisible(delta <= 0);
      lastScrollY = scrollY;
    } else if (delta <= -tolerance) {
      navigation.setAttribute('data-f11-nav-scroll-direction', 'up');
      setVisible(true);
      lastScrollY = scrollY;
    } else if (delta >= tolerance) {
      navigation.setAttribute('data-f11-nav-scroll-direction', 'down');
      setVisible(false);
      lastScrollY = scrollY;
    } else if (
      navigation.getAttribute('data-f11-nav-scroll-direction') === 'down'
    ) {
      setVisible(false);
    }

    syncSpacer();
  };
}

function initNavigation(navigation: HTMLElement, debug: boolean): void {
  if (
    initializedNavigations.has(navigation) ||
    !readBooleanAttribute(navigation, 'data-f11-nav')
  ) {
    return;
  }

  initializedNavigations.add(navigation);
  navigation.setAttribute('data-f11-nav-ready', '');

  const syncTheme = setupThemeSwitch(navigation);
  const stickyMode = readStickyMode(
    navigation.getAttribute('data-f11-nav-sticky'),
  );
  const syncSticky = stickyMode
    ? setupStickyNavigation(navigation, stickyMode)
    : (): void => undefined;

  let overlay: HTMLElement | null = null;
  let frame: number | null = null;

  const syncAdvancedState = (): void => {
    syncTheme();
    syncSticky();
  };

  const scheduleAdvancedState = (): void => {
    if (frame !== null) return;

    frame = requestAnimationFrame(() => {
      frame = null;
      syncAdvancedState();
    });
  };

  const syncWebflowState = (): void => {
    const currentOverlay = navigation.querySelector<HTMLElement>(
      NAV_OVERLAY_SELECTOR,
    );

    if (currentOverlay !== overlay) {
      overlay?.removeAttribute('data-f11-nav-overlay-ready');
      overlay?.removeAttribute('data-f11-nav-overlay-open');
      overlay = currentOverlay;
      overlay?.setAttribute('data-f11-nav-overlay-ready', '');
    }

    const open = isNavigationOpen(navigation);
    navigation.toggleAttribute('data-f11-nav-open', open);
    overlay?.toggleAttribute('data-f11-nav-overlay-open', open);
    scheduleAdvancedState();
  };

  const observer = new MutationObserver(syncWebflowState);
  observer.observe(navigation, {
    attributes: true,
    attributeFilter: ['aria-expanded', 'class'],
    childList: true,
    subtree: true,
  });

  window.addEventListener('scroll', scheduleAdvancedState, { passive: true });
  window.addEventListener('resize', scheduleAdvancedState, { passive: true });

  const resizeObserver =
    typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(scheduleAdvancedState);
  resizeObserver?.observe(navigation);

  syncWebflowState();
  syncAdvancedState();
  debugLog(debug, 'Navigation helper ready');
}

export const navigationModule: Frame11Module = {
  name: 'navigation',
  selector: NAVIGATION_SELECTOR,
  init: ({ debug }) => {
    document
      .querySelectorAll<HTMLElement>(NAVIGATION_SELECTOR)
      .forEach((navigation) => initNavigation(navigation, debug));
  },
};
