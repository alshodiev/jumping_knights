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
