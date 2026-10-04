export function readBooleanAttribute(
  element: Element,
  attributeName: string,
): boolean {
  const value = element.getAttribute(attributeName);

  return value === '' || value === 'true' || value === '1';
}

export function debugLog(enabled: boolean, message: string): void {
  if (enabled) {
    console.info(`[FRAME11] ${message}`);
  }
}
