/**
 * Shows a transient notification that fades out after ~3.5s. Message is set via
 * `textContent`, so server-provided text is safe to pass. No-op if the page has
 * no `#toast-container`.
 */
export function showToast(message: string, type: "success" | "error"): void {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = "opacity 0.3s";
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
