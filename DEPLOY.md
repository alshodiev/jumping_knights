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

## Private videos (Videos page + coach upload)

How it works: the Videos page lists every video as a grey locked card showing only its upload date. Each video has its own password that you choose when you upload it. Visitors enter the password to watch. You sign in at `/coach` to upload, change passwords, edit notes and delete. Video files live in Cloudflare R2 (private). Nothing is requested until the right password is entered.

### One-time setup

**1. Cloudflare R2 (free storage, about 10 GB)**
1. Create or sign in to an account at dash.cloudflare.com. Open **R2 Object Storage**. Cloudflare may ask for a payment card to switch R2 on; the free allowance still applies. Check the current free limits on their pricing page.
2. **Create bucket**: name `jumping-knights-videos`. Leave "Public access" OFF.
3. Open the bucket → **Settings → CORS Policy → Add** and paste (add your real site addresses):
   ```json
   [
     {
       "AllowedOrigins": ["https://www.jumpingknights.org", "https://jumpingknights.org"],
       "AllowedMethods": ["PUT"],
       "AllowedHeaders": ["Content-Type"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```
4. Back on the R2 overview page: **Manage API Tokens → Create API token**. Permission: **Object Read & Write**. Apply it to the `jumping-knights-videos` bucket only. Copy the **Access Key ID** and **Secret Access Key** (shown once). Your **Account ID** is on the same R2 page.

**2. Coach password**
On your computer: `cd backend && npm install && npm run hash-password`. Type a long password (typing is hidden). It prints one line starting with `COACH_PASSWORD_HASH=`. Copy the part after the `=`. The hash is safe to store: the real password can't be worked out from it.

**3. Render environment variables** (service → Environment)
| Key | Value |
|---|---|
| `COACH_USERNAME` | the username you want, e.g. `murad` |
| `COACH_PASSWORD_HASH` | the hash from step 2 |
| `R2_ACCOUNT_ID` | from step 1 |
| `R2_ACCESS_KEY_ID` | from step 1 |
| `R2_SECRET_ACCESS_KEY` | from step 1 |
| `R2_BUCKET` | `jumping-knights-videos` |
| `SESSION_SECRET` | any long random text (the blueprint can generate it), or run `openssl rand -hex 32` |

`ALLOWED_ORIGINS` must include `https://www.jumpingknights.org` (comma-separated, no spaces).

**4. Give the backend its own address `api.jumpingknights.org`** (needed so the coach sign-in cookie works)
1. Render → your service → **Settings → Custom Domains → Add** `api.jumpingknights.org`. Render shows a CNAME target (it looks like `jumping-knights-backend.onrender.com`).
2. Namecheap → Domain List → Manage → **Advanced DNS → Add New Record**: Type `CNAME`, Host `api`, Value = the target Render showed. Save. Leave all other records alone.
3. Back in Render click **Verify**. It can take a few minutes to a few hours, then HTTPS turns on automatically.
4. Vercel → project → Settings → Environment Variables: set `VITE_API_URL` to `https://api.jumpingknights.org`, then redeploy.

**5. Try it**: open `https://www.jumpingknights.org/coach`, sign in, upload a video.

### Making videos small (do this before uploading)
Phone videos are huge. This shrinks a typical 2-7 minute video to roughly 40-100 MB and makes it start playing quickly:
```
ffmpeg -i input.mp4 -vf "scale=-2:'min(720,ih)'" -c:v libx264 -crf 26 -preset slow -c:a aac -b:a 128k -movflags +faststart output.mp4
```
(No ffmpeg? On a Mac: `brew install ffmpeg`, or use the free app HandBrake with the "Fast 720p30" preset.)

### Good to know
- Passwords are stored only as scrambled hashes; nobody, including you, can read one later. Set a new one if you forget.
- Changing a video's password stops new viewers using the old one. A watch link someone already opened keeps working until it expires (30 minutes).
- Anyone who has both the link and the password can pass them on. To cut everyone off, change the password or delete the video.
- Wrong guesses are limited per video and per visitor, and coach sign-in is rate limited too.
- Free-plan caveat: Render's free service can restart now and then. Videos and their passwords are safe (they live in R2), but a visitor's lockout counter resets.
- If the videos include children, get a parent's permission first and mention videos in the privacy policy.

