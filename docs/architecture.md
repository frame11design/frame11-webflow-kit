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

Navigation, forms, CMS collection toggles, successful form tracking, smooth
scrolling, and consent follow the same one-time initialization lifecycle. Form
success tracking is the first GTM-facing integration; additional integrations
remain placeholders.

Feature configuration is deliberately local and declarative. A boolean
`data-f11-*` attribute opts an element into behavior; related attributes select
small documented variants; CSS variables carry visual values such as colors,
blur, duration, and easing. Missing attributes keep features disabled or at
their safe defaults. This avoids a second global configuration object and keeps
each Webflow component understandable in the Designer.

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

The forms module enhances opted-in Webflow forms while keeping Webflow's submission flow. It disables only the browser's native validation popovers, uses the Constraint Validation API, renders accessible inline errors, maintains `aria-invalid`, and reads project-specific messages from `data-f11-*` attributes.

A styled `data-f11-submit` control calls `requestSubmit()` with the real Webflow submit input. This means Webflow still owns the valid submission, loading state, success state, and server error state. FRAME11 stops the event only when client-side validation fails.

Multi-step behavior will build on the forms module. It will manage steps, progress, next/back actions, and validation gates while preserving the final Webflow submit.

## Navigation

The navigation module progressively enhances an opted-in native Webflow Navbar.
Webflow remains responsible for opening, closing, outside clicks, Escape, menu
placement, and accessibility attributes. FRAME11 observes the state Webflow
already exposes, disables the native slide transition, and supplies an animated
overlay hook. The dynamically inserted `.w-nav-overlay` is detected with a
small `MutationObserver`. No animation library is required.

## Smooth scrolling

The global smooth-scroll module is opt-in through `data-f11-lenis` on `<html>`.
FRAME11 bundles a fixed Lenis version, supplies conservative project defaults,
and reads optional numeric and boolean overrides from related attributes. Lenis
keeps native touch scrolling by default and respects reduced-motion settings.

In addition to Lenis' automatic sizing, FRAME11 observes the document element
and body. Resize notifications are batched into one animation frame before the
scroll limit is recalculated. This accounts for delayed Webflow layout changes
without adding project-specific scripts.

## CMS collection toggles

The CMS module operates on the rendered Webflow Collection List and does not
change the CMS query or duplicate collection data. A wrapper opts in, an
initial count controls the collapsed state, and Webflow classes continue to own
the collection layout and button design. The native Web Animations API supplies
dependency-free staggered item motion in collection order when opening and
reverse order when closing. Runtime attributes expose state without prescribing
customer-facing styles.

## Consent and integrations

Consent has two timing layers:

1. A tiny synchronous snippet in the Webflow head establishes Google Consent Mode defaults before Google Tag Manager.
2. The normal FRAME11 runtime loads the consent UI after DOM ready, reads the site-specific JSON configuration, and updates consent when the visitor makes or changes a choice.

Vanilla CookieConsent is bundled into FRAME11. Its callbacks, script handling, and opt-in mode are controlled by the library. Each Webflow project supplies only JSON data: UI options, categories, services, translations, and a revision number. Invalid configuration fails without granting optional consent; the head defaults remain in effect.

Google Tag Manager fans out consent-aware configuration to Google Analytics, Google Ads, Meta Pixel, and similar tools. Google tags use Consent Mode, while other vendors can react to the `f11_consent_update` data-layer event. Vendor IDs and customer credentials belong in the customer environment, never in this repository.

Form success tracking follows the same boundary. FRAME11 observes the Webflow
success state and pushes the stable `form_submit_success` event with a
project-defined `form_name`. GTM decides whether this triggers Google Ads,
Meta Pixel, or another vendor. A click or submit attempt alone is deliberately
not treated as a conversion.

## Distribution and releases

Production builds produce `dist/v<version>/frame11.js` and `dist/v<version>/frame11.css`. Cloudflare Pages serves these retained version directories directly. Webflow projects must reference an explicit release path such as `/v0.8.0/frame11.js`, never an unversioned file.
