# Jumping Knights website

Marketing site for the Jumping Knights chess academy (New York).

## Layout
- `frontend/` Vite + React 19 + TypeScript + Tailwind 3 + shadcn/ui. Single page (`src/pages/LandingPage.tsx`).
- `backend/` (planned) small Node + TypeScript service for the registration chat: Claude greeting -> Telegram forum topic per visitor -> coach replies relayed back to the browser.
- `.github/workflows/` `ci.yml` (build on PRs), `deploy-frontend.yml` (GitHub Pages on push to main).

## Commands (run in `frontend/`)
- `npm install`, `npm run dev`, `npm run build` (typechecks then builds), `npm run preview`

## Decisions
- No custom login. The Login button links to ChessLang at `coaching.jumpingknights.org` (`src/config.ts`). Coaches and students use the same button.
- Contact form posts to an existing Google Apps Script (`src/config.ts`).
- Every Register button calls `useRegisterChat().open("<program name>")`; the chat widget (bottom-left on desktop, bottom sheet on mobile) reads that topic.
- Chat rules: visitor input is disabled until Claude/coach replies; if the coach does not reply within 5 minutes, fall back to collecting contact info.

## Security rules
- Never put API keys or tokens (Anthropic, Telegram) in `frontend/` code. They live only in backend env vars / GitHub Secrets.
- Never commit `.env` files.
- Keep site content as is unless asked; known inconsistencies: private lessons shown as $100/session (Programs) vs $80/hour (FAQ); group $600/12 classes vs "$40/session" (FAQ); Tots "max 4" vs group "4-6".
