# Collab Board

Real-time collaborative whiteboard built with Next.js, TypeScript, Konva, Yjs and PostgreSQL.

## Stack

- Next.js (App Router), TypeScript, Tailwind
- react-konva for canvas rendering
- Yjs CRDT with a custom WebSocket sync server (`ws` + `y-protocols`)
- PostgreSQL for board snapshots

## Getting started

```bash
cp .env.example .env
docker compose up -d
npm install
npm run dev
```

Web app runs on `http://localhost:3000`, realtime server on `ws://localhost:1234`.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Web app and realtime server together |
| `npm run typecheck` | Type-check web and server code |
| `npm run build` | Production build of the web app |
| `npm run start:server` | Run the realtime server |

## Roadmap

- [x] Project setup, realtime server, persistence
- [ ] Canvas with shapes, pen, text, sticky notes
- [ ] Yjs sync, live cursors, presence
- [ ] Undo/redo, zoom/pan
- [ ] Deployment
