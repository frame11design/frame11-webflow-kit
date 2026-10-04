import './styles/frame11.css';

import {
  getFrame11State,
  initFrame11,
  rescanFrame11,
  type Frame11InitOptions,
  type Frame11RuntimeState,
} from './core/init';
import { consentModule } from './consent';
import { formsModule } from './forms';
import { integrationsModule } from './integrations';
import { navigationModule } from './navigation';

const VERSION = '0.2.0';
const registeredModules = [
  formsModule,
  navigationModule,
  consentModule,
  integrationsModule,
];

interface Frame11PublicApi {
  readonly version: string;
  init: (options?: Frame11InitOptions) => void;
  rescan: () => void;
  state: () => Frame11RuntimeState;
}

declare global {
  interface Window {
    F11?: Frame11PublicApi;
  }
}

const api: Frame11PublicApi = Object.freeze({
  version: VERSION,
  init: (options = {}) => initFrame11(registeredModules, options),
  rescan: rescanFrame11,
  state: getFrame11State,
});

if (window.F11) {
  window.F11.init();
} else {
  Object.defineProperty(window, 'F11', {
    value: api,
    configurable: false,
    enumerable: false,
    writable: false,
  });

  api.init();
}
