// @vitest-environment jsdom

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { integrationsModule } from './index';

function makeVisible(element: HTMLElement): void {
  vi.spyOn(element, 'getClientRects').mockReturnValue({
    length: 1,
    item: () => null,
    [Symbol.iterator]: function* () {
      yield new DOMRect();
    },
  } as DOMRectList);
}

async function flushMutations(): Promise<void> {
  await new Promise((resolve) => window.setTimeout(resolve, 0));
}

beforeAll(() => {
  integrationsModule.init({ debug: false });
});

beforeEach(async () => {
  document.documentElement.lang = 'de';
  document.body.innerHTML = '';
  window.dataLayer = [];
  await flushMutations();
});

describe('FRAME11 form success tracking', () => {
  it('pushes the HGW-compatible GTM event when Webflow reveals success', async () => {
    document.body.innerHTML = `
      <div class="w-form">
        <form data-f11-form-track data-f11-form-name="Kontaktformular"></form>
        <div class="w-form-done contact-success" style="display: none"></div>
      </div>
    `;

    const form = document.querySelector('form') as HTMLFormElement;
    const success = document.querySelector('.w-form-done') as HTMLElement;
    const eventListener = vi.fn();
    makeVisible(success);
    form.addEventListener('f11:form-success', eventListener);

    await flushMutations();
    success.style.display = 'block';

    await vi.waitFor(() => {
      expect(window.dataLayer).toEqual([
        {
          event: 'form_submit_success',
          form_name: 'Kontaktformular',
        },
      ]);
    });

    expect(form.hasAttribute('data-f11-form-track-ready')).toBe(true);
    expect(eventListener).toHaveBeenCalledOnce();
    expect(eventListener.mock.calls[0]?.[0]).toMatchObject({
      detail: { formName: 'Kontaktformular', form, successElement: success },
    });
  });

  it('does not duplicate the event while the success message stays visible', async () => {
    document.body.innerHTML = `
      <div class="w-form">
        <form data-f11-form-track data-f11-form-name="Anfrage"></form>
        <div class="w-form-done" style="display: none"></div>
      </div>
    `;

    const success = document.querySelector('.w-form-done') as HTMLElement;
    makeVisible(success);

    await flushMutations();
    success.style.display = 'block';
    await flushMutations();
    success.classList.add('is-animated');
    await flushMutations();

    expect(window.dataLayer).toHaveLength(1);
  });

  it('tracks a later success transition again and falls back to Webflow data-name', async () => {
    document.body.innerHTML = `
      <div class="w-form">
        <form data-f11-form-track data-name="Download Formular"></form>
        <div data-f11-form-success style="display: none"></div>
      </div>
    `;

    const success = document.querySelector(
      '[data-f11-form-success]',
    ) as HTMLElement;
    makeVisible(success);

    await flushMutations();
    success.style.display = 'block';
    await flushMutations();
    success.style.display = 'none';
    await flushMutations();
    success.style.display = 'block';

    await vi.waitFor(() => {
      expect(window.dataLayer).toEqual([
        {
          event: 'form_submit_success',
          form_name: 'Download Formular',
        },
        {
          event: 'form_submit_success',
          form_name: 'Download Formular',
        },
      ]);
    });
  });
});
