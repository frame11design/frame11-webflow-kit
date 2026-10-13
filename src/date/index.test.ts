// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { dateModule } from './index';

beforeEach(() => {
  document.documentElement.lang = 'de-AT';
  document.head.innerHTML = '';
  document.body.innerHTML = '';
});

describe('FRAME11 date formatting', () => {
  it('formats a Webflow ISO date using the document language', () => {
    document.body.innerHTML =
      '<time data-f11-date="2026-10-05">Fallback</time>';

    dateModule.init({ debug: false });

    const element = document.querySelector<HTMLElement>('[data-f11-date]');
    expect(element?.textContent).toBe('05. Oktober 2026');
    expect(element?.hasAttribute('data-f11-date-ready')).toBe(true);
    expect(element?.getAttribute('data-f11-date-locale-resolved')).toMatch(
      /^de(?:-|$)/i,
    );
  });

  it('uses the same markup with the localized Webflow page language', () => {
    document.documentElement.lang = 'en-GB';
    document.body.innerHTML =
      '<span data-f11-date data-f11-date-value="2026-10-05"></span>';

    dateModule.init({ debug: false });

    expect(document.querySelector('[data-f11-date]')?.textContent).toBe(
      '05 October 2026',
    );
  });

  it('applies language rules and lets element attributes override them', () => {
    document.documentElement.lang = 'en';
    document.head.innerHTML = `
      <script type="application/json" data-f11-date-config>
        {
          "locales": {
            "en": {
              "locale": "en-US",
              "day": "numeric",
              "month": "short",
              "year": "2-digit"
            }
          }
        }
      </script>
    `;
    document.body.innerHTML = `
      <span
        data-f11-date="2026-10-05"
        data-f11-date-month="long"
        data-f11-date-year="numeric"
      ></span>
    `;

    dateModule.init({ debug: false });

    expect(document.querySelector('[data-f11-date]')?.textContent).toBe(
      'October 5, 2026',
    );
  });

  it('can omit inherited date components with none', () => {
    document.body.innerHTML = `
      <span
        data-f11-date="2026-10-05"
        data-f11-date-day="none"
        data-f11-date-year="none"
      ></span>
    `;

    dateModule.init({ debug: false });

    expect(document.querySelector('[data-f11-date]')?.textContent).toBe(
      'Oktober',
    );
  });

  it('keeps invalid or ambiguous input unchanged', () => {
    document.body.innerHTML =
      '<span data-f11-date="October 5, 2026">Original text</span>';

    dateModule.init({ debug: false });

    const element = document.querySelector<HTMLElement>('[data-f11-date]');
    expect(element?.textContent).toBe('Original text');
    expect(element?.getAttribute('data-f11-date-error')).toBe(
      'invalid-value',
    );
    expect(element?.hasAttribute('data-f11-date-ready')).toBe(false);
  });

  it('does not shift ISO timestamps across calendar days', () => {
    document.body.innerHTML = `
      <span data-f11-date="2026-10-05T23:30:00-10:00"></span>
    `;

    dateModule.init({ debug: false });

    expect(document.querySelector('[data-f11-date]')?.textContent).toBe(
      '05. Oktober 2026',
    );
  });

  it('formats matching CMS elements added after initialization', async () => {
    dateModule.init({ debug: false });
    const listener = vi.fn();
    document.addEventListener('f11:date-formatted', listener);

    const element = document.createElement('span');
    element.setAttribute('data-f11-date', '2026-10-05');
    document.body.append(element);

    await vi.waitFor(() => {
      expect(element.hasAttribute('data-f11-date-ready')).toBe(true);
    });

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ rawValue: '2026-10-05' }),
      }),
    );
  });
});
