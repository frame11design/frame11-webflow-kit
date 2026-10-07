// @vitest-environment jsdom

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { formsModule } from './index';

beforeAll(() => {
  HTMLElement.prototype.scrollIntoView = vi.fn();
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({ matches: true }),
  );
  formsModule.init({ debug: false });
});

beforeEach(() => {
  document.documentElement.lang = 'de';
  document.body.innerHTML = '';
});

describe('FRAME11 form validation', () => {
  it('renders the configured required error and focuses the field', () => {
    document.body.innerHTML = `
      <form data-f11-form>
        <input
          id="first-name"
          name="first-name"
          required
          data-f11-error-required="Bitte gib deinen Vornamen ein."
        >
      </form>
    `;
    const form = document.querySelector('form') as HTMLFormElement;
    const field = document.querySelector('input') as HTMLInputElement;
    const event = new SubmitEvent('submit', {
      bubbles: true,
      cancelable: true,
    });

    form.dispatchEvent(event);

    const error = document.querySelector<HTMLElement>('[data-f11-error]');
    expect(event.defaultPrevented).toBe(true);
    expect(error?.textContent).toBe('Bitte gib deinen Vornamen ein.');
    expect(error?.hasAttribute('data-f11-error-visible')).toBe(true);
    expect(error?.getAttribute('aria-hidden')).toBe('false');
    expect(error?.querySelector('[data-f11-error-content]')).not.toBeNull();
    expect(field.getAttribute('aria-invalid')).toBe('true');
    expect(field.getAttribute('aria-describedby')).toContain(error?.id);
    expect(document.activeElement).toBe(field);
  });

  it('uses the invalid message for malformed email and clears it while typing', () => {
    document.body.innerHTML = `
      <form data-f11-form>
        <input
          type="email"
          name="email"
          required
          value="keine-email"
          data-f11-error-required="Bitte gib deine E-Mail-Adresse ein."
          data-f11-error-invalid="Bitte gib eine gültige E-Mail-Adresse ein."
        >
      </form>
    `;
    const form = document.querySelector('form') as HTMLFormElement;
    const field = document.querySelector('input') as HTMLInputElement;

    form.dispatchEvent(
      new SubmitEvent('submit', { bubbles: true, cancelable: true }),
    );

    const error = document.querySelector<HTMLElement>('[data-f11-error]');
    expect(error?.textContent).toBe(
      'Bitte gib eine gültige E-Mail-Adresse ein.',
    );

    field.value = 'hallo@frame11.at';
    field.dispatchEvent(new InputEvent('input', { bubbles: true }));

    expect(error?.hasAttribute('data-f11-error-visible')).toBe(false);
    expect(error?.getAttribute('aria-hidden')).toBe('true');
    expect(field.hasAttribute('data-f11-invalid')).toBe(false);
    expect(field.hasAttribute('aria-invalid')).toBe(false);
  });

  it('preserves unrelated aria-describedby references', () => {
    document.body.innerHTML = `
      <form data-f11-form>
        <p id="email-help">Wir geben deine Adresse nicht weiter.</p>
        <input name="email" required aria-describedby="email-help">
      </form>
    `;
    const form = document.querySelector('form') as HTMLFormElement;
    const field = document.querySelector('input') as HTMLInputElement;

    form.dispatchEvent(
      new SubmitEvent('submit', { bubbles: true, cancelable: true }),
    );
    field.value = 'test';
    field.dispatchEvent(new InputEvent('input', { bubbles: true }));

    expect(field.getAttribute('aria-describedby')).toBe('email-help');
  });
});

describe('FRAME11 custom submit trigger', () => {
  it('requests a native submit using the hidden Webflow submitter', () => {
    document.body.innerHTML = `
      <form data-f11-form>
        <input name="name" value="Michael">
        <input type="submit" class="button-invisible" value="Absenden">
        <a href="#" data-f11-submit><span>Nachricht senden</span></a>
      </form>
    `;
    const form = document.querySelector('form') as HTMLFormElement;
    const nativeSubmit = document.querySelector(
      'input[type="submit"]',
    ) as HTMLInputElement;
    const requestSubmit = vi
      .spyOn(form, 'requestSubmit')
      .mockImplementation(() => undefined);
    const label = document.querySelector('[data-f11-submit] span') as HTMLElement;

    label.click();

    expect(requestSubmit).toHaveBeenCalledWith(nativeSubmit);
  });

  it('supports a trigger outside the form through an explicit form id', () => {
    document.body.innerHTML = `
      <form id="contact" data-f11-form>
        <button type="submit">Absenden</button>
      </form>
      <button type="button" data-f11-submit data-f11-submit-form="contact">
        Kontakt aufnehmen
      </button>
    `;
    const form = document.querySelector('form') as HTMLFormElement;
    const nativeSubmit = form.querySelector('button') as HTMLButtonElement;
    const requestSubmit = vi
      .spyOn(form, 'requestSubmit')
      .mockImplementation(() => undefined);

    document.querySelector<HTMLElement>('[data-f11-submit]')?.click();

    expect(requestSubmit).toHaveBeenCalledWith(nativeSubmit);
  });
});

