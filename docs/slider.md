# Responsive multi-card slider

The slider is a dependency-free enhancement for a normal Webflow structure or
CMS Collection List. Webflow owns the cards, controls, layout styling, and
content. FRAME11 provides horizontal scroll snap, responsive card widths,
one-card navigation, optional autoplay, and accessible states.

The behavior is based on the review sliders used on the Katrin Maschetzke and
HGW Binder sites, but uses the public `data-f11-*` API.

## Recommended structure

```html
<section
  data-f11-slider="true"
  data-f11-slider-cards-desktop="3.4"
  data-f11-slider-cards-tablet="2.4"
  data-f11-slider-cards-mobile="1.4"
  data-f11-slider-gap="2rem"
>
  <div data-f11-slider-viewport>
    <div data-f11-slider-track>
      <article data-f11-slider-item>...</article>
      <article data-f11-slider-item>...</article>
    </div>
  </div>

  <button data-f11-slider-prev>Previous</button>
  <button data-f11-slider-next>Next</button>
</section>
```

For a Webflow CMS slider, put `data-f11-slider-viewport` on the Collection
List Wrapper, `data-f11-slider-track` on the Collection List, and
`data-f11-slider-item` on the Collection Item.

Existing Frame11 projects can keep the reference classes
`.slider-component`, `.slider-viewport`, `.slider-track`, `.slider-element`,
`.slider-button.prev`, and `.slider-button.next`. Add `data-f11-slider="true"`
to `.slider-component`; FRAME11 recognizes the legacy child classes within
that explicitly enabled root.

## Configuration

| Attribute | Default | Purpose |
| --- | --- | --- |
| `data-f11-slider` | disabled | Enables this slider. |
| `data-f11-slider-cards-desktop` | `3.4` | Visible cards above 991px. Decimals reveal the next card. |
| `data-f11-slider-cards-tablet` | `2.4` | Visible cards from 480px through 991px. |
| `data-f11-slider-cards-mobile` | `1.4` | Visible cards through 479px. |
| `data-f11-slider-gap` | `2rem` | Any valid CSS length used between cards. |
| `data-f11-slider-autoplay` | disabled | Empty/`true` uses 3500ms; a positive number sets the interval in milliseconds. |

Autoplay pauses while the slider is hovered or keyboard focus is inside it,
while the page is hidden, and temporarily after manual input. It is disabled
when the visitor prefers reduced motion. At the end, autoplay returns to the
first card.

## Design in Webflow

FRAME11 intentionally does not style cards or arrow buttons. The only supplied
CSS is behavioral: flex sizing, gap, scroll snap, hidden scrollbars, and
disabled pointer handling. The generated card width is available as
`--f11-slider-card-width` and the active count as `--f11-slider-cards`.

Use the disabled state for project styling:

```css
[data-f11-slider-disabled] {
  opacity: 0.35;
}
```

## Runtime hooks

- `data-f11-slider-ready` marks an initialized root.
- `data-f11-slider-scrollable` exists while the content exceeds the viewport.
- `data-f11-slider-disabled` and `aria-disabled` mark an unavailable control.
- `data-f11-slider-index` exposes the zero-based nearest card index.
- `f11:slider-change` bubbles from the slider with `{ root, index }`.

The module observes Collection List children, so Webflow-rendered CMS items and
items inserted later are both supported.
