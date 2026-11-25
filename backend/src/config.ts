import "dotenv/config";

const num = (v: string | undefined, d: number) =>
  v !== undefined && v !== "" && !Number.isNaN(Number(v)) ? Number(v) : d;

export const config = {
  port: num(process.env.PORT, 8787),
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? "http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  anthropicKey: process.env.ANTHROPIC_API_KEY ?? "",
  anthropicModel: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
  tgToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  tgGroupId: process.env.TELEGRAM_GROUP_ID ?? "",
  tgCoachId: process.env.TELEGRAM_COACH_USER_ID ?? "",
  // Optional: reuse an existing "Potential Clients" topic instead of letting the backend create one
  tgClientsThreadId: num(process.env.TELEGRAM_CLIENTS_THREAD_ID, 0),
  tgClientsTopicName: process.env.TELEGRAM_CLIENTS_TOPIC_NAME || "Potential Clients",
  tgApiBase: process.env.TELEGRAM_API_BASE || "https://api.telegram.org",
  coachTimeoutMs: num(process.env.COACH_REPLY_TIMEOUT_SECONDS, 300) * 1000,
  startLimitPerHour: num(process.env.START_LIMIT_PER_HOUR, 20),
  trustProxy: num(process.env.TRUST_PROXY, 0),
  dataDir: process.env.DATA_DIR || "./data",
  isProd: process.env.NODE_ENV === "production",

  // ---- Videos (private library) ----
  /** Coach sign-in. Hash made with `npm run hash-password`. Without it, video management is disabled. */
  coachUsername: process.env.COACH_USERNAME || "coach",
  coachPasswordHash: process.env.COACH_PASSWORD_HASH ?? "",
  /** Random secret used to sign the coach cookie. Make one with: openssl rand -hex 32 */
  sessionSecret: process.env.SESSION_SECRET ?? "",
  cookieSameSite: (["lax", "strict", "none"].includes(process.env.COOKIE_SAMESITE ?? "") ? process.env.COOKIE_SAMESITE : "lax") as "lax" | "strict" | "none",
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
  /** This API's own public address. Only used to build upload/stream links in local test mode. */
  publicApiUrl: (process.env.PUBLIC_API_URL || `http://localhost:${num(process.env.PORT, 8787)}`).replace(/\/+$/, ""),
  r2: {
    accountId: process.env.R2_ACCOUNT_ID ?? "",
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
    bucket: process.env.R2_BUCKET ?? "",
  },
  maxVideoBytes: num(process.env.MAX_VIDEO_MB, 1024) * 1024 * 1024,
  /** How long a "watch" link stays valid after the right password is entered. */
  videoLinkTtlSeconds: num(process.env.VIDEO_LINK_TTL_SECONDS, 1800),
};

/** Must match the labels sent by the Register buttons on the site. */
export const TOPICS = [
  "Group Lessons",
  "Private Lessons",
  "Tots (Ages 4-6)",
  "Juniors (Ages 7-12)",
  "Jumpstarters (Ages 13-17)",
  "Adults (18+)",
] as const;
