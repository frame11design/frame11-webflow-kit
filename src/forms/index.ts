import type { Frame11Module } from '../core/init';
import { debugLog } from '../core/utils';
import { getMultistepController, initMultisteps } from './multistep';

const FORM_SELECTOR = 'form[data-f11-form]';
const SUBMIT_TRIGGER_SELECTOR = '[data-f11-submit]';

type FormField = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
type ValidationIssue = 'required' | 'invalid';

const attemptedForms = new WeakSet<HTMLFormElement>();
const errorElements = new WeakMap<FormField, HTMLElement>();
let errorId = 0;

function isFormField(element: Element): element is FormField {
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
  );
}

function getFormFields(form: HTMLFormElement): FormField[] {
  return Array.from(form.elements).filter(
    (element): element is FormField =>
      element instanceof Element && isFormField(element) && element.willValidate,
  );
}

function isRequiredEmpty(field: FormField): boolean {
  if (!field.required) {
    return false;
  }

  if (
    field instanceof HTMLInputElement &&
    (field.type === 'checkbox' || field.type === 'radio')
  ) {
    return field.validity.valueMissing;
  }

  return field.value.trim() === '';
}

function getValidationIssue(field: FormField): ValidationIssue | null {
  if (isRequiredEmpty(field) || field.validity.valueMissing) {
    return 'required';
  }

  return field.validity.valid ? null : 'invalid';
}

function getFallbackMessage(issue: ValidationIssue): string {
  const isGerman = document.documentElement.lang.toLowerCase().startsWith('de');

  if (issue === 'required') {
    return isGerman
      ? 'Bitte füllen Sie dieses Feld aus.'
      : 'Please fill out this field.';
  }

  return isGerman
    ? 'Bitte überprüfen Sie Ihre Eingabe.'
    : 'Please check your entry.';
}

function getErrorMessage(field: FormField, issue: ValidationIssue): string {
  const attribute =
    issue === 'required'
      ? 'data-f11-error-required'
      : 'data-f11-error-invalid';
  const customMessage = field.getAttribute(attribute)?.trim();

  return customMessage || field.validationMessage || getFallbackMessage(issue);
}

function addTokenAttribute(
  element: Element,
  attribute: string,
  token: string,
): void {
  const tokens = new Set(
    (element.getAttribute(attribute) ?? '').split(/\s+/).filter(Boolean),
  );
  tokens.add(token);
  element.setAttribute(attribute, [...tokens].join(' '));
}

function removeTokenAttribute(
  element: Element,
  attribute: string,
  token: string,
): void {
  const tokens = (element.getAttribute(attribute) ?? '')
    .split(/\s+/)
    .filter((value) => value && value !== token);

  if (tokens.length > 0) {
    element.setAttribute(attribute, tokens.join(' '));
  } else {
    element.removeAttribute(attribute);
  }
}

function createErrorElement(field: FormField): HTMLElement {
  const element = document.createElement('div');
  const content = document.createElement('div');
  const fieldName = field.id || field.name || 'field';
  let id = `${fieldName}-f11-error`;

  while (document.getElementById(id)) {
    errorId += 1;
    id = `${fieldName}-f11-error-${errorId}`;
  }

  element.id = id;
  element.setAttribute('data-f11-error', '');
  element.setAttribute('role', 'alert');
  element.setAttribute('aria-live', 'polite');
  element.setAttribute('aria-hidden', 'true');
  content.setAttribute('data-f11-error-content', '');
  element.append(content);
  field.insertAdjacentElement('afterend', element);
  errorElements.set(field, element);

  return element;
}

function getErrorElement(field: FormField): HTMLElement {
  return errorElements.get(field) ?? createErrorElement(field);
}

function getErrorContent(error: HTMLElement): HTMLElement {
  const content = error.querySelector<HTMLElement>('[data-f11-error-content]');

  if (!content) {
    throw new Error('[FRAME11] Form error content is missing.');
  }

  return content;
}

export function validateField(field: FormField): boolean {
  const issue = getValidationIssue(field);
  const error = errorElements.get(field);

  if (!issue) {
    field.removeAttribute('data-f11-invalid');
    field.removeAttribute('aria-invalid');

    if (error) {
      error.removeAttribute('data-f11-error-visible');
      error.setAttribute('aria-hidden', 'true');
      removeTokenAttribute(field, 'aria-describedby', error.id);

      if (field.getAttribute('aria-errormessage') === error.id) {
        field.removeAttribute('aria-errormessage');
      }
    }

    return true;
  }

  const activeError = getErrorElement(field);
  const wasVisible = activeError.hasAttribute('data-f11-error-visible');
  getErrorContent(activeError).textContent = getErrorMessage(field, issue);

  if (!wasVisible) {
    // Ensure a newly inserted error paints in its collapsed state first so the
    // initial reveal transitions instead of appearing at its final height.
    void activeError.offsetHeight;
  }

  activeError.setAttribute('data-f11-error-visible', '');
  activeError.setAttribute('aria-hidden', 'false');
  field.setAttribute('data-f11-invalid', '');
  field.setAttribute('aria-invalid', 'true');
  field.setAttribute('aria-errormessage', activeError.id);
  addTokenAttribute(field, 'aria-describedby', activeError.id);

  return false;
}

