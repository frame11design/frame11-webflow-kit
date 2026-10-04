# Attribute namespace

All public FRAME11 attributes use the `data-f11-*` namespace. Attributes are preferred over global variables or project-specific JavaScript configuration.

## Planned feature attributes

| Attribute | Planned purpose | Status |
| --- | --- | --- |
| `data-f11-form` | Enable enhanced form behavior | Placeholder |
| `data-f11-error` | Identify an inline validation message | CSS hook only |
| `data-f11-multistep` | Identify a multi-step form | Placeholder |
| `data-f11-step` | Identify a form step | Reserved |
| `data-f11-next` | Move to the next step | Reserved |
| `data-f11-back` | Move to the previous step | Reserved |
| `data-f11-progress` | Expose multi-step progress | Reserved |
| `data-f11-nav` | Enable navigation helpers | Placeholder |
| `data-f11-consent` | Enable consent when placed on `<html>` | Available |
| `data-f11-consent-config` | Identify the site-specific JSON configuration script | Available |
| `data-f11-consent-open` | Open the preferences modal from a Webflow button or link | Available |
| `data-f11-integration` | Opt into an integration hook | Placeholder |

## Runtime and state attributes

| Attribute | Purpose | Status |
| --- | --- | --- |
| `data-f11-debug` | Enable runtime debug messages when placed on `<html>` | Available |
| `data-f11-hidden` | Hide an element with the minimal library stylesheet | Available |
| `data-f11-scroll-lock` | Lock document scrolling when placed on `<html>` | CSS hook only |

Module-specific attribute contracts will be documented before their behavior is released. Boolean attributes should generally use presence (`data-f11-example`) or the values `true` and `false`; values must not contain secrets or customer credentials.
