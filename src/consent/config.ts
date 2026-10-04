import type * as CookieConsent from 'vanilla-cookieconsent';

const CONFIG_SELECTOR = 'script[data-f11-consent-config]';
const CONTROLLED_KEYS = [
  'root',
  'manageScriptTags',
  'onFirstConsent',
  'onConsent',
  'onChange',
  'onModalShow',
  'onModalHide',
  'onModalReady',
] as const;

export type Frame11ConsentConfig = Omit<
  CookieConsent.CookieConsentConfig,
  | 'root'
  | 'manageScriptTags'
  | 'onFirstConsent'
  | 'onConsent'
  | 'onChange'
  | 'onModalShow'
  | 'onModalHide'
  | 'onModalReady'
>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertValidConfig(value: unknown): asserts value is Frame11ConsentConfig {
  if (!isRecord(value)) {
    throw new Error('The consent configuration must be a JSON object.');
  }

  for (const key of CONTROLLED_KEYS) {
    if (key in value) {
      throw new Error(`The property "${key}" is managed by FRAME11.`);
    }
  }

  if (value.mode !== undefined && value.mode !== 'opt-in') {
    throw new Error('FRAME11 consent currently supports only mode "opt-in".');
  }

  if (!isRecord(value.categories)) {
    throw new Error('The consent configuration requires a categories object.');
  }

  const necessary = value.categories.necessary;

  if (!isRecord(necessary) || necessary.readOnly !== true) {
    throw new Error('The "necessary" category must exist and use readOnly: true.');
  }

  for (const [name, category] of Object.entries(value.categories)) {
    if (!isRecord(category)) {
      throw new Error(`The category "${name}" must be an object.`);
    }

    if (name !== 'necessary' && category.enabled === true) {
      throw new Error(
        `The optional category "${name}" must not use enabled: true in opt-in mode.`,
      );
    }
  }

  if (!isRecord(value.language)) {
    throw new Error('The consent configuration requires a language object.');
  }

  if (typeof value.language.default !== 'string') {
    throw new Error('language.default must be a locale string.');
  }

  if (!isRecord(value.language.translations)) {
    throw new Error('language.translations must be an object.');
  }

  if (!(value.language.default in value.language.translations)) {
    throw new Error(
      `No translation exists for the default locale "${value.language.default}".`,
    );
  }
}

export function readConsentConfig(): Frame11ConsentConfig {
  const configElements = document.querySelectorAll<HTMLScriptElement>(CONFIG_SELECTOR);

  if (configElements.length !== 1) {
    throw new Error(
      `Expected exactly one ${CONFIG_SELECTOR} element, found ${configElements.length}.`,
    );
  }

  const configElement = configElements[0];

  if (!configElement) {
    throw new Error('Consent configuration element is unavailable.');
  }

  if (configElement.type !== 'application/json') {
    throw new Error('The consent configuration script must use type="application/json".');
  }

  const source = configElement.textContent?.trim();

  if (!source) {
    throw new Error('The consent configuration is empty.');
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(source);
  } catch {
    throw new Error('The consent configuration contains invalid JSON.');
  }

  assertValidConfig(parsed);

  return {
    ...parsed,
    mode: 'opt-in',
  };
}