export function validateForm(form: HTMLFormElement): boolean {
  let firstInvalidField: FormField | null = null;

  for (const field of getFormFields(form)) {
    if (!validateField(field) && !firstInvalidField) {
      firstInvalidField = field;
    }
  }

  if (firstInvalidField) {
    const multistep = getMultistepController(form);

    if (multistep) {
      void multistep.revealField(firstInvalidField);
    } else {
      firstInvalidField.focus({ preventScroll: true });
      firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return false;
  }

  getMultistepController(form)?.markComplete();

  return true;
}

function getTargetForm(trigger: HTMLElement): HTMLFormElement | null {
  const targetId = trigger.getAttribute('data-f11-submit-form')?.trim();

  if (targetId) {
    const target = document.getElementById(targetId);
    return target instanceof HTMLFormElement ? target : null;
  }

  return trigger.closest('form');
}

function getNativeSubmitter(
  form: HTMLFormElement,
): HTMLButtonElement | HTMLInputElement | null {
  return form.querySelector(
    'input[type="submit"]:not([data-f11-submit]), button[type="submit"]:not([data-f11-submit]), button:not([type]):not([data-f11-submit])',
  );
}

function isNativeSubmitter(
  trigger: HTMLElement,
  form: HTMLFormElement,
): boolean {
  return (
    ((trigger instanceof HTMLButtonElement && trigger.type === 'submit') ||
      (trigger instanceof HTMLInputElement && trigger.type === 'submit')) &&
    trigger.form === form
  );
}

function prepareForm(form: HTMLFormElement): void {
  // Webflow still handles the real submit. Only the browser's native popover UI
  // is disabled so FRAME11 can render consistent inline errors instead.
  form.noValidate = true;
}

function prepareSubmitTrigger(trigger: HTMLElement): void {
  if (trigger instanceof HTMLAnchorElement) {
    trigger.setAttribute('role', 'button');
    return;
  }

  if (
    !(trigger instanceof HTMLButtonElement) &&
    !(trigger instanceof HTMLInputElement)
  ) {
    trigger.setAttribute('role', 'button');

    if (!trigger.hasAttribute('tabindex')) {
      trigger.tabIndex = 0;
    }
  }
}

function prepareElements(root: ParentNode): void {
  if (root instanceof HTMLFormElement && root.matches(FORM_SELECTOR)) {
    prepareForm(root);
  }

  if (root instanceof HTMLElement && root.matches(SUBMIT_TRIGGER_SELECTOR)) {
    prepareSubmitTrigger(root);
  }

  root.querySelectorAll<HTMLFormElement>(FORM_SELECTOR).forEach(prepareForm);
  root
    .querySelectorAll<HTMLElement>(SUBMIT_TRIGGER_SELECTOR)
    .forEach(prepareSubmitTrigger);
}

function bindDynamicElementPreparation(): void {
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node instanceof Element) {
          prepareElements(node);
        }
      }
    }

    initMultisteps(validateField);
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
}

function bindFormValidation(): void {
  document.addEventListener(
    'submit',
    (event) => {
      const form = event.target;

      if (!(form instanceof HTMLFormElement) || !form.matches(FORM_SELECTOR)) {
        return;
      }

      attemptedForms.add(form);

      if (!validateForm(form)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true,
  );

  document.addEventListener('focusout', (event) => {
    const field = event.target;

    if (
      field instanceof Element &&
      isFormField(field) &&
      field.form?.matches(FORM_SELECTOR)
    ) {
      validateField(field);
      getMultistepController(field.form)?.syncStepError(field);
    }
  });

  document.addEventListener('change', (event) => {
    const field = event.target;

    if (
      field instanceof Element &&
      isFormField(field) &&
      field.form?.matches(FORM_SELECTOR)
    ) {
      validateField(field);
      getMultistepController(field.form)?.syncStepError(field);
    }
  });

  document.addEventListener('input', (event) => {
    const field = event.target;

    if (
      field instanceof Element &&
      isFormField(field) &&
      field.form?.matches(FORM_SELECTOR) &&
      (attemptedForms.has(field.form) || field.hasAttribute('data-f11-invalid'))
    ) {
      validateField(field);
      getMultistepController(field.form)?.syncStepError(field);
    }
  });
}

function activateSubmitTrigger(trigger: HTMLElement, event: Event): void {
  const form = getTargetForm(trigger);

  if (!form || isNativeSubmitter(trigger, form)) {
    return;
  }

  event.preventDefault();
  prepareForm(form);
  const submitter = getNativeSubmitter(form);

  if (submitter) {
    form.requestSubmit(submitter);
  } else {
    form.requestSubmit();
  }
}

function bindSubmitTriggers(): void {
  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const trigger = event.target.closest<HTMLElement>(SUBMIT_TRIGGER_SELECTOR);

    if (trigger) {
      activateSubmitTrigger(trigger, event);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    if (!(event.target instanceof Element)) {
      return;
    }

    const trigger = event.target.closest<HTMLElement>(SUBMIT_TRIGGER_SELECTOR);

    if (
      trigger &&
      !(trigger instanceof HTMLButtonElement) &&
      !(trigger instanceof HTMLInputElement) &&
      !(trigger instanceof HTMLAnchorElement && event.key === 'Enter')
    ) {
      activateSubmitTrigger(trigger, event);
    }
  });
}

function initForms(debug: boolean): void {
  prepareElements(document);
  initMultisteps(validateField);
  bindDynamicElementPreparation();
  bindFormValidation();
  bindSubmitTriggers();
  debugLog(debug, 'Forms ready');
}

export const formsModule: Frame11Module = {
  name: 'forms',
  selector: '[data-f11-form], [data-f11-submit], [data-f11-multistep]',
  init: ({ debug }) => {
    initForms(debug);
  },
};
