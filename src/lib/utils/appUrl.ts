/** Base URL for opening the app in a new tab (same origin). */
export function getAppUrl(path = '/'): string {
  return `${window.location.origin}${path}`
}

export function openAppInNewTab(path = '/dashboard'): void {
  window.open(getAppUrl(path), '_blank', 'noopener,noreferrer')
}
