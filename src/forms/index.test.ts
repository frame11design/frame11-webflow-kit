// @vitest-environment jsdom

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { formsModule } from './index';

beforeAll(() => {
  HTMLElement.prototype.scrollIntoView = vi.fn();
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
