# Cookie consent

FRAME11 bundles Vanilla CookieConsent 3.1.0. The library owns behavior and callbacks; each Webflow project supplies its own texts, categories, services, and visual overrides.

This document describes the technical integration. It is not legal advice. Category assignments and consent copy must be reviewed for each customer and jurisdiction.

## Loading order

Consent uses two layers because Google Consent Mode defaults must exist before Google Tag Manager:

1. Place the synchronous consent-default snippet at the top of the sitewide head.
2. Place the normal Google Tag Manager script immediately after it.
3. Add the FRAME11 stylesheet in the head.
4. Add the GTM noscript iframe and the FRAME11 runtime before `</body>`.

Do not delay consent initialization with `window.load` or a timeout.

## Sitewide head code

Replace `GTM-<gtm-id>` only in the GTM snippet. Never store the container ID in the FRAME11 repository.

```html
<!-- Google Consent Mode defaults: must run before GTM -->
<script>
  (() => {
    window.dataLayer = window.dataLayer || [];

    function gtag() {
      window.dataLayer.push(arguments);
    }

    gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      functionality_storage: 'granted',
      security_storage: 'granted',
      wait_for_update: 500
    });
  })();
</script>

<!-- Google Tag Manager -->
<script>
  (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','GTM-<gtm-id>');
</script>
<!-- End Google Tag Manager -->

<link
  rel="stylesheet"
  href="https://cdn.frame11.at/v0.4.2/frame11.css"
>
```

The Google defaults intentionally deny analytics and advertising while allowing functionality and security storage. Confirm this policy for each project. `wait_for_update` gives the asynchronously loaded consent UI a short window to restore an existing choice.

## Activate consent

Add `data-f11-consent` to the `<html>` element. In Webflow this can be added through sitewide custom code:

```html
<script>
  document.documentElement.setAttribute('data-f11-consent', '');
</script>
```

The attribute contains no configuration and no customer data. It only enables the module.

## Site configuration

Add exactly one inert JSON script to the sitewide head or before `</body>`. JSON does not support comments or trailing commas.

```html
<script type="application/json" data-f11-consent-config>
{
  "mode": "opt-in",
  "revision": 1,
  "guiOptions": {
    "consentModal": {
      "layout": "box",
      "position": "bottom right",
      "equalWeightButtons": true,
      "flipButtons": false
    },
    "preferencesModal": {
      "layout": "box",
      "position": "right",
      "equalWeightButtons": true
    }
  },
  "categories": {
    "necessary": {
      "enabled": true,
      "readOnly": true
    },
    "analytics": {
      "services": {
        "google-analytics": {
          "label": "Google Analytics"
        }
      }
    },
    "marketing": {
      "services": {
        "google-ads": {
          "label": "Google Ads"
        },
        "meta-pixel": {
          "label": "Meta Pixel"
        }
      }
    }
  },
  "language": {
    "default": "de",
    "autoDetect": "document",
    "translations": {
      "de": {
        "consentModal": {
          "title": "Cookie-Einstellungen",
          "description": "Wir verwenden Cookies, um Ihnen ein bestmögliches Erlebnis auf unserer Website zu bieten. Sie entscheiden selbst, welche Cookies Sie zulassen möchten.",
          "acceptAllBtn": "Alle akzeptieren",
          "acceptNecessaryBtn": "Nur notwendige",
          "showPreferencesBtn": "Einstellungen"
        },
        "preferencesModal": {
          "title": "Datenschutz & Cookies",
          "acceptAllBtn": "Alle akzeptieren",
          "acceptNecessaryBtn": "Nur notwendige Cookies",
          "savePreferencesBtn": "Auswahl speichern",
          "closeIconLabel": "Einstellungen schließen",
          "serviceCounterLabel": "Services",
          "sections": [
            {
              "title": "Ihre Auswahl",
              "description": "Hier können Sie festlegen, welche Arten von Cookies wir verwenden dürfen. Ihre Entscheidung können Sie jederzeit über den Link im Footer anpassen."
            },
            {
              "title": "Notwendige Cookies",
              "description": "Diese Cookies sind erforderlich, damit die Website technisch einwandfrei funktioniert, und können nicht deaktiviert werden.",
              "linkedCategory": "necessary"
            },
            {
              "title": "Statistik",
              "description": "Diese Cookies helfen uns zu verstehen, wie Besucherinnen und Besucher unsere Website nutzen.",
              "linkedCategory": "analytics"
            },
            {
              "title": "Marketing",
              "description": "Marketing-Cookies ermöglichen relevante Inhalte und Angebote über externe Plattformen.",
              "linkedCategory": "marketing"
            }
          ]
        }
      }
    }
  }
}
</script>
```

