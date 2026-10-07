const MULTISTEP_SELECTOR = '[data-f11-multistep]';
const STEP_SELECTOR = '[data-f11-step]';
const NEXT_SELECTOR = '[data-f11-next]';
const BACK_SELECTOR = '[data-f11-back]';
const STEP_ERROR_SELECTOR = '[data-f11-step-error]';

type FormField = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
type StepDirection = 'next' | 'back';
type FieldValidator = (field: FormField) => boolean;

const controllers = new WeakMap<HTMLFormElement, MultistepController>();
let stepId = 0;

function isFormField(element: Element): element is FormField {
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
  );
}

function getOwnedElements<T extends Element>(
  root: HTMLElement,
  selector: string,
): T[] {
  return Array.from(root.querySelectorAll<T>(selector)).filter(
    (element) => element.closest(MULTISTEP_SELECTOR) === root,
  );
}

function getStepFields(step: HTMLElement): FormField[] {
  return Array.from(step.querySelectorAll('input, select, textarea')).filter(
    (element): element is FormField => isFormField(element) && element.willValidate,
  );
}

function getStepElements<T extends Element>(
  step: HTMLElement,
  selector: string,
): T[] {
  return Array.from(step.querySelectorAll<T>(selector)).filter(
    (element) => element.closest(STEP_SELECTOR) === step,
  );
}

