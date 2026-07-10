# Changelog

All notable changes to this repository, in chronological order.

## 2026-07-09

- Initial commit: repo scaffolded with `.gitignore`.
- Added FastAPI URL shortener app (`app/`): SQLAlchemy models backed by SQLite,
  `POST /shorten` to create short links, `GET /{code}` to redirect, and
  `GET /api/urls/{code}` for stats.
- Added Docker dev stack: `Dockerfile` for the app, `docker-compose.yml`
  running the app alongside an nginx reverse proxy (`nginx/dev.conf`) on
  `localhost:8080`.
- Opened PR #1 (`feature/fastapi-docker-dev-proxy`) with the above.
- Exposed the `proxy` service publicly at https://swurl.dev.lilnas.io via the
  shared `lilnas-proxy` Traefik network (no `forward-auth` gating — public by
  request). Updated `BASE_URL` so generated short links use the public domain.
- Added usage tracking: `GET /api/stats` (aggregate total links + total
  visits) and a Prometheus-format `GET /metrics` endpoint via
  `prometheus-fastapi-instrumentator`.
- Added a landing page at `GET /` (`app/templates/index.html`,
  `app/static/style.css`, `app/static/app.js`): a live counter polling
  `/api/stats`, and a canvas background animation of randomly generated
  URL-like strings swirling around the center, orbiting on their own at idle
  and gaining extra rotational speed in response to page scroll.
- Added a shorten form to the landing page: paste a URL, submit, and the
  resulting short link is shown in a read-only field (click to select/copy).
- Made the URL input and result fields less transparent for readability, and
  added a "Copy" button below the shortener that writes the result to the
  clipboard (with a fallback for browsers without Clipboard API access).
- Background animation now spells realistic `swurl.dev.lilnas.io/<code>`
  strings (matching the real 7-character short code format) instead of
  randomly generated fake domains.
- Added a second accent color (`--accent-status`, a soft blue) for the usage
  counters, visually separating "status" (the stats) from "action" (the
  shorten/copy buttons, which keep the original teal). Introduced CSS
  variables (`--accent`, `--accent-hover`, `--accent-status`) for these.
- Added visual feedback: the result field flashes with a teal glow on a
  successful shorten, and a stat counter pulses/scales briefly whenever its
  value changes (not on every poll — only on an actual change).
- Merged PR #1 (`feature/fastapi-docker-dev-proxy`) into `master`.
