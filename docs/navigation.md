# Mobile navigation

FRAME11 can enhance a native Webflow Navbar on tablet and mobile. The feature
is opt-in: without `data-f11-nav`, Webflow's normal navigation behavior and
animation remain unchanged.

FRAME11 does not replace Webflow's navbar logic. Webflow still owns the menu
button, outside-click closing, Escape handling, menu placement, and ARIA state.
The module only disables Webflow's slide transition on the opted-in navbar,
mirrors its open state as attributes, and animates the backdrop created by
Webflow's `.w-nav-overlay`.

## Enable it

Add this custom attribute to the Webflow Navbar element (`.w-nav`):

| Name | Value |
| --- | --- |
| `data-f11-nav` | `true` |

Removing the attribute, or setting its value to `false`, disables FRAME11's
navigation enhancement. Disabled is the default.

## Overlay tone

Add `data-f11-nav-overlay` to the same Navbar element:

| Value | Result |
| --- | --- |
| `none` or omitted | Blur without a color tint |
| `dark` | Dark translucent tint and blur |
| `light` | Light translucent tint and blur |

Example:

```html
<nav
  class="w-nav"
  data-f11-nav="true"
  data-f11-nav-overlay="dark"
>
  ...
</nav>
```

## Project-specific fine tuning

The following CSS variables can be set on the Navbar through Webflow custom
CSS or site custom code:

```css
#site-nav {
  --f11-nav-overlay-color: rgba(0, 0, 0, 0.28);
  --f11-nav-overlay-blur: 7px;
  --f11-nav-overlay-duration: 320ms;
  --f11-nav-overlay-easing: cubic-bezier(0.22, 1, 0.36, 1);
  --f11-nav-content-z-index: 999;
}
```

Setting `--f11-nav-overlay-color` overrides the selected tone. FRAME11 uses a
pseudo-element inside Webflow's generated overlay, so the backdrop animates
without fading the menu itself. `prefers-reduced-motion` is respected.

## Runtime state hooks

FRAME11 adds these attributes; they are state hooks, not configuration:

- `data-f11-nav-ready` on an initialized Navbar.
- `data-f11-nav-open` on the Navbar while Webflow reports it as open.
- `data-f11-nav-overlay-ready` on Webflow's generated overlay.
- `data-f11-nav-overlay-open` while the overlay is open.

The module watches for `.w-nav-overlay` because Webflow creates that element at
runtime. No manual overlay element is needed.
