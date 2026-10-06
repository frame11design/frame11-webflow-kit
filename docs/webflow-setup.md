# Webflow setup

Use only a tagged release that has been tested on the Webflow staging domain. Cookie consent also requires the setup in [consent.md](consent.md).

## Include the stylesheet

Add a version-pinned stylesheet link in the Webflow site's head custom code:

```html
<link
  rel="stylesheet"
  href="https://cdn.frame11.at/v0.3.0/frame11.css"
>
```

## Include the runtime

Add the script before the closing body tag. `defer` is recommended even though the runtime also handles DOM ready:

```html
<script
  defer
  src="https://cdn.frame11.at/v0.3.0/frame11.js"
></script>
```

Change only the explicit version tag when upgrading. Never use `latest` for a customer project. A fixed tag prevents an unrelated release from changing a live site unexpectedly.

## Configure features

Add documented `data-f11-*` custom attributes to the relevant Webflow elements. Do not put API keys, IDs, personal data, or credentials into these attributes.

The forms and consent modules are available. See [forms.md](forms.md) and [consent.md](consent.md). Navigation and general integrations remain placeholders until their contracts are documented and implemented.

## Debug locally or on staging

Add `data-f11-debug` to the `<html>` element, or run:

```js
window.F11.init({ debug: true });
```

Remove debug mode before production if its console output is not wanted. Test new versions on the Webflow staging domain before updating a production/custom domain.

## Dynamic content

If project code inserts matching elements after initial page load, request another feature scan:

```js
window.F11.rescan();
```

Already initialized modules will not run twice.