describe('FRAME11 multi-step forms', () => {
  it('validates the current step and updates progress in both directions', async () => {
    document.body.innerHTML = `
      <section data-f11-multistep data-f11-progress-complete>
        <div data-f11-progress></div>
        <div data-f11-progress-text></div>
        <form data-f11-form data-f11-step-viewport>
          <div data-f11-step>
            <input name="company" required>
            <div data-f11-step-error>Bitte prüfen.</div>
            <a href="#" data-f11-next>Weiter</a>
          </div>
          <div data-f11-step>
            <input name="email" type="email" required>
            <a href="#" data-f11-back>Zurück</a>
          </div>
        </form>
      </section>
    `;
    await Promise.resolve();

    const steps = document.querySelectorAll<HTMLElement>('[data-f11-step]');
    const firstField = document.querySelector<HTMLInputElement>(
      'input[name="company"]',
    );
    const progress = document.querySelector<HTMLElement>('[data-f11-progress]');
    const progressText = document.querySelector<HTMLElement>(
      '[data-f11-progress-text]',
    );

    document.querySelector<HTMLElement>('[data-f11-next]')?.click();

    expect(steps[0]?.hidden).toBe(false);
    expect(steps[1]?.hidden).toBe(true);
    expect(document.querySelector<HTMLElement>('[data-f11-step-error]')?.hidden).toBe(
      false,
    );

    if (firstField) {
      firstField.value = 'FRAME11';
    }
    document.querySelector<HTMLElement>('[data-f11-next]')?.click();

    expect(steps[0]?.hidden).toBe(true);
    expect(steps[1]?.hidden).toBe(false);
    expect(Number.parseFloat(progress?.style.width ?? '')).toBeCloseTo(66.67, 1);
    expect(progressText?.textContent).toBe('Schritt 2 von 3');

    document.querySelector<HTMLElement>('[data-f11-back]')?.click();

    expect(steps[0]?.hidden).toBe(false);
    expect(steps[1]?.hidden).toBe(true);
    expect(Number.parseFloat(progress?.style.width ?? '')).toBeCloseTo(33.33, 1);
  });

  it('reveals an invalid hidden step and completes optional submit progress', async () => {
    document.body.innerHTML = `
      <section data-f11-multistep data-f11-progress-complete>
        <div data-f11-progress></div>
        <form data-f11-form>
          <div data-f11-step>
            <input name="company" required value="FRAME11">
            <button type="button" data-f11-next>Weiter</button>
          </div>
          <div data-f11-step>
            <input name="email" type="email" required value="hello@frame11.at">
          </div>
        </form>
      </section>
    `;
    await Promise.resolve();

    document.querySelector<HTMLElement>('[data-f11-next]')?.click();

    const form = document.querySelector('form') as HTMLFormElement;
    const steps = document.querySelectorAll<HTMLElement>('[data-f11-step]');
    const company = document.querySelector<HTMLInputElement>(
      'input[name="company"]',
    ) as HTMLInputElement;
    const progress = document.querySelector<HTMLElement>('[data-f11-progress]');

    company.value = '';
    const invalidSubmit = new SubmitEvent('submit', {
      bubbles: true,
      cancelable: true,
    });
    form.dispatchEvent(invalidSubmit);
    await Promise.resolve();

    expect(invalidSubmit.defaultPrevented).toBe(true);
    expect(steps[0]?.hidden).toBe(false);
    expect(steps[1]?.hidden).toBe(true);
    expect(document.activeElement).toBe(company);

    company.value = 'FRAME11';
    const validSubmit = new SubmitEvent('submit', {
      bubbles: true,
      cancelable: true,
    });
    form.dispatchEvent(validSubmit);

    expect(validSubmit.defaultPrevented).toBe(false);
    expect(progress?.style.width).toBe('100%');
    expect(progress?.getAttribute('aria-valuenow')).toBe('3');
  });
});
