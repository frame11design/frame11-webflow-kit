export function onDomReady(callback: () => void): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback, { once: true });
    return;
  }

  queueMicrotask(callback);
}

export function hasElement(selector: string): boolean {
  return document.querySelector(selector) !== null;
}
