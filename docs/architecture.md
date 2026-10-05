# Architecture

## Responsibility model

FRAME11 uses a deliberately narrow boundary between editable Webflow projects and shared code:

| Layer | Responsibility |
| --- | --- |
| Webflow | Structure, content, layout, typography, colors, and component design |
| `data-f11-*` | Declarative configuration and the API between Webflow and code |
| FRAME11 library | Reusable browser behavior, accessibility state, and lifecycle |
| Google Tag Manager | Tracking and vendor integration layer |
| GitHub | Source of truth, history, releases, and version tags |
| CDN | Delivery of immutable, version-pinned production assets |

This keeps project-specific design editable in Webflow and shared behavior testable in one repository.

## Runtime lifecycle

`src/index.ts` owns the module registry and is the only browser entry point. The core waits for DOM ready, then checks each module's selector. Matching modules initialize once. Calling `window.F11.rescan()` repeats detection for newly inserted content without initializing an already active module again.

Feature modules expose a small definition with a unique name, a detection selector, and an initialization function. No abstract base classes, dependency injection container, or framework lifecycle is needed.

Forms, navigation, and general integrations are placeholders. Consent is the first implemented module and follows the same one-time initialization lifecycle.

## Browser API

The normal path is declarative attributes, not JavaScript calls. When runtime inspection is useful, the bundle exposes only `window.F11`:

- `version` identifies the loaded build.
- `init({ debug: true })` enables debugging and safely requests initialization.
- `rescan()` detects features added after DOM ready.
- `state()` returns a snapshot of runtime state.

Loading the bundle twice does not replace the existing global API.

## Styles

FRAME11 CSS is limited to behavior-related states and CSS variables. Customer design stays in Webflow classes. Generic states such as `.is-open`, `.is-active`, and `.is-error` may be used as hooks later, but the library should not attach visual design to them.

## Forms and multi-step forms

The future forms module will enhance normal Webflow forms while keeping Webflow's submission flow. It may disable native validation UI, use the Constraint Validation API, render accessible inline errors, maintain `aria-invalid`, and read project-specific messages from `data-f11-*` attributes.

Multi-step behavior will build on the forms module. It will manage steps, progress, next/back actions, and validation gates while preserving the final Webflow submit.

## Navigation

The future navigation module may coordinate open/close state, scroll locking, backdrops, Escape handling, focus management, accessibility, and animation hooks. Animation libraries such as GSAP must remain optional integrations rather than hard dependencies.

## Consent and integrations

Consent has two timing layers:

1. A tiny synchronous snippet in the Webflow head establishes Google Consent Mode defaults before Google Tag Manager.
2. The normal FRAME11 runtime loads the consent UI after DOM ready, reads the site-specific JSON configuration, and updates consent when the visitor makes or changes a choice.

Vanilla CookieConsent is bundled into FRAME11. Its callbacks, script handling, and opt-in mode are controlled by the library. Each Webflow project supplies only JSON data: UI options, categories, services, translations, and a revision number. Invalid configuration fails without granting optional consent; the head defaults remain in effect.

Google Tag Manager fans out consent-aware configuration to Google Analytics, Google Ads, Meta Pixel, and similar tools. Google tags use Consent Mode, while other vendors can react to the `f11_consent_update` data-layer event. Vendor IDs and customer credentials belong in the customer environment, never in this repository.

## Distribution and releases

Production builds produce `dist/v<version>/frame11.js` and `dist/v<version>/frame11.css`. The Cloudflare Worker serves these retained version directories directly. Webflow projects must reference an explicit release path such as `/v0.2.0/frame11.js`, never an unversioned file.
