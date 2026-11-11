# Support Desk (AI SDK 7)

A small Next.js support chat: it answers questions about orders, looks orders up with a tool, triages tickets into a structured shape, and logs token usage.

This repo is the practice target for the [Nimble × eve Software Factory cookbook](#): it started on AI SDK 6 on purpose, and has since been upgraded to AI SDK 7 by the factory following the official migration guide.

## Checks

```bash
npm ci
npm run typecheck
npm test        # Vitest with mock models: no API key needed
npm run build
```

All three pass on AI SDK 7.

## Run it locally

```bash
cp .env.example .env.local   # add AI_GATEWAY_API_KEY
npm run dev
```

Try "Where is order A-1001?"
