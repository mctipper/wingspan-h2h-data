/**
 * Page URLs relative to the Vite base path, so links work identically under
 * GitHub Pages (served from a sub-path) and local development. Build every
 * internal link through these rather than hard-coding paths.
 */

/** The configured base path, always with a trailing slash (e.g. "/wingspan-h2h-data/"). */
export function getBaseUrl(): string {
  return import.meta.env.BASE_URL;
}

/** The public summary page. */
export function getMainUrl(): string {
  return getBaseUrl();
}

/** The single-game analysis page for `gameId`. */
export function getAnalysisUrl(gameId: number): string {
  return `${getBaseUrl()}analysis/?game=${gameId}`;
}

/** The admin app; only served when running in admin mode (it is excluded from the public build). */
export function getAdminUrl(): string {
  return `${getBaseUrl()}admin/`;
}
