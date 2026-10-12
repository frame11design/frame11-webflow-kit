# Navigation

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

## Section-aware light and dark themes

FRAME11 can mirror the requested navbar theme while sections pass beneath the
navbar. Theme names describe the desired **navbar appearance**, not the section
background. FRAME11 only writes a state attribute; all colors and logo changes
remain in Webflow.

The default is `light`. It can be stated explicitly or changed to `dark` on the
Navbar:

```html
<nav
  class="w-nav"
  data-f11-nav="true"
  data-f11-nav-theme-default="light"
>
  ...
</nav>
```

Add the desired navbar appearance to any section:

```html
<section data-f11-nav-theme="dark">...</section>
```

While that section intersects the middle of the navbar, FRAME11 sets
`data-f11-nav-theme-current="dark"`. Outside configured sections it restores
the default. A site can use `dark` as its explicit default and mark only accent
sections as `light`, or the other way around.

Style both states in Webflow or project CSS:

```css
[data-f11-nav-theme-current='light'] .navbar-link {
  color: white;
}

[data-f11-nav-theme-current='dark'] .navbar-link {
  color: #111;
}
```

## Slide-in sticky header

Sticky behavior is separately opt-in on the same Navbar.

| Attribute | Values / default | Purpose |
| --- | --- | --- |
| `data-f11-nav-sticky` | `always`, `direction`; omitted = off | Selects the reveal mode. |
| `data-f11-nav-sticky-offset` | `250` | Scroll distance in pixels before fixed behavior begins. |
| `data-f11-nav-sticky-tolerance` | `6` | Minimum direction change in pixels, preventing jitter. |
| `data-f11-nav-sticky-space` | automatic | Preserve the original layout space. Use `false` for an initially fixed/absolute overlay header. |

`always` slides the header in after the offset and keeps it visible. `direction`
keeps it hidden while scrolling down, reveals it while scrolling up, and hides
it again on the next downward movement. An open Webflow mobile menu always
keeps the header visible.

```html
<nav
  class="w-nav"
  data-f11-nav="true"
  data-f11-nav-sticky="direction"
  data-f11-nav-sticky-offset="320"
>
  ...
</nav>
```

Fine tune the motion without changing the library:

```css
#site-nav {
  --f11-nav-sticky-duration: 480ms;
  --f11-nav-sticky-easing: cubic-bezier(0.22, 1, 0.36, 1);
  --f11-nav-sticky-top: 0px;
  --f11-nav-sticky-z-index: 1000;
}
```

Additional runtime hooks:

- `data-f11-nav-theme-current="light|dark"`
- `data-f11-nav-sticky-ready`
- `data-f11-nav-sticky-active` after the configured offset
- `data-f11-nav-sticky-visible` while the fixed header is on screen
- `data-f11-nav-scroll-direction="up|down"` after a meaningful direction change
- `f11:nav-theme` with `{ root, theme }` whenever the theme changes
