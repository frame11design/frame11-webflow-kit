# Attribute namespace

All public FRAME11 attributes use the `data-f11-*` namespace. Attributes are preferred over global variables or project-specific JavaScript configuration.

## Feature attributes

| Attribute | Planned purpose | Status |
| --- | --- | --- |
| `data-f11-form` | Enable FRAME11 validation on a `<form>` | Available |
| `data-f11-error-required` | Set the message for a missing required value on a field | Available |
| `data-f11-error-invalid` | Set the message for an invalid field value | Available |
| `data-f11-submit` | Turn a styled element into a native form submit trigger | Available |
| `data-f11-submit-form` | Target a form by ID when the trigger is outside it | Available |
| `data-f11-error` | Identify the generated inline validation message | Runtime state |
| `data-f11-multistep` | Enable a multi-step form on its shared wrapper | Available |
| `data-f11-step` | Identify a form step in DOM order | Available |
| `data-f11-next` | Validate and move to the next step | Available |
| `data-f11-back` | Move to the previous step | Available |
| `data-f11-step-viewport` | Animate this wrapper's height between steps | Available |
| `data-f11-step-error` | Identify an optional step-level validation summary | Available |
| `data-f11-step-static` | Exclude a direct step child from staggered motion | Available |
| `data-f11-progress` | Update an accessible progress bar | Available |
| `data-f11-progress-text` | Render the progress as a text label | Available |
| `data-f11-progress-template` | Set a `{current}`/`{total}` text template | Available |
| `data-f11-progress-current` | Render only the current progress number | Available |
| `data-f11-progress-total` | Render only the total progress number | Available |
| `data-f11-progress-complete` | Include valid submission as a final progress position | Available |
| `data-f11-form-track` | Enable successful Webflow submission tracking for this form | Available |
| `data-f11-form-name` | Set the stable `form_name` value sent to GTM | Available |
| `data-f11-form-success` | Identify a custom success element inside a Webflow form wrapper | Available |
| `data-f11-cms-toggle` | Enable show more/less for a Collection List inside this wrapper | Available |
| `data-f11-cms-list` | Identify a custom Collection List element | Available |
| `data-f11-cms-item` | Identify items when Webflow's `.w-dyn-item` is not used | Available |
| `data-f11-cms-button` | Toggle the Collection List between collapsed and expanded | Available |
| `data-f11-cms-label` | Identify the mutable text inside a designed toggle button | Available |
| `data-f11-cms-initial` | Set the initially visible item count | Available |
| `data-f11-cms-stagger` | Set the item stagger in milliseconds | Available |
| `data-f11-cms-duration` | Set each item animation duration in milliseconds | Available |
| `data-f11-cms-distance` | Set the vertical motion distance in pixels | Available |
| `data-f11-cms-easing` | Set the Web Animations easing value | Available |
| `data-f11-cms-more-label` | Override the collapsed button label | Available |
| `data-f11-cms-less-label` | Override the expanded button label | Available |
| `data-f11-nav` | Enable the native Webflow mobile-navbar enhancement | Available |
| `data-f11-nav-overlay` | Select the overlay tone: `none`, `dark`, or `light` | Available |
| `data-f11-nav-theme-default` | Set the default navbar appearance: `light` (default) or `dark` | Available |
| `data-f11-nav-theme` | Request a `light` or `dark` navbar appearance while an element passes below it | Available |
| `data-f11-nav-sticky` | Enable fixed reveal behavior: `always` or `direction` | Available |
| `data-f11-nav-sticky-offset` | Set the sticky activation distance in pixels | Available |
| `data-f11-nav-sticky-tolerance` | Set the scroll-direction tolerance in pixels | Available |
| `data-f11-nav-sticky-space` | Preserve or remove the original navbar layout space | Available |
| `data-f11-slider` | Enable a responsive multi-card slider | Available |
| `data-f11-slider-viewport` | Identify the horizontal scroll viewport | Available |
| `data-f11-slider-track` | Identify the flex track or Collection List | Available |
| `data-f11-slider-item` | Identify cards or Collection Items | Available |
| `data-f11-slider-prev` | Identify the previous control | Available |
| `data-f11-slider-next` | Identify the next control | Available |
| `data-f11-slider-cards-desktop` | Set the visible desktop card count | Available |
| `data-f11-slider-cards-tablet` | Set the visible tablet card count | Available |
| `data-f11-slider-cards-mobile` | Set the visible mobile card count | Available |
| `data-f11-slider-gap` | Set the card gap as a CSS length | Available |
| `data-f11-slider-autoplay` | Enable autoplay and optionally set its interval | Available |
| `data-f11-lenis` | Enable global Lenis smooth scrolling when placed on `<html>` | Available |
| `data-f11-lenis-duration` | Override scroll duration in seconds | Available |
| `data-f11-lenis-wheel` | Enable or disable smoothed wheel input | Available |
| `data-f11-lenis-wheel-multiplier` | Adjust mouse/trackpad wheel input | Available |
| `data-f11-lenis-touch` | Opt into synchronized touch smoothing | Available |
| `data-f11-lenis-anchors` | Enable or disable smooth same-page anchors | Available |
| `data-f11-lenis-anchor-offset` | Set the anchor offset in pixels | Available |
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
| `data-f11-invalid` | Identify a field with a current validation error | Runtime state |
| `data-f11-error-visible` | Reveal and animate a generated inline error | Runtime state |
| `data-f11-multistep-ready` | Mark an initialized multi-step wrapper | Runtime state |
| `data-f11-multistep-animating` | Mark a step transition in progress | Runtime state |
| `data-f11-step-active` | Mark the currently active step | Runtime state |
| `data-f11-step-transition` | Expose the current enter/exit direction | Runtime state |
| `data-f11-current-step` | Expose the one-based current progress position | Runtime state |
| `data-f11-total-steps` | Expose the total progress positions | Runtime state |
| `data-f11-step-error-visible` | Reveal an optional step-level error summary | Runtime state |
| `data-f11-form-track-ready` | Mark a form whose Webflow success state is being observed | Runtime state |
| `data-f11-cms-ready` | Mark an initialized CMS toggle wrapper | Runtime state |
| `data-f11-cms-expanded` | Mark an expanded CMS toggle wrapper | Runtime state |
| `data-f11-cms-animating` | Mark an active CMS item transition | Runtime state |
| `data-f11-cms-extra` | Mark Collection Items beyond the initial visible count | Runtime state |
| `data-f11-nav-ready` | Mark an initialized native Webflow Navbar | Runtime state |
| `data-f11-nav-open` | Mirror Webflow's current Navbar open state | Runtime state |
| `data-f11-nav-overlay-ready` | Mark Webflow's generated Navbar overlay | Runtime state |
| `data-f11-nav-overlay-open` | Animate the generated overlay when open | Runtime state |
| `data-f11-nav-theme-current` | Expose the active navbar appearance | Runtime state |
| `data-f11-nav-sticky-ready` | Mark a navbar prepared for sticky behavior | Runtime state |
| `data-f11-nav-sticky-active` | Mark sticky behavior active beyond its offset | Runtime state |
| `data-f11-nav-sticky-visible` | Mark the fixed navbar currently revealed | Runtime state |
| `data-f11-nav-scroll-direction` | Expose the last meaningful scroll direction | Runtime state |
| `data-f11-slider-ready` | Mark an initialized multi-card slider | Runtime state |
| `data-f11-slider-scrollable` | Mark a slider whose content exceeds its viewport | Runtime state |
| `data-f11-slider-disabled` | Mark an unavailable slider control | Runtime state |
| `data-f11-slider-index` | Expose the nearest zero-based card index | Runtime state |
| `data-f11-lenis-ready` | Mark the initialized global smooth-scroll runtime | Runtime state |

See [forms.md](forms.md), [form-tracking.md](form-tracking.md), [cms.md](cms.md), [slider.md](slider.md), [navigation.md](navigation.md), [smooth-scroll.md](smooth-scroll.md), and [consent.md](consent.md) for the released module contracts. Boolean attributes should generally use presence (`data-f11-example`) or the values `true` and `false`; values must not contain secrets or customer credentials.
