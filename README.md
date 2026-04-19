# OpsMate

OpsMate is a full-stack incident operations app for infrastructure teams. It combines incident visibility, runbook access, and incident-derived analytics in a single Next.js service with built-in API routes and SQLite persistence.

## Screenshots

<table>
  <tr>
    <td><img src="docs/dashboard.png" width="200"></td>
    <td><img src="docs/runbooks.png" width="200"></td>
    <td><img src="docs/metrics.png" width="200"></td>
  </tr>
</table>

## What It Is

OpsMate helps teams:

- track active and resolved incidents
- inspect incident details and operational context
- browse runbooks tied to common failure modes
- view dashboard and metrics pages backed by incident data

## Why It Matters

Operational tools are most useful when they are fast to understand and realistic to run. OpsMate is intentionally built as a practical single-service system that is easy to run locally, easy to deploy, and honest about its current trade-offs.

## Tech Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- shadcn/ui
- Recharts
- Next.js API routes for backend slices
- SQLite via `better-sqlite3`
- Docker and Docker Compose
- Railway for the current deployment model
- GitHub Actions CI

## Architecture

OpsMate currently runs as one full-stack web service.

- frontend UI lives in `apps/web`
- backend endpoints live in `apps/web/app/api`
- incidents and runbooks persist to SQLite
- dashboard and metrics pages derive analytics from persisted incident timestamps
- the public app uses same-origin `/api` requests by default

Repository shape:

```text
.
├── apps/
│   └── web/
│       ├── app/
│       ├── components/
│       ├── lib/
│       ├── Dockerfile
│       └── .env.example
├── docker-compose.yml
├── railway.json
└── .env.example
```

