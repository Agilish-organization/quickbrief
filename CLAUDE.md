# QuickBrief

Paste any article — get a 3-bullet summary + a tweet version (≤280 chars).

## What it does

Single-page stateless web app. User pastes text → POST /summarize → Claude API
returns 3 bullets + tweet → rendered on /result. No database.

## Running locally

```
cp .env.example .env
# add your ANTHROPIC_API_KEY to .env
npm install
npm start        # http://localhost:3000
```

## Stack

- **Runtime**: Node.js 22, Express 4
- **AI**: Anthropic SDK (`@anthropic-ai/sdk`) — model `claude-sonnet-4-6`
- **Frontend**: Static HTML + CSS (no framework), served from `public/`

## File layout

```
server.js          entry — mounts router, listens on process.env.PORT / 0.0.0.0
routes/summarize.js  GET / → form; POST /summarize → calls Claude; GET /result → output
public/index.html  paste form
public/styles.css  single CSS token block — use classes, no inline styles
Dockerfile         production image
fly.toml           Fly.io free-tier deploy (256 MB shared-cpu-1x)
```

## Conventions

- No database — fully stateless; results passed as URL query params to /result.
- `routes/summarize.js` is the only file that talks to the Anthropic API.
- All user-facing POST actions use Post/Redirect/Get (303 redirect).
- Error messages surface via `?error=` query param on the index page.
- Keep `server.js` under 300 lines.

## Deploy (Fly.io)

```
fly launch --no-deploy   # uses fly.toml
fly secrets set ANTHROPIC_API_KEY=sk-ant-...
fly deploy
```
