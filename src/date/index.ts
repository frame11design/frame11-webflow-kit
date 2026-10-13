import type { Frame11Module } from '../core/init';
import { debugLog } from '../core/utils';

const DATE_SELECTOR = '[data-f11-date]';
const DATE_CONFIG_SELECTOR =
  'script[type="application/json"][data-f11-date-config]';

const initializedDates = new WeakSet<HTMLElement>();
let dateObserver: MutationObserver | null = null;

type DateDayOption = 'numeric' | '2-digit';
type DateMonthOption =
  | 'numeric'
  | '2-digit'
  | 'long'
  | 'short'
  | 'narrow';
type DateYearOption = 'numeric' | '2-digit';
type DateWeekdayOption = 'long' | 'short' | 'narrow';

interface DateFormatRule {
  day?: DateDayOption | null;
  locale?: string;
  month?: DateMonthOption | null;
  weekday?: DateWeekdayOption | null;
  year?: DateYearOption | null;
}

interface DateConfig {
  default: DateFormatRule;
  locales: Record<string, DateFormatRule>;
}

export interface DateFormattedDetail {
  date: Date;
  element: HTMLElement;
  locale: string;
  rawValue: string;
}

const DEFAULT_FORMAT: DateFormatRule = {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
};

const DAY_OPTIONS = new Set<DateDayOption>(['numeric', '2-digit']);
const MONTH_OPTIONS = new Set<DateMonthOption>([
  'numeric',
  '2-digit',
  'long',
  'short',
  'narrow',
]);
const YEAR_OPTIONS = new Set<DateYearOption>(['numeric', '2-digit']);
const WEEKDAY_OPTIONS = new Set<DateWeekdayOption>([
  'long',
  'short',
  'narrow',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readOption<T extends string>(
  value: unknown,
  options: Set<T>,
): T | null | undefined {
  if (value === 'none') return null;

  return typeof value === 'string' && options.has(value as T)
    ? (value as T)
    : undefined;
}

function mergeRules(...rules: DateFormatRule[]): DateFormatRule {
  const merged: DateFormatRule = {};

  for (const rule of rules) {
    for (const [key, value] of Object.entries(rule)) {
      if (value !== undefined) {
        Object.assign(merged, { [key]: value });
      }
    }
  }

  return merged;
}

function readRule(value: unknown): DateFormatRule {
  if (!isRecord(value)) return {};

  const locale =
    typeof value.locale === 'string' && value.locale.trim()
      ? value.locale.trim()
      : undefined;

  return {
    day: readOption(value.day, DAY_OPTIONS),
    locale,
    month: readOption(value.month, MONTH_OPTIONS),
    weekday: readOption(value.weekday, WEEKDAY_OPTIONS),
    year: readOption(value.year, YEAR_OPTIONS),
  };
}

function readConfig(debug: boolean): DateConfig {
  const config: DateConfig = {
    default: { ...DEFAULT_FORMAT },
    locales: {},
  };
  const script = document.querySelector<HTMLScriptElement>(
    DATE_CONFIG_SELECTOR,
  );

  if (!script?.textContent?.trim()) return config;

  try {
    const parsed: unknown = JSON.parse(script.textContent);
    if (!isRecord(parsed)) throw new Error('The root value must be an object.');

    config.default = mergeRules(DEFAULT_FORMAT, readRule(parsed.default));

    if (isRecord(parsed.locales)) {
      for (const [language, value] of Object.entries(parsed.locales)) {
        config.locales[language.toLowerCase()] = readRule(value);
      }
    }
  } catch (error) {
    console.error('[FRAME11] Invalid date configuration', error);
    debugLog(debug, 'Using the default date format');
  }

  return config;
}

function readRawValue(element: HTMLElement): string {
  const triggerValue = element.getAttribute('data-f11-date')?.trim() ?? '';

  if (
    triggerValue &&
    triggerValue !== 'true' &&
    triggerValue !== '1'
  ) {
    return triggerValue;
  }

  const explicitValue = element
    .getAttribute('data-f11-date-value')
    ?.trim();
  if (explicitValue) return explicitValue;

  if (element instanceof HTMLTimeElement && element.dateTime.trim()) {
    return element.dateTime.trim();
  }

  return element.textContent?.trim() ?? '';
}

function parseIsoCalendarDate(rawValue: string): Date | null {
  const match = rawValue.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/,
  );
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

function getRequestedLocale(element: HTMLElement): string {
  return (
    element.getAttribute('data-f11-date-locale')?.trim() ||
    document.documentElement.lang.trim() ||
    navigator.language ||
    'en'
  );
}

function getLanguageRule(
  locale: string,
  config: DateConfig,
): DateFormatRule {
  const normalizedLocale = locale.toLowerCase();
  const baseLanguage = normalizedLocale.split('-')[0] ?? normalizedLocale;

  return (
    config.locales[normalizedLocale] ??
    config.locales[baseLanguage] ??
    {}
  );
}

function readElementRule(element: HTMLElement): DateFormatRule {
  const readAttribute = <T extends string>(
    attribute: string,
    options: Set<T>,
  ): T | null | undefined => {
    const value = element.getAttribute(attribute)?.trim();
    return readOption(value, options);
  };

  return {
    day: readAttribute('data-f11-date-day', DAY_OPTIONS),
    month: readAttribute('data-f11-date-month', MONTH_OPTIONS),
    weekday: readAttribute('data-f11-date-weekday', WEEKDAY_OPTIONS),
    year: readAttribute('data-f11-date-year', YEAR_OPTIONS),
  };
}

function formatDate(
  date: Date,
  requestedLocale: string,
  rule: DateFormatRule,
): { locale: string; value: string } {
  const locale = rule.locale || requestedLocale;
  const options: Intl.DateTimeFormatOptions = {
    day: rule.day ?? undefined,
    month: rule.month ?? undefined,
    timeZone: 'UTC',
    weekday: rule.weekday ?? undefined,
    year: rule.year ?? undefined,
  };

  try {
    const formatter = new Intl.DateTimeFormat(locale, options);
    return {
      locale: formatter.resolvedOptions().locale,
      value: formatter.format(date),
    };
  } catch {
    const formatter = new Intl.DateTimeFormat('en', options);
    return {
      locale: formatter.resolvedOptions().locale,
      value: formatter.format(date),
    };
  }
}

function initDate(
  element: HTMLElement,
  config: DateConfig,
  debug: boolean,
): void {
  if (
    initializedDates.has(element) ||
    element.getAttribute('data-f11-date') === 'false'
  ) {
    return;
  }

  const rawValue = readRawValue(element);
  const date = parseIsoCalendarDate(rawValue);

  if (!date) {
    element.setAttribute('data-f11-date-error', 'invalid-value');
    debugLog(
      debug,
      `Date skipped: expected YYYY-MM-DD, received "${rawValue}"`,
    );
    return;
  }

  const requestedLocale = getRequestedLocale(element);
  const rule = mergeRules(
    config.default,
    getLanguageRule(requestedLocale, config),
    readElementRule(element),
  );
  const formatted = formatDate(date, requestedLocale, rule);

  initializedDates.add(element);
  element.textContent = formatted.value;
  element.removeAttribute('data-f11-date-error');
  element.setAttribute('data-f11-date-locale-resolved', formatted.locale);
  element.setAttribute('data-f11-date-ready', '');

  element.dispatchEvent(
    new CustomEvent<DateFormattedDetail>('f11:date-formatted', {
      bubbles: true,
      detail: {
        date,
        element,
        locale: formatted.locale,
        rawValue,
      },
    }),
  );
}

function scanDates(
  root: ParentNode,
  config: DateConfig,
  debug: boolean,
): void {
  if (root instanceof HTMLElement && root.matches(DATE_SELECTOR)) {
    initDate(root, config, debug);
  }

  root
    .querySelectorAll<HTMLElement>(DATE_SELECTOR)
    .forEach((element) => initDate(element, config, debug));
}

export const dateModule: Frame11Module = {
  name: 'date',
  selector: DATE_SELECTOR,
  init: ({ debug }) => {
    const config = readConfig(debug);
    scanDates(document, config, debug);

    if (!dateObserver) {
      dateObserver = new MutationObserver((records) => {
        records.forEach((record) => {
          record.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              scanDates(node, config, debug);
            }
          });
        });
      });
      dateObserver.observe(document.body, { childList: true, subtree: true });
    }

    debugLog(debug, 'Date formatting ready');
  },
};