function parseTime(value: string, fallback: number): number {
  const trimmed = value.trim();

  if (!trimmed) {
    return fallback;
  }

  if (trimmed.endsWith('ms')) {
    return Number.parseFloat(trimmed) || 0;
  }

  if (trimmed.endsWith('s')) {
    return (Number.parseFloat(trimmed) || 0) * 1000;
  }

  return Number.parseFloat(trimmed) || fallback;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function prepareAction(element: HTMLElement): void {
  if (element instanceof HTMLAnchorElement) {
    element.setAttribute('role', 'button');
    return;
  }

  if (
    !(element instanceof HTMLButtonElement) &&
    !(element instanceof HTMLInputElement)
  ) {
    element.setAttribute('role', 'button');

    if (!element.hasAttribute('tabindex')) {
      element.tabIndex = 0;
    }
  }
}

function focusField(field: FormField): void {
  field.focus({ preventScroll: true });
  field.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

export class MultistepController {
  private readonly root: HTMLElement;
  private readonly form: HTMLFormElement;
  private readonly steps: HTMLElement[];
  private readonly viewport: HTMLElement;
  private readonly validateField: FieldValidator;
  private currentIndex = 0;
  private animating = false;
  private completed = false;

  constructor(
    root: HTMLElement,
    form: HTMLFormElement,
    steps: HTMLElement[],
    validateField: FieldValidator,
  ) {
    this.root = root;
    this.form = form;
    this.steps = steps;
    this.validateField = validateField;
    this.viewport =
      getOwnedElements<HTMLElement>(root, '[data-f11-step-viewport]')[0] ??
      form;

    this.prepare();
  }

  private prepare(): void {
    const requestedStart = Number.parseInt(
      this.root.getAttribute('data-f11-start-step') ?? '1',
      10,
    );

    this.currentIndex = Number.isFinite(requestedStart)
      ? Math.min(Math.max(requestedStart - 1, 0), this.steps.length - 1)
      : 0;

    this.steps.forEach((step, index) => {
      if (!step.id) {
        stepId += 1;
        step.id = `f11-step-${stepId}`;
      }

      step.setAttribute('role', 'group');
      this.setStepVisibility(step, index === this.currentIndex);

      getStepElements<HTMLElement>(step, STEP_ERROR_SELECTOR).forEach(
        (error) => {
          error.hidden = true;
          error.setAttribute('role', 'alert');
          error.setAttribute('aria-live', 'polite');
        },
      );
    });

    getOwnedElements<HTMLElement>(this.root, NEXT_SELECTOR).forEach(prepareAction);
    getOwnedElements<HTMLElement>(this.root, BACK_SELECTOR).forEach(prepareAction);

    this.root.setAttribute('data-f11-multistep-ready', '');
    this.bindEvents();
    this.updateProgress();
  }

  private bindEvents(): void {
    this.root.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) {
        return;
      }

      const next = event.target.closest<HTMLElement>(NEXT_SELECTOR);
      const back = event.target.closest<HTMLElement>(BACK_SELECTOR);
      const action = next ?? back;

      if (!action || action.closest(MULTISTEP_SELECTOR) !== this.root) {
        return;
      }

      event.preventDefault();

      if (next) {
        void this.next();
      } else {
        void this.back();
      }
    });

    this.root.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return;
      }

      if (!(event.target instanceof Element)) {
        return;
      }

      const action = event.target.closest<HTMLElement>(
        `${NEXT_SELECTOR}, ${BACK_SELECTOR}`,
      );

      if (
        !action ||
        action.closest(MULTISTEP_SELECTOR) !== this.root ||
        action instanceof HTMLButtonElement ||
        action instanceof HTMLInputElement ||
        (action instanceof HTMLAnchorElement && event.key === 'Enter')
      ) {
        return;
      }

      event.preventDefault();
      action.click();
    });
  }

  private setStepVisibility(step: HTMLElement, visible: boolean): void {
    step.hidden = !visible;
    step.inert = !visible;
    step.setAttribute('aria-hidden', visible ? 'false' : 'true');

    if (visible) {
      step.setAttribute('data-f11-step-active', '');
    } else {
      step.removeAttribute('data-f11-step-active');
    }
  }

  private getAnimatedItems(step: HTMLElement): HTMLElement[] {
    return Array.from(step.children).filter(
      (element): element is HTMLElement =>
        element instanceof HTMLElement &&
        !element.hasAttribute('data-f11-step-static'),
    );
  }

  private setStagger(items: HTMLElement[]): void {
    const styles = getComputedStyle(this.root);
    const stagger = parseTime(
      styles.getPropertyValue('--f11-step-stagger'),
      60,
    );

    items.forEach((item, index) => {
      item.style.setProperty('--f11-step-delay', `${index * stagger}ms`);
    });
  }

  private clearStagger(items: HTMLElement[]): void {
    items.forEach((item) => item.style.removeProperty('--f11-step-delay'));
  }

  private getTransitionTime(itemCount: number): number {
    if (prefersReducedMotion()) {
      return 0;
    }

    const styles = getComputedStyle(this.root);
    const duration = parseTime(
      styles.getPropertyValue('--f11-step-duration'),
      240,
    );
    const stagger = parseTime(
      styles.getPropertyValue('--f11-step-stagger'),
      60,
    );

    return duration + Math.max(itemCount - 1, 0) * stagger;
  }

  private freezeViewport(): number | null {
    const height = this.viewport.getBoundingClientRect().height;

    if (height <= 0) {
      return null;
    }

    this.viewport.style.height = `${height}px`;
    this.viewport.style.overflow = 'hidden';
    void this.viewport.offsetHeight;
    return height;
  }

  private animateViewport(startHeight: number | null): void {
    if (startHeight === null) {
      return;
    }

    // Measure the new natural height without letting the temporary `auto`
    // value paint. scrollHeight cannot measure a shrink while the viewport is
    // still fixed to the taller outgoing step.
    this.viewport.style.transition = 'none';
    this.viewport.style.height = 'auto';
    const targetHeight = this.viewport.getBoundingClientRect().height;
    this.viewport.style.height = `${startHeight}px`;
    void this.viewport.offsetHeight;
    this.viewport.style.removeProperty('transition');
    void this.viewport.offsetHeight;
    this.viewport.style.height = `${targetHeight}px`;
  }

  private releaseViewport(): void {
    this.viewport.style.removeProperty('height');
    this.viewport.style.removeProperty('overflow');
  }

  private setStepError(step: HTMLElement, visible: boolean): void {
    getStepElements<HTMLElement>(step, STEP_ERROR_SELECTOR).forEach((error) => {
      error.hidden = !visible;

      if (visible) {
        error.setAttribute('data-f11-step-error-visible', '');
      } else {
        error.removeAttribute('data-f11-step-error-visible');
      }
    });
  }

  private validateCurrentStep(): FormField | null {
    const step = this.steps[this.currentIndex];
    let firstInvalidField: FormField | null = null;

    if (!step) {
      return null;
    }

    for (const field of getStepFields(step)) {
      if (!this.validateField(field) && !firstInvalidField) {
        firstInvalidField = field;
      }
    }

    this.setStepError(step, Boolean(firstInvalidField));
    return firstInvalidField;
  }

  private async next(): Promise<void> {
    if (this.animating) {
      return;
    }

    const invalidField = this.validateCurrentStep();

    if (invalidField) {
      focusField(invalidField);
      return;
    }

    await this.goTo(this.currentIndex + 1, 'next');
  }

  private async back(): Promise<void> {
    if (this.animating) {
      return;
    }

    await this.goTo(this.currentIndex - 1, 'back');
  }

  private async goTo(index: number, direction: StepDirection): Promise<void> {
    if (
      this.animating ||
      index < 0 ||
      index >= this.steps.length ||
      index === this.currentIndex
    ) {
      return;
    }

    const current = this.steps[this.currentIndex];
    const next = this.steps[index];

    if (!current || !next) {
      return;
    }

    if (prefersReducedMotion()) {
      this.setStepVisibility(current, false);
      this.currentIndex = index;
      this.setStepVisibility(next, true);
      this.completed = false;
      this.updateProgress();
      return;
    }

    this.animating = true;
    this.root.setAttribute('data-f11-multistep-animating', '');

    const startHeight = this.freezeViewport();
    const currentItems = this.getAnimatedItems(current);
    const nextItems = this.getAnimatedItems(next);
    this.setStagger(currentItems);
    current.setAttribute(
      'data-f11-step-transition',
      direction === 'next' ? 'exit-next' : 'exit-back',
    );

    await wait(this.getTransitionTime(currentItems.length));

    current.removeAttribute('data-f11-step-transition');
    this.clearStagger(currentItems);
    this.setStepVisibility(current, false);

    this.currentIndex = index;
    this.completed = false;
    this.setStepVisibility(next, true);
    next.setAttribute(
      'data-f11-step-transition',
      direction === 'next' ? 'enter-next' : 'enter-back',
    );
    this.setStagger(nextItems);
    this.updateProgress();
    this.animateViewport(startHeight);
    void next.offsetHeight;

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          next.removeAttribute('data-f11-step-transition');
          resolve();
        });
      });
    });

    await wait(this.getTransitionTime(nextItems.length));

    this.clearStagger(nextItems);
    this.releaseViewport();
    this.root.removeAttribute('data-f11-multistep-animating');
    this.animating = false;
  }

  private getProgressTotal(): number {
    return (
      this.steps.length +
      (this.root.hasAttribute('data-f11-progress-complete') ? 1 : 0)
    );
  }

  private updateProgress(): void {
    const total = this.getProgressTotal();
    const current = this.completed ? total : this.currentIndex + 1;
    const percent = (current / total) * 100;
    const isGerman = document.documentElement.lang
      .toLowerCase()
      .startsWith('de');

    this.root.setAttribute('data-f11-current-step', String(current));
    this.root.setAttribute('data-f11-total-steps', String(total));

    getOwnedElements<HTMLElement>(this.root, '[data-f11-progress]').forEach(
      (progress) => {
        progress.style.setProperty('--f11-progress', `${percent}%`);
        progress.style.width = `${percent}%`;
        progress.setAttribute('role', 'progressbar');
        progress.setAttribute('aria-valuemin', '1');
        progress.setAttribute('aria-valuemax', String(total));
        progress.setAttribute('aria-valuenow', String(current));
        progress.setAttribute('aria-valuetext', `${current} / ${total}`);
      },
    );

    getOwnedElements<HTMLElement>(
      this.root,
      '[data-f11-progress-text]',
    ).forEach((text) => {
      const template =
        text.getAttribute('data-f11-progress-template') ||
        (isGerman ? 'Schritt {current} von {total}' : 'Step {current} of {total}');

      text.textContent = template
        .split('{current}')
        .join(String(current))
        .split('{total}')
        .join(String(total));
      text.setAttribute('aria-live', 'polite');
    });

    getOwnedElements<HTMLElement>(
      this.root,
      '[data-f11-progress-current]',
    ).forEach((element) => {
      element.textContent = String(current);
    });

    getOwnedElements<HTMLElement>(
      this.root,
      '[data-f11-progress-total]',
    ).forEach((element) => {
      element.textContent = String(total);
    });
  }

  syncStepError(field: FormField): void {
    const step = field.closest<HTMLElement>(STEP_SELECTOR);

    if (
      step &&
      step.closest(MULTISTEP_SELECTOR) === this.root &&
      !step.querySelector('[data-f11-invalid]')
    ) {
      this.setStepError(step, false);
    }
  }

  async revealField(field: FormField): Promise<void> {
    const step = field.closest<HTMLElement>(STEP_SELECTOR);
    const index = step ? this.steps.indexOf(step) : -1;

    if (index >= 0 && index !== this.currentIndex) {
      await this.goTo(index, index > this.currentIndex ? 'next' : 'back');
    }

    if (step) {
      this.setStepError(step, true);
    }

    focusField(field);
  }

  markComplete(): void {
    if (!this.root.hasAttribute('data-f11-progress-complete')) {
      return;
    }

    this.completed = true;
    this.updateProgress();
  }
}

export function initMultisteps(validateField: FieldValidator): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.querySelectorAll<HTMLElement>(MULTISTEP_SELECTOR).forEach((root) => {
    const form =
      root instanceof HTMLFormElement
        ? root
        : root.querySelector<HTMLFormElement>('form');
    const steps = getOwnedElements<HTMLElement>(root, STEP_SELECTOR);

    if (!form || steps.length === 0 || controllers.has(form)) {
      return;
    }

    controllers.set(
      form,
      new MultistepController(root, form, steps, validateField),
    );
  });
}

export function getMultistepController(
  form: HTMLFormElement,
): MultistepController | undefined {
  return controllers.get(form);
}
