import { SHOW_VIDEO_TIME } from "@/config";

export const formatDate = (ms: number) =>
  new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/** e.g. "Nov 26, 2026, 12:30 PM EST" (in the viewer's own time zone) */
export const formatDateTime = (ms: number) =>
  new Date(ms).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" });

/** What videos show as their "posted" stamp: date + time, or date only (see SHOW_VIDEO_TIME in config.ts). */
export const formatPosted = (ms: number) => (SHOW_VIDEO_TIME ? formatDateTime(ms) : formatDate(ms));

export function formatSize(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Full address of a video's own page, e.g. https://www.jumpingknights.org/watch/abc123 */
export const watchLink = (id: string) => new URL(`${import.meta.env.BASE_URL}watch/${id}`, window.location.origin).href;

export async function copyText(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* fall through */ }
  try {
    const t = document.createElement("textarea");
    t.value = text; t.style.position = "fixed"; t.style.opacity = "0";
    document.body.appendChild(t); t.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(t);
    return ok;
  } catch { return false; }
}
