// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { sliderModule } from './index';

function setDimension(
  element: HTMLElement,
  property: 'clientWidth' | 'scrollWidth',
  value: number,
): void {
  Object.defineProperty(element, property, {
    configurable: true,
    value,
  });
}

beforeEach(() => {
  document.documentElement.lang = 'de';
  document.body.innerHTML = '';
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({ matches: false }),
  );
});

describe('FRAME11 multi-card slider', () => {
  it('supports the existing Frame11 slider classes behind an explicit opt-in', () => {
    document.body.innerHTML = `
      <section
        class="slider-component"
        data-f11-slider
        data-f11-slider-cards-desktop="4"
        data-f11-slider-gap="1.5rem"
      >
        <div class="slider-viewport">
          <div class="slider-track">
            <article class="slider-element"></article>
            <article class="slider-element"></article>
          </div>
        </div>
        <a href="#" class="slider-button prev"></a>
        <a href="#" class="slider-button next"></a>
      </section>
    `;

    const root = document.querySelector<HTMLElement>('[data-f11-slider]');
    const viewport = document.querySelector<HTMLElement>('.slider-viewport');
    if (!root || !viewport) throw new Error('Slider fixture is missing');

    setDimension(viewport, 'clientWidth', 1000);
    setDimension(viewport, 'scrollWidth', 1600);

    sliderModule.init({ debug: false });

    expect(root.hasAttribute('data-f11-slider-ready')).toBe(true);
    expect(root.style.getPropertyValue('--f11-slider-cards')).toBe('4');
    expect(root.style.getPropertyValue('--f11-slider-gap')).toBe('1.5rem');
    expect(viewport.getAttribute('role')).toBe('region');
    expect(document.querySelector('.prev')?.getAttribute('role')).toBe(
      'button',
    );
  });

  it('scrolls one card and exposes accessible boundary states', () => {
    document.body.innerHTML = `
      <section data-f11-slider>
        <div data-f11-slider-viewport>
          <div data-f11-slider-track style="gap: 20px">
            <article data-f11-slider-item></article>
            <article data-f11-slider-item></article>
            <article data-f11-slider-item></article>
          </div>
        </div>
        <button data-f11-slider-prev></button>
        <button data-f11-slider-next></button>
      </section>
    `;

    const viewport = document.querySelector<HTMLElement>(
      '[data-f11-slider-viewport]',
    );
    const firstItem = document.querySelector<HTMLElement>(
      '[data-f11-slider-item]',
    );
    const previous = document.querySelector<HTMLButtonElement>(
      '[data-f11-slider-prev]',
    );
    const next = document.querySelector<HTMLButtonElement>(
      '[data-f11-slider-next]',
    );
    if (!viewport || !firstItem || !previous || !next) {
      throw new Error('Slider fixture is missing');
    }

    setDimension(viewport, 'clientWidth', 600);
    setDimension(viewport, 'scrollWidth', 1200);
    firstItem.getBoundingClientRect = vi.fn().mockReturnValue({ width: 200 });
    const scrollBy = vi.fn((options?: ScrollToOptions) => {
      viewport.scrollLeft += options?.left ?? 0;
    });
    Object.defineProperty(viewport, 'scrollBy', {
      configurable: true,
      value: scrollBy,
    });

    sliderModule.init({ debug: false });

    expect(previous.disabled).toBe(true);
    expect(next.disabled).toBe(false);

    next.click();

    expect(scrollBy).toHaveBeenCalledWith(
      expect.objectContaining({ left: 220 }),
    );
  });

  it('stays disabled when the root opt-in is false', () => {
    document.body.innerHTML = `
      <section data-f11-slider="false">
        <div data-f11-slider-viewport>
          <div data-f11-slider-track>
            <article data-f11-slider-item></article>
          </div>
        </div>
        <button data-f11-slider-prev></button>
        <button data-f11-slider-next></button>
      </section>
    `;

    sliderModule.init({ debug: false });

    expect(
      document
        .querySelector('[data-f11-slider]')
        ?.hasAttribute('data-f11-slider-ready'),
    ).toBe(false);
  });
});
