import { debugLog } from '../core/utils';

const TRACKED_FORM_SELECTOR = 'form[data-f11-form-track]';
const SUCCESS_SELECTOR = '[data-f11-form-success], .w-form-done';

const initializedForms = new WeakSet<HTMLFormElement>();

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export interface FormSuccessDetail {
  form: HTMLFormElement;
  formName: string;
  successElement: HTMLElement;
}

function getDataLayer(): unknown[] {
  window.dataLayer = window.dataLayer ?? [];
  return window.dataLayer;
}

function isVisible(element: HTMLElement): boolean {
  if (element.hidden || element.getAttribute('aria-hidden') === 'true') {
    return false;
  }

  const styles = window.getComputedStyle(element);

  return (
    styles.display !== 'none' &&
    styles.visibility !== 'hidden' &&
    element.getClientRects().length > 0
  );
}

function getSuccessElement(form: HTMLFormElement): HTMLElement | null {
  const wrapper = form.closest<HTMLElement>('.w-form');

  return wrapper?.querySelector<HTMLElement>(SUCCESS_SELECTOR) ?? null;
}

function getFormName(form: HTMLFormElement): string {
  const configuredName = form.getAttribute('data-f11-form-name')?.trim();
  const webflowName = form.getAttribute('data-name')?.trim();
  const nativeName = form.getAttribute('name')?.trim();
  const id = form.id.trim();

  return (
    configuredName ||
    webflowName ||
    nativeName ||
    id ||
    (document.documentElement.lang.toLowerCase().startsWith('de')
      ? 'Formular'
      : 'Form')
  );
}

function trackFormSuccess(
  form: HTMLFormElement,
  successElement: HTMLElement,
  debug: boolean,
): void {
  const formName = getFormName(form);
  const detail: FormSuccessDetail = {
    form,
    formName,
    successElement,
  };

  getDataLayer().push({
    event: 'form_submit_success',
    form_name: formName,
  });

  form.dispatchEvent(
    new CustomEvent<FormSuccessDetail>('f11:form-success', {
      bubbles: true,
      detail,
    }),
  );

  debugLog(debug, `Tracked successful form submission: ${formName}`);
}

function prepareForm(form: HTMLFormElement, debug: boolean): void {
  if (initializedForms.has(form)) {
    return;
  }

  const successElement = getSuccessElement(form);

  // A Webflow success message normally exists beside the form. If it is added
  // later, the document observer will call prepareForm again.
  if (!successElement) {
    return;
  }

  initializedForms.add(form);
  form.setAttribute('data-f11-form-track-ready', '');

  let wasVisible = false;

  const evaluate = () => {
    const visible = isVisible(successElement);

    if (visible && !wasVisible) {
      trackFormSuccess(form, successElement, debug);
    }

    wasVisible = visible;
  };

  const observer = new MutationObserver(evaluate);
  observer.observe(successElement, {
    attributes: true,
    attributeFilter: ['style', 'class', 'hidden', 'aria-hidden'],
  });

  evaluate();
}

function prepareForms(root: ParentNode, debug: boolean): void {
  if (root instanceof HTMLFormElement && root.matches(TRACKED_FORM_SELECTOR)) {
    prepareForm(root, debug);
  }

  root
    .querySelectorAll<HTMLFormElement>(TRACKED_FORM_SELECTOR)
    .forEach((form) => prepareForm(form, debug));
}

function bindDynamicFormTracking(debug: boolean): void {
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (!(node instanceof Element)) {
          continue;
        }

        prepareForms(node, debug);

        const wrapper = node.closest<HTMLElement>('.w-form');
        const relatedForm = wrapper?.querySelector<HTMLFormElement>(
          TRACKED_FORM_SELECTOR,
        );

        if (relatedForm) {
          prepareForm(relatedForm, debug);
        }
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

export function initFormSuccessTracking(debug: boolean): void {
  prepareForms(document, debug);
  bindDynamicFormTracking(debug);
  debugLog(debug, 'Form success tracking ready');
}
