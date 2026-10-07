# Forms

FRAME11 enhances a normal Webflow form; it does not replace Webflow's form submission. Webflow still controls the request, wait text, success state, and server error state.

## Enable validation

Add `data-f11-form` to the Webflow **Form** element. Keep the normal HTML field settings such as Required, field type, minimum/maximum values, and pattern. FRAME11 uses those native constraints as the source of truth.

Add messages directly to each field:

```html
<input
  type="email"
  name="Email"
  required
  data-f11-error-required="Bitte gib deine E-Mail-Adresse ein."
  data-f11-error-invalid="Bitte gib eine gültige E-Mail-Adresse ein."
>
```

- `data-f11-error-required` is shown when a required value is empty.
- `data-f11-error-invalid` is shown when a non-empty value violates its type, `pattern`, `min`, `max`, `minlength`, or `maxlength` constraint.
- If a custom message is missing, the browser validation message is used.
- `type="tel"` does not define a format by itself. Add a `pattern` when a phone-number structure must be enforced.

On error, FRAME11 inserts a `[data-f11-error]` element directly after the field and sets `data-f11-invalid`, `aria-invalid`, `aria-errormessage`, and `aria-describedby`. Existing `aria-describedby` references are preserved. Errors are checked on submit and on blur/change; after an unsuccessful submit they update while the visitor types.

## Style the states

FRAME11 supplies a compact default error state, while the visual design remains adjustable in Webflow. Override the shared CSS variables per project when needed:

```css
[data-f11-form] {
  --f11-error-color: #c62828;
  --f11-error-shadow: 0 0 15px #c6282866;
  --f11-error-font-size: 0.875rem;
  --f11-error-line-height: 1.4;
  --f11-error-gap: 0.5rem;
  --f11-error-duration: 180ms;
  --f11-error-opacity-duration: 140ms;
  --f11-error-easing: cubic-bezier(0.2, 0.8, 0.2, 1);
}

[data-f11-invalid] {
  /* Uses --f11-error-color and the optional --f11-error-shadow. */
}

[data-f11-error] {
  margin-top: 0.5rem;
  font-size: 0.875rem;
}
```

`--f11-error-shadow` defaults to `none`, so existing projects do not gain a
shadow unless they configure one. The generated message smoothly expands to its
natural height, fades in, and moves down by `0.5rem`. This prevents the rest of
the form from jumping. FRAME11 disables the transition automatically when the
visitor prefers reduced motion.

## Use a custom styled submit control

Keep the real Webflow submit input in the form, including its Webflow wait text, and visually hide it. Add `data-f11-submit` to the styled link or button in the same form:

```html
<form data-f11-form>
  <!-- fields -->
  <input type="submit" value="Absenden" data-wait="Einen Moment bitte..." hidden>
  <a href="#" data-f11-submit>Nachricht senden</a>
</form>
```

FRAME11 calls `form.requestSubmit()` with the real submit input. This preserves native submit semantics and Webflow's existing handler. No paired IDs such as `ms-code-submit-new` and `ms-code-submit-old` are needed.

If the styled trigger must live outside the form, give the form an ID and point the trigger to it:

```html
<form id="contact" data-f11-form>...</form>
<button type="button" data-f11-submit data-f11-submit-form="contact">
  Nachricht senden
</button>
```

## Accessibility behavior

- The first invalid field receives focus.
- Error messages are announced as live alerts.
- Anchor triggers receive button semantics; non-interactive custom elements also receive keyboard focus and Enter/Space handling.
- A native submit button with `data-f11-submit` keeps its normal native behavior.

## Multi-step forms

Put `data-f11-multistep` on the smallest wrapper that contains the form and its
progress UI. The form itself still gets `data-f11-form`, so the same field
validation and Webflow submit flow are used.

```html
<section data-f11-multistep data-f11-progress-complete>
  <div class="progress-track">
    <div data-f11-progress></div>
  </div>
  <div data-f11-progress-text></div>

  <div data-f11-step-viewport>
    <form data-f11-form>
      <div data-f11-step>
        <input name="Company" required>
        <div data-f11-step-error>Bitte korrigiere die markierten Eingaben.</div>
        <a href="#" data-f11-next>Weiter</a>
      </div>

      <div data-f11-step>
        <input name="Email" type="email" required>
        <a href="#" data-f11-back>Zurück</a>
        <a href="#" data-f11-submit>Absenden</a>
      </div>
    </form>
  </div>
</section>
```

- `data-f11-step` marks each step in DOM order. Only the active step remains
  visible and interactive.
- `data-f11-next` validates only the current step and advances when it is valid.
- `data-f11-back` returns without validating the current step.
- `data-f11-step-error` is an optional, existing Webflow-designed summary. It is
  shown when the step is invalid; the generated per-field errors remain the
  detailed source of truth.
- `data-f11-step-viewport` is optional. Put it on the element whose height should
  animate between differently sized steps. If omitted, the form is used.
- `data-f11-progress` receives an accessible progressbar state and an inline
  width. Style its track and appearance in Webflow.
- `data-f11-progress-text` receives a localized `Schritt 1 von 3`/`Step 1 of 3`
  label. Override it with `data-f11-progress-template="{current} / {total}"`.
- `data-f11-progress-current` and `data-f11-progress-total` can be used when the
  two numbers need separate Webflow elements.
- `data-f11-progress-complete` adds one final progress position for the valid
  submit/success state. Without it, the total equals the number of form steps.
- `data-f11-step-static` excludes a direct child of a step, such as a layout-only
  spacer, from the staggered transition.

If a final submit finds an invalid field in an earlier hidden step, FRAME11
returns to that step before focusing and scrolling to the field.

The step motion matches the original FRAME11 lead form: direct step children
fade, slide, and blur with a small stagger, while the marked viewport animates
its height. Override the behavior variables on the multistep wrapper:

```css
[data-f11-multistep] {
  --f11-step-duration: 240ms;
  --f11-step-stagger: 60ms;
  --f11-step-distance: 1.25rem;
  --f11-step-blur: 5px;
  --f11-step-height-duration: 240ms;
  --f11-step-easing: ease;
  --f11-progress-duration: 240ms;
  --f11-progress-easing: ease;
}
```

Motion is removed automatically for visitors who prefer reduced motion.
