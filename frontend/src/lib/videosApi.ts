import { API_URL } from "./api";

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function request<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const method = init.method ?? "GET";
  const headers: Record<string, string> = {};
  if (init.body !== undefined) headers["Content-Type"] = "application/json";
  if (method !== "GET") headers["X-JK-CSRF"] = "1"; // the server only accepts changes that carry this
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      credentials: "include", // sends the coach's sign-in cookie
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiError(0, "We couldn't reach the server. Please check your connection and try again.");
  }
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new ApiError(res.status, data.error ?? `Something went wrong (${res.status}).`);
  return data;
}

// ---------- public ----------
export interface PublicVideo { id: string; createdAt: number }
export const listVideos = () => request<{ videos: PublicVideo[] }>("/api/videos").then((r) => r.videos);
export const getVideo = (id: string) => request<PublicVideo>(`/api/videos/${encodeURIComponent(id)}`);
export const unlockVideo = (id: string, password: string) =>
  request<{ url: string; expiresIn: number }>(`/api/videos/${encodeURIComponent(id)}/unlock`, { method: "POST", body: { password } });

// ---------- coach ----------
export interface CoachVideo { id: string; note: string; createdAt: number; size: number; status: "uploading" | "ready" }
export interface UploadTarget { url: string; method: string; headers: Record<string, string> }

export const coachMe = () => request<{ signedIn: boolean; configured: boolean }>("/api/coach/me");
export const coachLogin = (username: string, password: string) => request<{ ok: true }>("/api/coach/login", { method: "POST", body: { username, password } });
export const coachLogout = () => request<{ ok: true }>("/api/coach/logout", { method: "POST" });
export const coachList = () => request<{ videos: CoachVideo[] }>("/api/coach/videos").then((r) => r.videos);
export const coachCreate = (b: { note: string; password: string; size: number }) =>
  request<{ id: string; upload: UploadTarget }>("/api/coach/videos", { method: "POST", body: { ...b, contentType: "video/mp4" } });
export const coachComplete = (id: string) => request<{ ok: true }>(`/api/coach/videos/${id}/complete`, { method: "POST" });
export const coachPatch = (id: string, b: { note?: string; password?: string }) => request<{ ok: true }>(`/api/coach/videos/${id}`, { method: "PATCH", body: b });
export const coachDelete = (id: string) => request<{ ok: true }>(`/api/coach/videos/${id}`, { method: "DELETE" });
export const coachPlay = (id: string) => request<{ url: string; expiresIn: number }>(`/api/coach/videos/${id}/play`);

/** Sends the file straight to storage (not through our server), with progress. */
export function uploadFile(target: UploadTarget, file: File, onProgress: (fraction: number) => void, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const x = new XMLHttpRequest();
    x.open(target.method, target.url);
    for (const [k, v] of Object.entries(target.headers)) x.setRequestHeader(k, v);
    x.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(e.loaded / e.total); };
    x.onload = () => (x.status >= 200 && x.status < 300 ? resolve() : reject(new Error(`The upload was refused (${x.status}). Please try again.`)));
    x.onerror = () => reject(new Error("The upload was interrupted. Check your connection and try again. If it keeps failing, the storage bucket's CORS settings may be missing."));
    x.onabort = () => reject(new Error("Upload cancelled."));
    signal?.addEventListener("abort", () => x.abort());
    x.send(file);
  });
}
