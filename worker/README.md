# JP Match online room service

Cloudflare Worker + SQLite-backed Durable Object for anonymous private rooms.

## Local development

```bash
npx wrangler dev --config worker/wrangler.jsonc
```

The static frontend expects the local service at `http://127.0.0.1:8787` when opened from localhost. Production uses `https://jp-match-online.yorkwahaha.workers.dev` unless the `jp-match-online-api` meta value is changed.

## Deployment

```bash
npx wrangler deploy --config worker/wrangler.jsonc
```

Before deploying from another Pages origin or custom domain, add the exact origin to `ALLOWED_ORIGINS`. Do not use `*`: room tokens travel in WebSocket URLs and origin validation is part of the service boundary.

Rooms expire after two hours of inactivity. No email, password, chat history, profile, ranking, or permanent match history is stored.
