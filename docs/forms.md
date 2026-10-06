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
  --f11-error-font-size: 0.875rem;
  --f11-error-line-height: 1.4;
  --f11-error-gap: 0.5rem;
}

[data-f11-invalid] {
  /* Add the project-specific field state here or in Webflow. */
}

[data-f11-error] {
  margin-top: 0.5rem;
  font-size: 0.875rem;
}
```

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
