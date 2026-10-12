// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { navigationModule } from './index';

async function flushMutations(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

async function flushFrame(): Promise<void> {
  await new Promise((resolve) => window.setTimeout(resolve, 20));
}

beforeEach(() => {
  document.body.innerHTML = '';
  Object.defineProperty(window, 'scrollY', {
    configurable: true,
    value: 0,
    writable: true,
  });
});

describe('FRAME11 navigation helper', () => {
  it('keeps navigation disabled unless it is explicitly enabled', () => {
    document.body.innerHTML = `
      <nav class="w-nav" data-f11-nav="false">
        <button class="w-nav-button" aria-expanded="false"></button>
        <div class="w-nav-menu"></div>
      </nav>
    `;

    navigationModule.init({ debug: false });

    expect(
      document.querySelector('[data-f11-nav-ready]'),
    ).toBeNull();
  });

  it('tracks a Webflow overlay that is inserted after initialization', async () => {
    document.body.innerHTML = `
      <nav class="w-nav" data-f11-nav>
        <button class="w-nav-button" aria-expanded="false"></button>
        <div class="w-nav-menu"></div>
      </nav>
    `;

    const navigation = document.querySelector<HTMLElement>('.w-nav');
    const button = document.querySelector<HTMLElement>('.w-nav-button');

    navigationModule.init({ debug: false });
    expect(navigation?.hasAttribute('data-f11-nav-ready')).toBe(true);

    const overlay = document.createElement('div');
    overlay.className = 'w-nav-overlay';
    navigation?.append(overlay);
    await flushMutations();

    expect(overlay.hasAttribute('data-f11-nav-overlay-ready')).toBe(true);
    expect(overlay.hasAttribute('data-f11-nav-overlay-open')).toBe(false);

    button?.classList.add('w--open');
    button?.setAttribute('aria-expanded', 'true');
    await flushMutations();

    expect(navigation?.hasAttribute('data-f11-nav-open')).toBe(true);
    expect(overlay.hasAttribute('data-f11-nav-overlay-open')).toBe(true);

    button?.classList.remove('w--open');
    button?.setAttribute('aria-expanded', 'false');
    await flushMutations();

    expect(navigation?.hasAttribute('data-f11-nav-open')).toBe(false);
    expect(overlay.hasAttribute('data-f11-nav-overlay-open')).toBe(false);
  });

  it('switches between the default and section navigation theme', async () => {
    document.body.innerHTML = `
      <nav class="w-nav" data-f11-nav data-f11-nav-theme-default="light">
        <button class="w-nav-button" aria-expanded="false"></button>
        <div class="w-nav-menu"></div>
      </nav>
      <section data-f11-nav-theme="dark"></section>
    `;

    const navigation = document.querySelector<HTMLElement>('.w-nav');
    const section = document.querySelector<HTMLElement>('section');
    if (!navigation || !section) throw new Error('Navigation fixture missing');

    navigation.getBoundingClientRect = vi.fn().mockReturnValue({
      height: 80,
      top: 0,
    });
    section.getBoundingClientRect = vi.fn().mockReturnValue({
      bottom: 500,
      top: 0,
    });

    navigationModule.init({ debug: false });
    expect(navigation.getAttribute('data-f11-nav-theme-current')).toBe('dark');

    section.getBoundingClientRect = vi.fn().mockReturnValue({
      bottom: 900,
      top: 600,
    });
    window.dispatchEvent(new Event('scroll'));
    await flushFrame();

    expect(navigation.getAttribute('data-f11-nav-theme-current')).toBe(
      'light',
    );
  });

  it('reveals an always-sticky header after its configured offset', () => {
    document.body.innerHTML = `
      <nav
        class="w-nav"
        data-f11-nav
        data-f11-nav-sticky="always"
        data-f11-nav-sticky-offset="100"
      >
        <button class="w-nav-button" aria-expanded="false"></button>
        <div class="w-nav-menu"></div>
      </nav>
    `;

    const navigation = document.querySelector<HTMLElement>('.w-nav');
    if (!navigation) throw new Error('Navigation fixture missing');
    Object.defineProperty(navigation, 'offsetHeight', {
      configurable: true,
      value: 72,
    });
    window.scrollY = 300;

    navigationModule.init({ debug: false });

    expect(navigation.hasAttribute('data-f11-nav-sticky-active')).toBe(true);
    expect(navigation.hasAttribute('data-f11-nav-sticky-visible')).toBe(true);
    expect(
      document.querySelector<HTMLElement>('[data-f11-nav-sticky-spacer]')
        ?.style.height,
    ).toBe('72px');
  });

  it('shows the directional header only while scrolling back up', async () => {
    document.body.innerHTML = `
      <nav
        class="w-nav"
        data-f11-nav
        data-f11-nav-sticky="direction"
        data-f11-nav-sticky-offset="100"
      >
        <button class="w-nav-button" aria-expanded="false"></button>
        <div class="w-nav-menu"></div>
      </nav>
    `;

    const navigation = document.querySelector<HTMLElement>('.w-nav');
    if (!navigation) throw new Error('Navigation fixture missing');

    navigationModule.init({ debug: false });

    window.scrollY = 300;
    window.dispatchEvent(new Event('scroll'));
    await flushFrame();
    expect(navigation.hasAttribute('data-f11-nav-sticky-active')).toBe(true);
    expect(navigation.hasAttribute('data-f11-nav-sticky-visible')).toBe(false);

    window.scrollY = 250;
    window.dispatchEvent(new Event('scroll'));
    await flushFrame();
    expect(navigation.hasAttribute('data-f11-nav-sticky-visible')).toBe(true);

    window.scrollY = 330;
    window.dispatchEvent(new Event('scroll'));
    await flushFrame();
    expect(navigation.hasAttribute('data-f11-nav-sticky-visible')).toBe(false);
  });
});
