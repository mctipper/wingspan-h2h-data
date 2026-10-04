/**
 * Escapes text for safe interpolation into HTML markup — element content and
 * quoted attribute values alike. Use for any string not authored in source
 * (dataset values, user input, server messages) before it reaches `innerHTML`.
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
