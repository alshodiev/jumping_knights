// Set VITE_API_URL at build time to the deployed backend (e.g. https://api.jumpingknights.org)
export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8787";

export interface ContactPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
  website: string; // honeypot, must stay empty
}

export async function sendContact(data: ContactPayload): Promise<void> {
  const res = await fetch(`${API_URL}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
}
