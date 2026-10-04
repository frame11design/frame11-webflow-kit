# Webflow setup

The current `0.1.0` build is an architectural foundation, not a production feature release. These steps describe the intended integration once a tagged GitHub release is available.

## Include the stylesheet

Add a version-pinned stylesheet link in the Webflow site's head custom code:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/OWNER/frame11-webflow-kit@v0.1.0/dist/frame11.css"
>
```

## Include the runtime

Add the script before the closing body tag. `defer` is recommended even though the runtime also handles DOM ready:

```html
<script
  defer
  src="https://cdn.jsdelivr.net/gh/OWNER/frame11-webflow-kit@v0.1.0/dist/frame11.js"
></script>
```

Replace `OWNER` and the version tag. Never use `latest` for a customer project. A fixed tag prevents an unrelated release from changing a live site unexpectedly.

## Configure features

Add documented `data-f11-*` custom attributes to the relevant Webflow elements. Do not put API keys, IDs, personal data, or credentials into these attributes.

The feature modules are placeholders in `0.1.0`; their full attribute contracts will be added with their implementations.

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
