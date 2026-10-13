# Localized date formatting

The date module replaces a stable Webflow date value with a localized display
value. It is opt-in and does not add styling.

The default output contains a two-digit day, the full localized month name, and
the year:

| Page language | Example output |
| --- | --- |
| `de-AT` | `05. Oktober 2026` |
| `en-GB` | `05 October 2026` |
| `en-US` | `October 05, 2026` |

The punctuation and order come from the browser's native
`Intl.DateTimeFormat`. This is what makes the same CMS item follow Webflow's
current page language.

## Webflow setup

Add `data-f11-date` to the Text Block or `<time>` element that displays the CMS
date. Bind the attribute value to the Webflow Date/Time field and select a
numeric year-month-day format so the published HTML is:

```html
<time data-f11-date="2026-10-05">2026-10-05</time>
```

The required input format is:

```text
YYYY-MM-DD
```

For example, 5 October 2026 must be `2026-10-05`. A complete ISO timestamp such
as `2026-10-05T00:00:00.000Z` is also accepted. FRAME11 intentionally uses the
calendar part and does not shift it across days based on the visitor's time
zone.

Do not use ambiguous source values such as `05/10/2026`, `10/05/2026`, or
`October 5, 2026`. FRAME11 leaves an invalid value unchanged and adds
`data-f11-date-error="invalid-value"` instead of guessing.

If binding the date directly to `data-f11-date` is inconvenient, enable the
element with `data-f11-date="true"` and provide the value through one of these
sources. They are checked in this order:

1. A non-boolean value directly in `data-f11-date`.
2. `data-f11-date-value`.
3. The `datetime` value of a `<time>` element.
4. The element's initial text content.

For example:

```html
<time
  datetime="2026-10-05"
  data-f11-date="true"
>2026-10-05</time>
```

## Language selection

FRAME11 reads the locale in this order:

1. `data-f11-date-locale` on the date element.
2. The current Webflow page's `<html lang>` value.
3. The browser language as a fallback.

Webflow Localization already changes `<html lang>` between localized pages, so
normal multilingual sites do not need separate scripts.

## Optional per-language configuration

The default format needs no configuration. To define regional locale variants
or different components per language, add one JSON block once in sitewide
custom code before the FRAME11 script:

```html
<script type="application/json" data-f11-date-config>
  {
    "default": {
      "day": "2-digit",
      "month": "long",
      "year": "numeric"
    },
    "locales": {
      "de": {
        "locale": "de-AT"
      },
      "en": {
        "locale": "en-GB",
        "day": "2-digit",
        "month": "long",
        "year": "numeric"
      }
    }
  }
</script>
```

FRAME11 first looks for an exact locale key such as `de-AT` and then for its
base language such as `de`. The `locale` property controls regional order and
punctuation. Missing values inherit from `default`.

Supported component values are:

| Component | Values |
| --- | --- |
| `day` | `numeric`, `2-digit`, `none` |
| `month` | `numeric`, `2-digit`, `long`, `short`, `narrow`, `none` |
| `year` | `numeric`, `2-digit`, `none` |
| `weekday` | `long`, `short`, `narrow`, `none` |

## Per-element overrides

The same components can be changed on an individual Webflow element:

```html
<span
  data-f11-date="2026-10-05"
  data-f11-date-month="short"
  data-f11-date-year="2-digit"
></span>
```

Available attributes are:

- `data-f11-date-locale`
- `data-f11-date-day`
- `data-f11-date-month`
- `data-f11-date-year`
- `data-f11-date-weekday`

An element override wins over the per-language rule, which wins over the
default rule.

## Runtime hooks

After formatting, the element exposes:

- `data-f11-date-ready`
- `data-f11-date-locale-resolved`, containing the locale selected by the browser

The element also dispatches a bubbling `f11:date-formatted` event. Its detail
contains `element`, `date`, `locale`, and `rawValue`. Collection items inserted
after page load are detected automatically.
