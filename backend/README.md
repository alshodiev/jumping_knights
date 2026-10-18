# Chat backend

Relays the website's registration chat to your Telegram.

Flow: visitor clicks a Register button -> Claude greets them -> after their first message the chat says "Connecting you with Coach…" -> a new **topic** is created in your Telegram group for that visitor -> you reply inside the topic and your text appears in their chat. The visitor can only send a new message after a reply. If you don't answer within 5 minutes (`COACH_REPLY_TIMEOUT_SECONDS`) they're asked to leave contact details, and those are forwarded to you. Send `/close` in a topic to end that chat.

The website's contact form also goes through this backend (`POST /api/contact`) and arrives in the group's main (General) area.

## Test it without Telegram or Claude (2 minutes)
```bash
cd backend && npm install && npm run dev        # terminal 1
cd frontend && npm install && npm run dev       # terminal 2  -> http://localhost:5173
```
Click any Register button and type a message. Then answer "as the coach":
```bash
# session id: look in backend/data/sessions.json, or use the newest one
curl -X POST localhost:8787/api/dev/coach-reply -H 'Content-Type: application/json' \
  -d '{"sessionId":"<ID>","text":"Hi! Happy to help."}'
```
Automated check of the whole flow against a fake Telegram: `cd backend && npm test`

## Connect real Telegram
1. In Telegram, open **@BotFather** -> `/newbot` -> pick a name/username -> copy the **token**.
2. Create a new **group** (just you + the bot). Open group settings -> turn on **Topics**.
3. Add your bot to the group and make it **admin** with the **Manage Topics** permission. (Admin also lets it see your replies.)
4. Send any message in the group. Then, with the backend NOT running, open
   `https://api.telegram.org/bot<TOKEN>/getUpdates` in your browser (don't share that URL, it contains the token).
   - `chat.id` (starts with `-100`) is your **TELEGRAM_GROUP_ID**
   - `from.id` is **your user ID** -> **TELEGRAM_COACH_USER_ID**. Only this account can answer visitors.
5. `cp .env.example .env` in `backend/` and fill in the three values.

## Connect Claude
1. Create an API key at console.anthropic.com (billed separately from a Claude subscription). Set a monthly spend limit there.
2. Put it in `.env` as `ANTHROPIC_API_KEY`. `ANTHROPIC_MODEL` defaults to `claude-haiku-5-5`; change it if your account uses a different model name.
3. Without a key the chat still works with a built-in greeting question.

## Deploy later
Needs a host that keeps a Node process running (Render, Fly.io, Railway). Start: `npm run build && npm start`.
Set env vars there: the Telegram/Anthropic values, `ALLOWED_ORIGINS=https://www.jumpingknights.org`, `TRUST_PROXY=1`, `NODE_ENV=production`.
Build the website with `VITE_API_URL=https://<your-backend-host>`.
Secrets live only in the host's environment settings, never in the repo.

## Notes
- Telegram bots can't see when you're typing, so the visitor sees animated dots while waiting rather than "Coach is typing".
- Chats are kept in a JSON file for 24h. On hosts with temporary disks, a restart ends open chats.
