import { hasElement, onDomReady } from './dom';
import { debugLog, readBooleanAttribute } from './utils';

export interface Frame11ModuleContext {
  debug: boolean;
}

export interface Frame11Module {
  name: string;
  selector: string;
  init: (context: Frame11ModuleContext) => void;
}

export interface Frame11InitOptions {
  debug?: boolean;
}

export interface Frame11RuntimeState {
  started: boolean;
  debug: boolean;
  initializedModules: string[];
}

const modules = new Map<string, Frame11Module>();
const initializedModules = new Set<string>();

let started = false;
let startScheduled = false;
let debug = false;

function registerModules(newModules: Frame11Module[]): void {
  for (const module of newModules) {
    modules.set(module.name, module);
  }
}

function scanModules(): void {
  for (const module of modules.values()) {
    if (initializedModules.has(module.name) || !hasElement(module.selector)) {
      continue;
    }

    try {
      module.init({ debug });
      initializedModules.add(module.name);
      debugLog(debug, `Initialized module: ${module.name}`);
    } catch (error) {
      console.error(`[FRAME11] Failed to initialize module: ${module.name}`, error);
    }
  }
}

function start(): void {
  startScheduled = false;
  started = true;

  if (readBooleanAttribute(document.documentElement, 'data-f11-debug')) {
    debug = true;
  }

  scanModules();
  debugLog(debug, 'Runtime ready');
}

export function initFrame11(
  newModules: Frame11Module[],
  options: Frame11InitOptions = {},
): void {
  registerModules(newModules);

  if (options.debug !== undefined) {
    debug = options.debug;
  }

  if (started) {
    scanModules();
    return;
  }

  if (!startScheduled) {
    startScheduled = true;
    onDomReady(start);
  }
}

export function rescanFrame11(): void {
  if (started) {
    scanModules();
    return;
  }

  if (!startScheduled) {
    startScheduled = true;
    onDomReady(start);
  }
}

export function getFrame11State(): Frame11RuntimeState {
  return {
    started,
    debug,
    initializedModules: [...initializedModules],
  };
}
