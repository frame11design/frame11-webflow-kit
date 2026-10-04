import * as CookieConsent from 'vanilla-cookieconsent';
import 'vanilla-cookieconsent/dist/cookieconsent.css';

import type { Frame11Module } from '../core/init';
import { debugLog } from '../core/utils';
import { readConsentConfig } from './config';
import { syncConsentToGoogleAndDataLayer } from './google-consent';

const OPEN_PREFERENCES_SELECTOR = '[data-f11-consent-open]';

function bindPreferencesTriggers(): void {
  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const trigger = event.target.closest<HTMLElement>(OPEN_PREFERENCES_SELECTOR);

    if (!trigger) {
      return;
    }

    event.preventDefault();
    CookieConsent.showPreferences();
  });
}

async function initConsent(debug: boolean): Promise<void> {
  const siteConfig = readConsentConfig();

  bindPreferencesTriggers();

  await CookieConsent.run({
    ...siteConfig,
    manageScriptTags: false,
    onConsent: () => {
      syncConsentToGoogleAndDataLayer('consent');
    },
    onChange: () => {
      syncConsentToGoogleAndDataLayer('change');
    },
  });

  debugLog(debug, 'Cookie consent ready');
}

export const consentModule: Frame11Module = {
  name: 'consent',
  selector: '[data-f11-consent]',
  init: ({ debug }) => {
    void initConsent(debug).catch((error: unknown) => {
      console.error('[FRAME11] Failed to initialize cookie consent.', error);
    });
  },
};
