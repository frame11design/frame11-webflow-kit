import * as CookieConsent from 'vanilla-cookieconsent';

type ConsentState = 'granted' | 'denied';
type ConsentSource = 'consent' | 'change';

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

function getDataLayer(): unknown[] {
  window.dataLayer = window.dataLayer ?? [];
  return window.dataLayer;
}

function gtag(..._arguments: unknown[]): void {
  getDataLayer().push(arguments);
}

function toConsentState(accepted: boolean): ConsentState {
  return accepted ? 'granted' : 'denied';
}

export function syncConsentToGoogleAndDataLayer(source: ConsentSource): void {
  const analytics = toConsentState(
    CookieConsent.acceptedCategory('analytics'),
  );
  const marketing = toConsentState(
    CookieConsent.acceptedCategory('marketing'),
  );
  const preferences = CookieConsent.getUserPreferences();

  gtag('consent', 'update', {
    analytics_storage: analytics,
    ad_storage: marketing,
    ad_user_data: marketing,
    ad_personalization: marketing,
  });

  getDataLayer().push({
    event: 'f11_consent_update',
    f11_consent_source: source,
    f11_consent_analytics: analytics,
    f11_consent_marketing: marketing,
    f11_consent_categories: preferences.acceptedCategories,
    f11_consent_services: preferences.acceptedServices,
  });
}
