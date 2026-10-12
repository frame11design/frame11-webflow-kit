// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

const lenisState = vi.hoisted(() => ({
  instances: [] as Array<{
    options: Record<string, unknown>;
    resize: ReturnType<typeof vi.fn>;
    scrollHandler?: () => void;
  }>,
}));

vi.mock('lenis', () => ({
  default: class FakeLenis {
    options: Record<string, unknown>;
    resize = vi.fn();
    scrollHandler?: () => void;

    constructor(options: Record<string, unknown>) {
      this.options = options;
      lenisState.instances.push(this);
    }

    on(event: string, handler: () => void): void {
      if (event === 'scroll') this.scrollHandler = handler;
    }
  },
}));

import { readLenisConfig, smoothScrollModule } from './index';

class ResizeObserverMock {
  observe = vi.fn();
}

beforeEach(() => {
  lenisState.instances.length = 0;
  document.documentElement.removeAttribute('data-f11-lenis');
  document.documentElement.removeAttribute('data-f11-lenis-ready');
  document.documentElement.removeAttribute('data-f11-lenis-duration');
  document.documentElement.removeAttribute('data-f11-lenis-wheel-multiplier');
  document.documentElement.removeAttribute('data-f11-lenis-touch');
  document.documentElement.removeAttribute('data-f11-lenis-anchors');
  document.documentElement.removeAttribute('data-f11-lenis-anchor-offset');
  vi.stubGlobal('ResizeObserver', ResizeObserverMock);
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    callback(0);
    return 1;
  });
});

describe('FRAME11 Lenis smooth scroll', () => {
  it('uses FRAME11 defaults and validates numeric overrides', () => {
    const root = document.documentElement;

    expect(readLenisConfig(root)).toEqual({
      anchors: true,
      anchorOffset: -80,
      duration: 1,
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 1.1,
    });

    root.setAttribute('data-f11-lenis-duration', '0.85');
    root.setAttribute('data-f11-lenis-wheel-multiplier', 'invalid');
    root.setAttribute('data-f11-lenis-touch', 'true');
    root.setAttribute('data-f11-lenis-anchors', 'false');
    root.setAttribute('data-f11-lenis-anchor-offset', '-120');

    expect(readLenisConfig(root)).toEqual({
      anchors: false,
      anchorOffset: -120,
      duration: 0.85,
      smoothWheel: true,
      syncTouch: true,
      wheelMultiplier: 1.1,
    });
  });

  it('stays disabled until explicitly enabled', () => {
    smoothScrollModule.init({ debug: false });

    expect(lenisState.instances).toHaveLength(0);
    expect(
      document.documentElement.hasAttribute('data-f11-lenis-ready'),
    ).toBe(false);
  });

  it('initializes once with resize and optional ScrollTrigger integration', () => {
    const update = vi.fn();
    window.ScrollTrigger = { update };
    document.documentElement.setAttribute('data-f11-lenis', 'true');

    smoothScrollModule.init({ debug: false });
    window.dispatchEvent(new Event('load'));
    smoothScrollModule.init({ debug: false });

    expect(lenisState.instances).toHaveLength(1);
    expect(lenisState.instances[0]?.options).toMatchObject({
      anchors: { offset: -80 },
      autoRaf: true,
      autoResize: true,
      duration: 1,
      respectReducedMotion: true,
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 1.1,
    });
    expect(
      document.documentElement.hasAttribute('data-f11-lenis-ready'),
    ).toBe(true);
    expect(lenisState.instances[0]?.resize).toHaveBeenCalled();

    lenisState.instances[0]?.scrollHandler?.();
    expect(update).toHaveBeenCalledOnce();
  });
});
