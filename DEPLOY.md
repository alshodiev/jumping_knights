# Deploying Jumping Knights

Two parts: the **website** (static files) and the **chat backend** (a small Node server).
Login is not handled here: the Login button links to ChessLang at `coaching.jumpingknights.org`.

## 1. Chat backend (needed for the contact form and registration chat)
Host anywhere that keeps a Node 20+ process running (Render, Fly.io, Railway, a VPS).

- Root directory: `backend`
- Build command: `npm ci --include=dev && npm run build`
- Start command: `npm start`
- Environment variables (set in the host's dashboard, never in the repo):

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `TRUST_PROXY` | `1` |
| `ALLOWED_ORIGINS` | the website address, e.g. `https://www.jumpingknights.org` |
| `TELEGRAM_BOT_TOKEN` | from @BotFather |
| `TELEGRAM_GROUP_ID` | the group id (starts with `-100`) |
| `TELEGRAM_COACH_USER_ID` | the coach's own Telegram user id |
| `TELEGRAM_CLIENTS_THREAD_ID` | id of the "Potential Clients" topic (contact-form messages) |
| `ANTHROPIC_API_KEY` | optional; without it the chat uses a built-in greeting question |
| `COACH_REPLY_TIMEOUT_SECONDS` | optional, default `300` |

Run **only one** copy of the backend per Telegram bot, otherwise Telegram reports a "Conflict" and replies get lost.
Check it is up: `https://<backend-host>/api/health` should show `{"ok":true,"telegram":true}`.

## 2. Website
Any static host works (Vercel, Netlify, Cloudflare Pages, GitHub Pages).

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Build-time variable: `VITE_API_URL` = the backend address from step 1 (e.g. `https://api.jumpingknights.org`)

On GitHub Pages: set `VITE_API_URL` under *Settings -> Secrets and variables -> Actions -> Variables*,
and set *Settings -> Pages -> Source* to "GitHub Actions". The workflow in `.github/workflows/deploy-frontend.yml` does the rest on every push to `main`.

If the site is served from a sub-path (for example `github.io/repo-name/`), also set `VITE_BASE` to `/repo-name/`. For a custom domain leave it unset.

## 3. After deploying, check
1. The Login button opens ChessLang.
2. A Register button opens the chat; sending a first message (with a name) creates a topic in the Telegram group, and replying there shows up in the chat.
3. The contact form shows "Thank you!" and the message appears in the Potential Clients topic.

## Render (free plan) via render.yaml
1. Render → New → Blueprint → pick this repo. It reads `render.yaml`.
2. Paste `TELEGRAM_BOT_TOKEN` (and optionally `ANTHROPIC_API_KEY`) when prompted.
3. Add your Vercel preview URL to `ALLOWED_ORIGINS` if testing before the domain moves.
4. Keep it awake: free UptimeRobot HTTP monitor on `https://<service>.onrender.com/api/health`, every 5 minutes.
5. Set `VITE_API_URL=https://<service>.onrender.com` in Vercel and redeploy the frontend.
Free-plan chats are lost if Render restarts the service; that is expected.
