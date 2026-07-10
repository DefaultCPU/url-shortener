# Scenario & Risk Analysis

This document lays out how swurl is expected to succeed, and the concrete
ways it could fail. It's written for anyone evaluating the project —
technical or not — who wants to see that both sides were considered
deliberately, not just the happy path.

Status quo, in one line: **swurl is a working single-host hobby deployment**,
not a hardened production service. The gaps below are the difference between
the two, and most of them are one focused work session away from being
closed.

## Success scenarios

**Personal / small-team link shortening.** Someone wants a shorter link to
paste in a chat, README, or slide deck. They hit the form, get a link back
immediately, and it works. This is the core use case today and it's fully
solved.

**Lightweight click tracking.** A user wants to know "did anyone actually
click this?" without standing up a full analytics stack. `GET /api/stats`
and per-code visit counts answer that today at the aggregate level.

**Internal tooling / self-hosted alternative to bit.ly.** Someone who
already self-hosts infrastructure (like the lilnas NAS this runs on) wants a
shortener under their own domain instead of trusting a third party with
their link data. This is the actual reason this project uses a home-lab
subdomain rather than a SaaS shortener.

**Embeddable building block.** Because the API is a plain `POST /shorten` +
`GET /{code}` pair with no required auth, it's trivial to script against or
embed in another tool (a bot, a CLI, a CI pipeline that posts build links).

## Failure scenarios

Grouped by kind, roughly ordered by how likely each is to actually bite,
with what would need to happen to close the gap.

### Availability

- **Single point of failure: one NAS, one process.** The entire stack is one
  Docker Compose deployment on one physical machine on a residential
  connection. If the NAS loses power, the disk fails, or the home ISP drops,
  the service — and every link anyone has ever shared — goes down with it.
  There's no failover host and no load balancer in front of more than one
  instance.
  *Mitigation today:* none. *To close:* multi-region deploy, or at minimum a
  cheap cloud standby that can take over DNS if the NAS is unreachable.

- **Residential ISP uptime and dynamic IP.** Home internet doesn't carry an
  uptime SLA, and if the NAS's public IP changes, DNS has to catch up before
  the domain resolves again.
  *Mitigation today:* DNS is fronted by lilnas's existing Traefik/DNS setup,
  which likely has some dynamic-DNS handling, but there's no documented SLA
  or alerting on it.

- **No monitoring or alerting on failure.** `/metrics` exposes Prometheus
  data, but nothing has been configured to page or notify anyone if the app
  goes down. An outage would be discovered by a user reporting a dead link,
  not by the operator.

### Data integrity

- **SQLite as the only datastore, on a single disk, with no backups.**
  Every short link and every visit count lives in one SQLite file. There's
  no replication, no automated backup, and no tested restore path. A
  corrupted file or failed disk means the entire link database — and every
  link anyone has ever shared — is gone, permanently, with no way to
  recover it.
  *This is the single highest-impact gap in the project.* It's also the
  cheapest to close: a nightly file-copy backup off-host would cover the
  common case in under an hour of work.

- **SQLite's write concurrency ceiling.** SQLite serializes writes at the
  file level. At today's traffic this is invisible, but it's the first
  thing that would need to change (e.g. to Postgres) if usage grew from
  "personal tool" to "shared by a real user base."

### Abuse and trust

- **No validation of where links point.** `POST /shorten` accepts any
  syntactically valid URL and creates a redirect for it — including
  phishing pages, malware download links, or anything else. Because the
  redirect lives under a domain the operator controls, abuse of the service
  becomes a reputational and potentially legal problem for the domain
  owner, not just the person who submitted the link. This is the
  best-known failure mode of *every* URL shortener that's ever existed, and
  it's currently fully open here.
  *Mitigation today:* none — no blocklist, no destination scanning, no
  reporting mechanism. *To close:* at minimum, a blocklist check against a
  known-bad-URL feed, and an abuse-report endpoint.

- **No rate limiting or bot protection on `/shorten`.** The endpoint has no
  auth and no throttling, so it can be scripted against at whatever volume
  a client chooses — spam link generation, denial-of-service via database
  growth, or using the service as a free open redirector.
  *To close:* per-IP rate limiting is the standard, low-effort fix here.

- **No link expiration or moderation.** Every link created lives forever
  and there's no admin path to take one down short of direct database
  access. Combined with the two points above, there's currently no way to
  react quickly if the service were used for something harmful.

### Business / legal

- **Domain dependency on a personal subdomain.** Short links are only
  useful if they keep working — that's the entire value proposition. Today
  every link is a permanent bet on `swurl.dev.lilnas.io` staying resolvable
  indefinitely, which is tied to one person's home-lab domain rather than a
  dedicated, owned brand domain. If that domain or infrastructure ever goes
  away, every link created up to that point breaks at once.

- **No terms of service, privacy policy, or content policy.** There's
  nothing published that sets expectations for users about what the service
  logs, retains, or will take down, which matters as soon as this is used
  by anyone beyond the operator.

### Summary: what "investor/production-grade" would require

In rough priority order: automated off-host backups of the database,
per-IP rate limiting on `/shorten`, a destination blocklist plus an abuse
report path, uptime monitoring with alerting, a migration path off SQLite,
and a real owned domain rather than a home-lab subdomain. None of these are
architecturally hard — the FastAPI/SQLAlchemy layer underneath was built to
make each of them a contained, incremental change rather than a rewrite.
