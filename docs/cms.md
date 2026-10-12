# CMS show more/less

The CMS module progressively enhances a normal Webflow Collection List. Webflow
still owns the collection query, item structure, grid, classes, and button
design. FRAME11 only limits the initially visible items and controls the
accessible open/close behavior.

The feature is opt-in and has no effect unless `data-f11-cms-toggle` is present.

## Recommended Webflow structure

```text
Section or wrapper             data-f11-cms-toggle
├── Collection List Wrapper
│   └── Collection List        Webflow class: w-dyn-items
│       └── Collection Item    Webflow class: w-dyn-item
└── Button or Link             data-f11-cms-button
    └── Text                   data-f11-cms-label
```

Add these attributes to the shared wrapper:

```text
data-f11-cms-toggle
data-f11-cms-initial="6"
```

Add `data-f11-cms-button` to the Webflow button or link. Add
`data-f11-cms-label` to its text element when the button also contains an icon
or other nested elements. The label changes between “Mehr anzeigen” and
“Weniger anzeigen” on German pages, or the English equivalents on other pages.

The normal Webflow `.w-dyn-items` and `.w-dyn-item` classes are detected
automatically. For a custom or ambiguous structure, mark the relevant elements
explicitly with `data-f11-cms-list` and `data-f11-cms-item`.

## Configuration

All configuration belongs on the `data-f11-cms-toggle` wrapper.

| Attribute | Default | Purpose |
| --- | --- | --- |
| `data-f11-cms-initial` | `6` | Number of items visible while collapsed |
| `data-f11-cms-stagger` | `60` | Delay between item animations in milliseconds |
| `data-f11-cms-duration` | `360` | Duration of each item animation in milliseconds |
| `data-f11-cms-distance` | `16` | Vertical animation distance in pixels |
| `data-f11-cms-easing` | `cubic-bezier(0.22, 1, 0.36, 1)` | Web Animations easing |
| `data-f11-cms-more-label` | Localized | Collapsed button label |
| `data-f11-cms-less-label` | Localized | Expanded button label |

Example:

```html
<section
  data-f11-cms-toggle
  data-f11-cms-initial="4"
  data-f11-cms-stagger="80"
  data-f11-cms-duration="420"
  data-f11-cms-more-label="Weitere Projekte"
  data-f11-cms-less-label="Weniger Projekte"
>
  <!-- Webflow Collection List -->
  <a href="#" data-f11-cms-button>
    <span data-f11-cms-label>Weitere Projekte</span>
  </a>
</section>
```

## Behavior

- Extra items are truly hidden while collapsed, so they are not keyboard
  focusable.
- Opening animates items in collection order; closing animates them in reverse
  order.
- Multiple Collection Lists can run independently on the same page.
- The button hides automatically when the collection has no extra items.
- Added or removed CMS items are detected and the collapsed state is updated.
- `prefers-reduced-motion` disables the item animations without disabling the
  control.
- The button receives `aria-expanded` and `aria-controls`. A Webflow link is
  enhanced with keyboard-button semantics; a real button remains a button.

The wrapper exposes `data-f11-cms-ready`, `data-f11-cms-expanded`, and
`data-f11-cms-animating` for project-specific styling. Extra items receive
`data-f11-cms-extra`.

After each completed transition, FRAME11 dispatches a bubbling
`f11:cms-toggle` event on the wrapper. Its `detail` contains `expanded`, `root`,
and `visibleItems`.
