import type { Frame11Module } from '../core/init';
import { initFormSuccessTracking } from './form-success';

export const integrationsModule: Frame11Module = {
  name: 'integrations',
  selector: '[data-f11-integration], form[data-f11-form-track]',
  init: ({ debug }) => {
    initFormSuccessTracking(debug);
  },
};
