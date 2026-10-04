# FRAME11 Webflow Kit

FRAME11 Webflow Kit is a small TypeScript library for reusable behavior across Webflow projects. It replaces copied project snippets with one understandable, versioned codebase while leaving structure and visual design in Webflow.

The project is intentionally small. Cookie consent is the first implemented module; forms, multi-step forms, navigation, and other integrations remain placeholders.

## Principles

- Webflow owns structure, content, layout, typography, colors, and component design.
- `data-f11-*` attributes are the configuration boundary between Webflow and the library.
- FRAME11 owns browser behavior and state.
- Google Tag Manager will remain the integration layer for analytics and advertising vendors.
- GitHub is the source of truth; fixed-version CDN URLs deliver production assets.
- The only optional browser global is `window.F11`.

## Tech stack

- TypeScript
- Vanilla browser JavaScript
- Vite
- npm
- CSS for behavior-specific states only
- Git and, when connected, GitHub

Vanilla CookieConsent is the only browser dependency and is bundled into the production assets. The browser bundle has no Node.js runtime dependency.

## Requirements and installation

Node.js 20.19 or newer is required.

```bash
npm install
```

## Development

```bash
npm run dev
```

Open `/playground/` on the URL printed by Vite. The playground is deliberately minimal and exists only for local smoke testing.

## Checks and build

```bash
npm run typecheck
npm run build
```

The production build creates:

```text
dist/frame11.js
dist/frame11.css
```

`frame11.js` is an immediately invoked browser bundle, so it can be loaded by a normal Webflow `<script>` tag without a module loader. `dist/` is intentionally committed for direct, version-pinned delivery through jsDelivr.

## Runtime

The bundle waits for DOM ready and scans its central module registry. A module initializes only when its selector exists and only once per page load. This is the base for future automatic feature detection.

An intentionally small API is available for debugging or content inserted after initial load:

```js
window.F11.version;
window.F11.state();
window.F11.rescan();
window.F11.init({ debug: true });
```

Debug logging can also be enabled with `data-f11-debug` on the `<html>` element.

## Webflow and CDN usage

After a tagged release exists on GitHub, use fixed versions rather than `latest`:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/frame11design/frame11-webflow-kit@v0.2.0/dist/frame11.css"
>
<script
  defer
  src="https://cdn.jsdelivr.net/gh/frame11design/frame11-webflow-kit@v0.2.0/dist/frame11.js"
></script>
```

See [docs/webflow-setup.md](docs/webflow-setup.md) before using a release in Webflow.

## Project documentation

- [Architecture](docs/architecture.md)
- [Attribute namespace](docs/attributes.md)
- [Cookie consent](docs/consent.md)
- [Webflow setup](docs/webflow-setup.md)
- [Changelog](CHANGELOG.md)

## Versioning

The project follows Semantic Versioning. The `0.x` series is for development of the system; `1.0.0` will be the first stable production release.

Never commit secrets, API keys, GTM IDs, customer data, or customer-specific credentials.

## License

MIT
