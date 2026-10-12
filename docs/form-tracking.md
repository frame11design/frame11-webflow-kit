# Webflow form success tracking

FRAME11 can report a successful Webflow form submission to Google Tag Manager.
It observes Webflow's success message rather than a button click or the native
`submit` event. The event therefore fires only after Webflow has accepted the
submission and revealed the success state.

The data-layer contract intentionally matches the proven HGW Binder setup:

```js
{
  event: 'form_submit_success',
  form_name: 'Kontaktformular'
}
```

Google Ads, Meta Pixel, and other vendors remain configured in Google Tag
Manager. FRAME11 does not load or call those vendors directly.

## Enable tracking

Add these attributes to the native Webflow **Form** element:

| Attribute | Value |
| --- | --- |
| `data-f11-form-track` | Empty or `true` |
| `data-f11-form-name` | Stable name used by GTM, for example `Kontaktformular` |

Example output:

```html
<div class="w-form">
  <form
    data-f11-form
    data-f11-form-track
    data-f11-form-name="Kontaktformular"
  >
    ...
  </form>

  <div class="w-form-done">Vielen Dank.</div>
  <div class="w-form-fail">Bitte versuchen Sie es erneut.</div>
</div>
```

`data-f11-form` remains optional and enables FRAME11 validation. Success
tracking is independently controlled by `data-f11-form-track`, so it can also
be added to an otherwise native Webflow form.

If `data-f11-form-name` is missing, FRAME11 falls back to Webflow's `data-name`,
then the form's `name`, its ID, and finally a localized generic name. An
explicit stable name is recommended because GTM reports and triggers should
not depend on a Designer-generated fallback.

## Success element

Normal Webflow forms need no additional setup. FRAME11 automatically observes
the `.w-form-done` element belonging to the form.

For a custom success element inside the same `.w-form` wrapper, add:

```text
data-f11-form-success
```

FRAME11 pushes the event when the success element changes from hidden to
visible. Further class or style changes while it remains visible do not create
duplicates. If the same form later returns to its hidden state and succeeds
again, a new success event is allowed.

The initialized form receives `data-f11-form-track-ready` as a runtime state.

## Google Tag Manager

The existing HGW Binder pattern can be reused:

1. Create a **Custom Event** trigger named `form_submit_success`.
2. Create a Data Layer Variable for `form_name` when the form name is needed in
   reports or conditions.
3. Attach the trigger to the relevant Google Ads conversion tag.
4. Attach the same trigger to the Meta Pixel lead/conversion tag.
5. Keep the vendor tags' consent requirements configured in GTM.

The tracking module only pushes to `window.dataLayer`; GTM decides which tags
fire. A failed validation, button click, or server error does not count as a
success.

## Browser event

FRAME11 also dispatches a bubbling `f11:form-success` event on the form. This
is useful for project-specific UI without coupling it to Google Tag Manager:

```js
document.addEventListener('f11:form-success', (event) => {
  console.log(event.detail.formName);
});
```

The event detail contains `form`, `formName`, and `successElement`.
