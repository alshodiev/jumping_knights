# Jumping Knights website

Marketing site for the Jumping Knights chess academy (New York).

## Layout
- `frontend/` Vite + React 19 + TypeScript + Tailwind 3 + shadcn/ui. Routes (react-router): `/` home, `/videos` feed, `/watch/:id` one video, `/coach` coach sign-in + upload. The home page `src/pages/LandingPage.tsx` composes sections in `src/components/site/` (Header, Hero, Programs, Locations, About, Testimonials, Contact, Footer). All copy (programs, levels, locations, testimonials, FAQ) is in `src/data/content.ts`; links/contact details in `src/config.ts`.
- `backend/` Node + TypeScript (Express) service for the registration chat: Claude greeting -> Telegram forum topic per visitor (long polling, no webhook) -> coach replies relayed to the browser over SSE. See `backend/README.md`. Tests: `cd backend && npm test` (runs against a fake Telegram).
- `.github/workflows/` `ci.yml` (build on PRs), `deploy-frontend.yml` (GitHub Pages on push to main).

## Private videos
- Feed (`/videos`) shows locked grey cards with only the upload date. Each video has its own password set by the coach; the server stores only a scrypt hash. Right password -> short-lived signed link (R2) and the video loads on demand.
- Coach (`/coach`): one account (`COACH_USERNAME` + `COACH_PASSWORD_HASH`), HttpOnly cookie, CSRF header on changes. Uploads go browser -> R2 via a presigned PUT, then `/complete`.
- Backend code: `backend/src/{auth,storage,videos}.ts`; records live in `jk/videos.json` inside the storage (so they survive Render restarts). Dev uses a local folder instead of R2. Tests: `backend/scripts/videos-e2e.ts`.
- Setup steps: `DEPLOY.md` (Private videos). Needs `api.jumpingknights.org` so the cookie is same-site.

## Commands
- `frontend/`: `npm install`, `npm run dev`, `npm run build` (typechecks then builds), `npm run preview`
- `backend/`: `npm install`, `npm run dev`, `npm run typecheck`, `npm test`

## Decisions
- No custom student/coach login. The only sign-in on this site is `/coach` (for the video library). The Login button links to ChessLang at `coaching.jumpingknights.org` (`src/config.ts`). Coaches and students use the same button.
- Contact form posts to the backend (`POST /api/contact`), which relays it to the Telegram group's General area. (The old Google Apps Script is no longer used.) Anti-spam: hidden honeypot field + 5/hour rate limit.
- Footer "Programs" links scroll to the card or open the matching Skill Level accordion item (state lives in `LandingPage`).
- Privacy Policy is a dialog (`PrivacyDialog.tsx`); the text is a plain-language draft that should be reviewed before relying on it.
- Every Register button calls `useRegisterChat().open("<program name>")`; the chat widget (`src/components/chat/RegisterChatWidget.tsx`, bottom-left on desktop, bottom sheet on mobile) starts a session with that topic. Program labels must match `TOPICS` in `backend/src/config.ts`.
- Chat rules: visitor input is disabled until Claude/coach replies; if the coach does not reply within 5 minutes, fall back to collecting contact info.

## Security rules
- Never put API keys or tokens (Anthropic, Telegram) in `frontend/` code. They live only in backend env vars / GitHub Secrets.
- Never commit `.env` files.
- Keep site content as is unless asked; known inconsistencies: private lessons shown as $100/session (Programs) vs $80/hour (FAQ); group $600/12 classes vs "$40/session" (FAQ); Tots "max 4" vs group "4-6".
