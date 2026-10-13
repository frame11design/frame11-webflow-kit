# Changelog

All notable changes to FRAME11 Webflow Kit will be documented in this file. The format follows Keep a Changelog, and versions follow Semantic Versioning.

## [Unreleased]

## [0.10.0] - 2026-10-13

### Added

- Opt-in localized date formatting for stable Webflow `YYYY-MM-DD` values.
- Automatic locale selection from Webflow's `<html lang>` value, per-language JSON rules, and per-element format overrides.
- Time-zone-safe calendar parsing, dynamic CMS item handling, runtime states, and the `f11:date-formatted` browser event.

## [0.9.0] - 2026-10-13

### Added

- Dependency-free, opt-in responsive multi-card slider based on the Katrin Maschetzke and HGW Binder review sliders.
- Configurable fractional card counts, CSS gap, arrow controls, optional autoplay, CMS item observation, and accessible states.
- Section-aware light/dark navigation themes with a configurable `light` default.
- Two slide-in sticky-header modes: always visible after an offset, or direction-aware reveal on upward scrolling.
- Sticky offset, movement tolerance, layout-space handling, CSS variables, runtime attributes, and browser events.

## [0.8.0] - 2026-10-12

### Added

- Universal, opt-in show more/less behavior for Webflow Collection Lists.
- Dependency-free staggered open and reverse-close animations with reduced-motion support.
- Configurable initial item count, labels, timing, easing, and motion distance.
- Accessible toggle state, dynamic item handling, runtime hooks, and the `f11:cms-toggle` browser event.

## [0.7.0] - 2026-10-12

### Added

- Opt-in Webflow form success tracking through `data-f11-form-track`.
- HGW-compatible `form_submit_success` data-layer events with a configurable, stable `form_name`.
- Duplicate-safe observation for multiple Webflow forms and custom success elements.
- Bubbling `f11:form-success` browser events for project-specific behavior without vendor coupling.

## [0.6.0] - 2026-10-12

### Added

- Opt-in Lenis smooth scrolling configured through `data-f11-lenis*` attributes.
- Batched document-height observation for delayed Webflow layout changes and BFCache restores.
- Optional, guarded GSAP ScrollTrigger synchronization and smooth anchor offsets.

## [0.5.0] - 2026-10-12

### Added

- Opt-in native Webflow mobile-navbar enhancement through `data-f11-nav`.
- Animated Webflow overlay with `none`, `dark`, and `light` tones plus CSS-variable customization.
- Runtime navigation state hooks that follow Webflow's dynamically inserted `.w-nav-overlay`.

## [0.4.2] - 2026-10-07

### Added

- Configurable invalid-field shadow through `--f11-error-shadow`, defaulting to `none` for backward compatibility.

## [0.4.1] - 2026-10-07

### Changed

- Place generated checkbox and radio errors after their Webflow wrapper so the native control layout remains intact.

## [0.4.0] - 2026-10-07

### Added

- Attribute-driven multi-step forms with per-step validation and accessible progress states.
- Staggered step transitions with directional fade, slide, blur, animated viewport height, and reduced-motion support.
- Optional step-level error summaries and a final submit/success progress position.

## [0.3.1] - 2026-10-07

### Changed

- Animate inline form errors with a subtle height expansion, fade, and `0.5rem` drop-in motion.
- Respect `prefers-reduced-motion` for form error transitions.

## [0.3.0] - 2026-10-06

### Added

- Accessible inline validation for Webflow forms using native HTML constraints.
- Per-field required and invalid messages through `data-f11-error-required` and `data-f11-error-invalid`.
- Validation state hooks through `data-f11-invalid`, `data-f11-error`, `aria-invalid`, and `aria-describedby`.
- Styled submit triggers through `data-f11-submit`, while preserving Webflow's native submit flow.

## [0.2.0] - 2026-10-04

### Added

- Bundled Vanilla CookieConsent 3.1.0 integration.
- Validated site configuration via `script[data-f11-consent-config]`.
- Google Consent Mode updates and standardized `f11_consent_update` events.
- Webflow preference triggers through `data-f11-consent-open`.
- Consent setup documentation and local playground coverage.

## [0.1.0] - 2026-10-04

### Added

- Initial TypeScript and Vite project foundation.
- DOM-ready, idempotent module initialization runtime.
- Placeholder registries for forms, navigation, consent, and integrations.
- Minimal behavior-state stylesheet and local playground.
- Architecture, attribute, and Webflow setup documentation.
