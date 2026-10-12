// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { cmsModule } from './index';

interface AnimationCall {
  element: HTMLElement;
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
}

const animationCalls: AnimationCall[] = [];

function installAnimationMock(): void {
  Object.defineProperty(HTMLElement.prototype, 'animate', {
    configurable: true,
    value: function (
      this: HTMLElement,
      keyframes: Keyframe[],
      options: KeyframeAnimationOptions,
    ) {
      animationCalls.push({ element: this, keyframes, options });

      return {
        cancel: vi.fn(),
        finished: Promise.resolve(),
      } as unknown as Animation;
    },
  });
}

function renderToggle(itemCount = 5): HTMLElement {
  document.body.innerHTML = `
    <section
      data-f11-cms-toggle
      data-f11-cms-initial="2"
      data-f11-cms-stagger="75"
      data-f11-cms-duration="300"
    >
      <div class="w-dyn-items">
        ${Array.from(
          { length: itemCount },
          (_, index) =>
            `<article class="w-dyn-item" data-index="${index}"></article>`,
        ).join('')}
      </div>
      <a href="#" data-f11-cms-button>
        <span data-f11-cms-label>Initial</span>
      </a>
    </section>
  `;

  const root = document.querySelector<HTMLElement>(
    '[data-f11-cms-toggle]',
  );

  if (!root) throw new Error('CMS toggle fixture is missing');

  cmsModule.init({ debug: false });
  return root;
}

async function flush(): Promise<void> {
  await new Promise((resolve) => window.setTimeout(resolve, 0));
}

beforeEach(() => {
  document.documentElement.lang = 'de';
  document.body.innerHTML = '';
  animationCalls.length = 0;
  installAnimationMock();
});

describe('FRAME11 CMS show more/less', () => {
  it('keeps the configured number visible and prepares an accessible toggle', () => {
    const root = renderToggle();
    const items = root.querySelectorAll<HTMLElement>('.w-dyn-item');
    const button = root.querySelector<HTMLElement>('[data-f11-cms-button]');
    const list = root.querySelector<HTMLElement>('.w-dyn-items');

    expect(root.hasAttribute('data-f11-cms-ready')).toBe(true);
    expect([...items].map((item) => item.hidden)).toEqual([
      false,
      false,
      true,
      true,
      true,
    ]);
    expect(button?.getAttribute('aria-expanded')).toBe('false');
    expect(button?.getAttribute('aria-controls')).toBe(list?.id);
    expect(button?.getAttribute('role')).toBe('button');
    expect(button?.textContent).toContain('Mehr anzeigen');
  });

  it('opens and closes extra items with staggered animations', async () => {
    const root = renderToggle();
    const button = root.querySelector<HTMLElement>('[data-f11-cms-button]');
    const listener = vi.fn();
    root.addEventListener('f11:cms-toggle', listener);

    button?.click();

    await vi.waitFor(() => {
      expect(root.hasAttribute('data-f11-cms-expanded')).toBe(true);
    });

    expect(animationCalls.map((call) => call.options.delay)).toEqual([
      0,
      75,
      150,
    ]);
    expect(
      root.querySelectorAll<HTMLElement>('.w-dyn-item')[4]?.hidden,
    ).toBe(false);
    expect(button?.textContent).toContain('Weniger anzeigen');
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ expanded: true, visibleItems: 5 }),
      }),
    );

    animationCalls.length = 0;
    button?.click();

    await vi.waitFor(() => {
      expect(root.hasAttribute('data-f11-cms-expanded')).toBe(false);
    });

    expect(
      animationCalls.map((call) => call.element.dataset.index),
    ).toEqual(['4', '3', '2']);
    expect([...root.querySelectorAll<HTMLElement>('.w-dyn-item')].map(
      (item) => item.hidden,
    )).toEqual([false, false, true, true, true]);
  });

  it('reacts when Webflow-compatible CMS items are added later', async () => {
    const root = renderToggle(2);
    const list = root.querySelector<HTMLElement>('.w-dyn-items');
    const button = root.querySelector<HTMLElement>('[data-f11-cms-button]');

    expect(button?.hidden).toBe(true);

    const item = document.createElement('article');
    item.className = 'w-dyn-item';
    list?.append(item);
    await flush();

    expect(item.hidden).toBe(true);
    expect(item.getAttribute('aria-hidden')).toBe('true');
    expect(button?.hidden).toBe(false);
  });

  it('stays disabled when the opt-in attribute is false', () => {
    document.body.innerHTML = `
      <section data-f11-cms-toggle="false">
        <div class="w-dyn-items">
          <article class="w-dyn-item"></article>
          <article class="w-dyn-item"></article>
        </div>
        <button data-f11-cms-button>Mehr</button>
      </section>
    `;

    cmsModule.init({ debug: false });

    expect(
      document
        .querySelector('[data-f11-cms-toggle]')
        ?.hasAttribute('data-f11-cms-ready'),
    ).toBe(false);
  });
});
