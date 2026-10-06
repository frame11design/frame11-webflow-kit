# FRAME11 Webflow Kit

FRAME11 Webflow Kit is a small TypeScript library for reusable behavior across Webflow projects. It replaces copied project snippets with one understandable, versioned codebase while leaving structure and visual design in Webflow.

The project is intentionally small. Forms and cookie consent are implemented; multi-step forms, navigation, and other integrations remain placeholders.

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
npm test
npm run build
```

The production build creates an immutable directory from the package version:

```text
dist/v0.3.0/frame11.js
dist/v0.3.0/frame11.css
```

`frame11.js` is an immediately invoked browser bundle, so it can be loaded by a normal Webflow `<script>` tag without a module loader. Published version directories are retained side by side so an existing Webflow project is never silently updated.

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

Use a fixed release path rather than an unversioned URL:

```html
<link
  rel="stylesheet"
  href="https://cdn.frame11.at/v0.3.0/frame11.css"
>
<script
  defer
  src="https://cdn.frame11.at/v0.3.0/frame11.js"
></script>
```

See [docs/webflow-setup.md](docs/webflow-setup.md) before using a release in Webflow.

## Project documentation

- [Architecture](docs/architecture.md)
- [Attribute namespace](docs/attributes.md)
- [Forms](docs/forms.md)
- [Cookie consent](docs/consent.md)
- [Webflow setup](docs/webflow-setup.md)
- [Changelog](CHANGELOG.md)

## Versioning

The project follows Semantic Versioning. The `0.x` series is for development of the system; `1.0.0` will be the first stable production release.

The package version determines the immutable CDN directory. For example, version
`0.3.0` builds to `dist/v0.3.0/`. Never ship behavior changes under an existing
version path.

For a release:

1. Run `npm version patch --no-git-tag-version` (or `minor`/`major`).
2. Run `npm run typecheck` and `npm run build`.
3. Commit `package.json`, `package-lock.json`, the source changes, and the new
   `dist/vX.Y.Z/` directory. Keep all older version directories.
4. Merge or push the release commit to `main`. Cloudflare Pages automatically
   builds and deploys that branch to `cdn.frame11.at`.
5. Verify the new versioned CSS and JavaScript URLs, then update a Webflow staging
   site to the new version before publishing production.

`npm run deploy` is only a manual fallback. The normal production path is the
GitHub integration and requires no manual Cloudflare deployment.

Never commit secrets, API keys, GTM IDs, customer data, or customer-specific credentials.

## License

MIT
