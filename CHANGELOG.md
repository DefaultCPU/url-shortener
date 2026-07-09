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
