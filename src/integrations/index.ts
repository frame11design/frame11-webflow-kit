import type { Frame11Module } from '../core/init';

export const integrationsModule: Frame11Module = {
  name: 'integrations',
  selector: '[data-f11-integration]',
  init: () => {
    // Integration hooks will be added in a later release.
  },
};
