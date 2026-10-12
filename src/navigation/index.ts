import type { Frame11Module } from '../core/init';
import { debugLog, readBooleanAttribute } from '../core/utils';

const NAVIGATION_SELECTOR = '[data-f11-nav]';
const NAV_BUTTON_SELECTOR = '.w-nav-button';
const NAV_MENU_SELECTOR = '.w-nav-menu';
const NAV_OVERLAY_SELECTOR = '.w-nav-overlay';

const initializedNavigations = new WeakSet<HTMLElement>();

function isNavigationOpen(navigation: HTMLElement): boolean {
  const button = navigation.querySelector<HTMLElement>(NAV_BUTTON_SELECTOR);
  const menu = navigation.querySelector<HTMLElement>(NAV_MENU_SELECTOR);

  return (
    button?.classList.contains('w--open') === true ||
    button?.getAttribute('aria-expanded') === 'true' ||
    menu?.classList.contains('w--nav-menu-open') === true
  );
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

  let overlay: HTMLElement | null = null;

  const syncState = (): void => {
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
  };

  const observer = new MutationObserver(syncState);
  observer.observe(navigation, {
    attributes: true,
    attributeFilter: ['aria-expanded', 'class'],
    childList: true,
    subtree: true,
  });

  syncState();
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
