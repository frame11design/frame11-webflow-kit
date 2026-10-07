# Changelog

All notable changes to FRAME11 Webflow Kit will be documented in this file. The format follows Keep a Changelog, and versions follow Semantic Versioning.

## [Unreleased]

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
