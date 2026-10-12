// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';

import { navigationModule } from './index';

async function flushMutations(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

beforeEach(() => {
  document.body.innerHTML = '';
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
});
