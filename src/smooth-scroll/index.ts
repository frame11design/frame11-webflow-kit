import Lenis from 'lenis';

import type { Frame11Module } from '../core/init';
import { debugLog, readBooleanAttribute } from '../core/utils';

const LENIS_SELECTOR = 'html[data-f11-lenis]';
const initializedRoots = new WeakSet<HTMLElement>();

export interface Frame11LenisConfig {
  anchors: boolean;
  anchorOffset: number;
  duration: number;
  smoothWheel: boolean;
  syncTouch: boolean;
  wheelMultiplier: number;
}

function readBooleanOption(
  element: Element,
  attributeName: string,
  fallback: boolean,
): boolean {
  return element.hasAttribute(attributeName)
    ? readBooleanAttribute(element, attributeName)
    : fallback;
}

function readNumberOption(
  element: Element,
  attributeName: string,
  fallback: number,
  minimum?: number,
): number {
  const rawValue = element.getAttribute(attributeName);
  const value = rawValue === null ? Number.NaN : Number(rawValue);

  if (!Number.isFinite(value) || (minimum !== undefined && value < minimum)) {
    return fallback;
  }

  return value;
}

export function readLenisConfig(root: HTMLElement): Frame11LenisConfig {
  return {
    anchors: readBooleanOption(root, 'data-f11-lenis-anchors', true),
    anchorOffset: readNumberOption(
      root,
      'data-f11-lenis-anchor-offset',
      -80,
    ),
    duration: readNumberOption(root, 'data-f11-lenis-duration', 1, 0),
    smoothWheel: readBooleanOption(root, 'data-f11-lenis-wheel', true),
    syncTouch: readBooleanOption(root, 'data-f11-lenis-touch', false),
    wheelMultiplier: readNumberOption(
      root,
      'data-f11-lenis-wheel-multiplier',
      1.1,
      0,
    ),
  };
}

function initLenis(root: HTMLElement, debug: boolean): void {
  if (
    initializedRoots.has(root) ||
    !readBooleanAttribute(root, 'data-f11-lenis')
  ) {
    return;
  }

  initializedRoots.add(root);

  const start = (): void => {
    if (root.hasAttribute('data-f11-lenis-ready')) return;

    const config = readLenisConfig(root);
    const lenis = new Lenis({
      anchors: config.anchors ? { offset: config.anchorOffset } : false,
      autoRaf: true,
      autoResize: true,
      duration: config.duration,
      respectReducedMotion: true,
      smoothWheel: config.smoothWheel,
      syncTouch: config.syncTouch,
      wheelMultiplier: config.wheelMultiplier,
    });

    // Lenis exposes version metadata globally. FRAME11 keeps public runtime
    // access inside window.F11, so the upstream metadata globals are removed.
    Reflect.deleteProperty(window, 'lenis');
    Reflect.deleteProperty(window, 'lenisVersion');

    root.setAttribute('data-f11-lenis-ready', '');

    let resizeFrame = 0;
    const safeResize = (): void => {
      if (resizeFrame) return;

      resizeFrame = window.requestAnimationFrame(() => {
        lenis.resize();
        resizeFrame = 0;
      });
    };

    // Webflow can change page height after Lenis' own observer has run (for
    // example after interactions, embeds, fonts, or CMS content render).
    // Watching both document roots and batching the resize fixes stale limits.
    if (typeof ResizeObserver === 'function') {
      const resizeObserver = new ResizeObserver(safeResize);
      resizeObserver.observe(document.documentElement);

      if (document.body) {
        resizeObserver.observe(document.body);
      }
    }

    window.addEventListener('pageshow', safeResize);

    lenis.on('scroll', () => {
      window.ScrollTrigger?.update?.();
    });

    safeResize();
    debugLog(debug, 'Lenis smooth scroll ready');
  };

  if (document.readyState === 'complete') {
    start();
  } else {
    window.addEventListener('load', start, { once: true });
  }
}

declare global {
  interface Window {
    ScrollTrigger?: {
      update?: () => void;
    };
  }
}

export const smoothScrollModule: Frame11Module = {
  name: 'smooth-scroll',
  selector: LENIS_SELECTOR,
  init: ({ debug }) => {
    initLenis(document.documentElement, debug);
  },
};
