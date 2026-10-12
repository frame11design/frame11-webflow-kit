# Lenis smooth scroll

FRAME11 provides an optional global smooth-scroll module powered by Lenis. It
is disabled by default so projects keep native browser scrolling unless they
explicitly opt in.

## Enable it

Add a custom attribute to the `<html>` element. In Webflow this belongs in the
sitewide head custom code, before the FRAME11 stylesheet:

```html
<script>
  document.documentElement.setAttribute('data-f11-lenis', 'true');
</script>
```

FRAME11 then bundles and initializes Lenis; no separate Lenis CDN script is
needed. The runtime adds `data-f11-lenis-ready` after initialization.

## Defaults

The defaults match the established Frame11 website setup:

| Attribute | Default | Purpose |
| --- | --- | --- |
| `data-f11-lenis-duration` | `1` | Scroll animation duration in seconds |
| `data-f11-lenis-wheel` | `true` | Smooth mouse and trackpad wheel input |
| `data-f11-lenis-wheel-multiplier` | `1.1` | Wheel input multiplier |
| `data-f11-lenis-touch` | `false` | Keep native touch scrolling unless explicitly enabled |
| `data-f11-lenis-anchors` | `true` | Smooth same-page anchor links |
| `data-f11-lenis-anchor-offset` | `-80` | Anchor offset in pixels, for example for a fixed header |

Only add override attributes when a project needs different values:

```html
<script>
  const root = document.documentElement;
  root.setAttribute('data-f11-lenis', 'true');
  root.setAttribute('data-f11-lenis-duration', '0.9');
  root.setAttribute('data-f11-lenis-anchor-offset', '-96');
</script>
```

Boolean values accept `true`, `false`, `1`, or an empty attribute. Invalid
numeric values fall back to the documented defaults.

## Dynamic Webflow height changes

Lenis performs its normal automatic resizing. FRAME11 additionally observes
both `document.documentElement` and `document.body`, batches notifications with
`requestAnimationFrame`, and calls `lenis.resize()`. This protects the scroll
limit when Webflow interactions, embeds, fonts, CMS content, or delayed media
change the document height after initial load. The same safe resize runs on
`pageshow`, including browser back/forward-cache restoration.

## Accessibility and integrations

- Lenis respects `prefers-reduced-motion`; smoothing becomes immediate while
  normal scrolling remains available.
- If `window.ScrollTrigger.update` exists, FRAME11 calls it on Lenis scroll
  events. GSAP is optional and never loaded by this module.
- Lenis' `data-lenis-prevent`, `data-lenis-prevent-wheel`, and related native
  attributes remain available for nested scroll areas and modals.

Test smooth scrolling on the Webflow staging domain, especially after opening
accordions, filtering CMS content, loading embeds, and navigating back to the
page.
