# URL Shortener

A minimal URL shortener built with FastAPI, SQLAlchemy, and SQLite.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run

```bash
uvicorn app.main:app --reload
```

The API will be available at http://localhost:8000, with interactive docs at http://localhost:8000/docs.

## Run with Docker

A dev stack is provided with Docker Compose: the FastAPI app plus an nginx reverse proxy in front of it.

```bash
docker compose up --build
```

The app is served through the proxy at http://localhost:8080. The proxy forwards all requests to the app container, so `BASE_URL` in the app is set to `http://localhost:8080` to keep generated short URLs consistent with what you hit in the browser.

Source changes under `app/` are mounted into the container and `--reload` is enabled, so edits take effect without rebuilding.

## Usage

Shorten a URL:

```bash
curl -X POST http://localhost:8080/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

Visit the returned `short_url` to be redirected to the original URL.

## Usage tracking

- `GET /api/stats` — aggregate counts: total links created and total redirect
  visits across all links.
- `GET /metrics` — Prometheus-format metrics (request counts, latencies,
  status codes per endpoint), via `prometheus-fastapi-instrumentator`.

## Public dev URL

This project is exposed on the NAS at **https://swurl.dev.lilnas.io** via the shared `lilnas-proxy` Traefik network (see `docker-compose.yml`'s `proxy` service labels). The route is public with no authentication — anyone with the link can use it. Bring it up with:

```bash
docker compose up -d
```

Traefik picks up the route automatically within seconds. Tear it down with `docker compose down`, which removes the route just as quickly.
