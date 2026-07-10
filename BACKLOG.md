# Backlog

Ideas and planned work not yet implemented.

## Usage tracking / request metrics

**Status:** Not started

Track how many requests the service is handling to get visibility into usage.

- Per-link visit counts already exist (`URL.visits` in `app/models.py`,
  incremented on each redirect) but there's no aggregate view across all
  links, and no visibility into traffic to non-redirect endpoints
  (`/shorten`, `/api/urls/{code}`).
- Options to consider:
  - Add a `GET /api/stats` endpoint summarizing total links, total visits,
    and requests per time window.
  - Expose a Prometheus-compatible `/metrics` endpoint (lilnas already runs
    Prometheus/Grafana) so usage shows up alongside other services'
    dashboards instead of requiring a bespoke UI.
  - Simple request-count middleware as a stopgap if full metrics are overkill.
