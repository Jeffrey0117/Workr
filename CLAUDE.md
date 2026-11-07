# Workr

Universal job queue with worker pool and real-time SSE updates.

## Stack

- Node.js raw HTTP server (CJS)
- sharp (image processing), puppeteer (browser automation)
- File-based JSON queue (data/queue.json)
- Server-Sent Events for real-time updates
- Port: 4002

## Run

```bash
npm run dev       # dev with file watch
npm start         # production
```

## Key Files

```
server.js              — HTTP server + auth
src/api/index.js       — Router + all endpoints
src/api/admin.js       — Admin dashboard HTML
src/api/docs.js        — API docs HTML
src/queue/index.js     — Memory queue + JSON persistence
src/workers/index.js   — Worker manager (concurrency control)
src/workers/thumbnail.js — FFmpeg thumbnail extraction
src/workers/webp.js    — Sharp image conversion
src/workers/hls.js     — HLS transcoding
src/workers/download.js — File download
src/workers/proxy.js   — Proxy worker
```

## API

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| POST | `/api/jobs` | Create job | Bearer |
| GET | `/api/jobs` | List jobs (?status, ?type, ?limit) | Bearer |
| GET | `/api/jobs/:id` | Get job details | Bearer |
| DELETE | `/api/jobs/:id` | Cancel job | Bearer |
| GET | `/api/events` | SSE stream | Bearer |
| GET | `/api/stats` | Queue stats | Public |
| GET | `/health` | Health check | Public |

## Job Types

| Type | Concurrency | Purpose |
|------|-------------|---------|
| thumbnail | 3 | Video thumbnail extraction |
| webp | 3 | Image format conversion |
| hls | 1 | HLS transcoding |
| download | 5 | File download |
| proxy | 10 | Proxy requests |
| deploy | 1 | Deployment tasks |

## Env

- `PORT` (default: 4002)
- `WORKR_API_KEY` (required; unset = random key, everything except /health /admin /docs /api/stats locked)

## CloudPipe

- Manifest: `data/manifests/workr.json` (6 tools)
- Auth: bearer `WORKR_API_KEY` (auth.json)
- Entry: `server.js`