FRAME11 requires opt-in mode, a read-only `necessary` category, and a translation for the default locale. Optional categories must not use `enabled: true`. Callbacks, the modal root, and CookieConsent script-tag management are controlled by FRAME11 and cannot be configured through JSON.

Increase `revision` when visitors must be asked again after a material policy or category change.

## Runtime before `</body>`

```html
<!-- Google Tag Manager (noscript) -->
<noscript>
  <iframe
    src="https://www.googletagmanager.com/ns.html?id=GTM-<gtm-id>"
    height="0"
    width="0"
    style="display:none;visibility:hidden"
  ></iframe>
</noscript>
<!-- End Google Tag Manager (noscript) -->

<script
  defer
  src="https://cdn.frame11.at/v0.4.2/frame11.js"
></script>
```

Vanilla CookieConsent JavaScript and CSS are already included in the FRAME11 assets. Do not load their CDN files separately.

## Open preferences from Webflow

Build and style a normal button or link in Webflow, then add the custom attribute:

```text
data-f11-consent-open
```

Example output:

```html
<button type="button" data-f11-consent-open>
  Cookie-Einstellungen
</button>
```

FRAME11 uses event delegation, so the trigger also works when Webflow or another script inserts it later.

## Styling

Keep customer colors and component design in the Webflow project. Override Vanilla CookieConsent variables after loading `frame11.css`:

```html
<style id="CookieConsent-Styles">
  #cc-main {
    --cc-font-family: inherit;
    --cc-bg: #ffffff;
    --cc-primary-color: #111827;

    --cc-btn-primary-bg: #e66141;
    --cc-btn-primary-border-color: #e85313;
    --cc-btn-primary-hover-bg: #ffffff;
    --cc-btn-primary-hover-border-color: #e85313;
    --cc-btn-primary-color: #ffffff;

    --cc-btn-secondary-bg: #f3f4f6;
    --cc-btn-secondary-border-color: #e5e7eb;
    --cc-btn-secondary-hover-bg: #e5e7eb;
    --cc-btn-secondary-hover-border-color: #d1d5db;
    --cc-btn-secondary-color: #111827;

    --cc-toggle-on-bg: var(--cc-btn-primary-bg);
    --cc-toggle-off-bg: #e5e7eb;
    --cc-modal-border-radius: 16px;
    --cc-btn-border-radius: 8px;
    --cc-modal-margin: 1.25rem;
  }
</style>
```

The correct text-color variables end in `-color`, not `-text`. Floating buttons, icons, shadows, and hover animations should be normal Webflow classes rather than shared FRAME11 design.

## Data layer contract

On initial valid consent and every later change, FRAME11 first sends a Google Consent Mode update and then pushes:

```js
{
  event: 'f11_consent_update',
  f11_consent_source: 'consent',
  f11_consent_analytics: 'granted',
  f11_consent_marketing: 'denied',
  f11_consent_categories: ['necessary', 'analytics'],
  f11_consent_services: {
    analytics: ['google-analytics']
  }
}
```

Google tags should use their built-in Consent Mode checks. Other tags can use `f11_consent_update` and the FRAME11 data-layer variables in GTM. Do not create separate `allowed` events for every category; the single state event is deterministic on every page.

## Verification checklist

Test on the Webflow staging domain before changing production:

1. New visitor: all optional Google consent types start as denied.
2. Necessary only: analytics and marketing remain denied.
3. Accept all: analytics and advertising values change to granted.
4. Preferences: changing either category produces one `f11_consent_update` event.
5. Reload: the saved choice is restored and synchronized.
6. Footer or floating trigger: the preferences modal opens.
7. Tag Assistant: defaults appear before updates and tags respect their consent requirements.
