/**
 * Generate URLs relative to the Vite base path.
 * Handles both GitHub Pages deployment and local development correctly.
 */

export function getBaseUrl(): string {
  return import.meta.env.BASE_URL;
}

export function getMainUrl(): string {
  return getBaseUrl();
}

export function getAnalysisUrl(gameId: number): string {
  return `${getBaseUrl()}analysis/?game=${gameId}`;
}

export function getAdminUrl(): string {
  return `${getBaseUrl()}admin/`;
}
