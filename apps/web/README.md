# OpsMate

## Overview

OpsMate is being built as a full-stack platform for incident operations. The current version includes a polished multi-page frontend with dashboards for:

- incident monitoring
- runbook discovery
- system health visibility
- operational metrics
- notification/settings workflows

The project is being extended with backend integration, Dockerized services, and infrastructure tooling.

## Screenshots

### Dashboard
![Dashboard](docs/dashboard.png)

### Runbooks
![Runbooks](docs/runbooks.png)

### Metrics
![Metrics](docs/metrics.png)

## Tech Stack

### Frontend
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Recharts

## Frontend API Configuration

The frontend supports an optional `NEXT_PUBLIC_API_BASE_URL` for backend connectivity.

- If `NEXT_PUBLIC_API_BASE_URL` is set, incidents requests will be sent to `${NEXT_PUBLIC_API_BASE_URL}/api/...`
- If it is unset, the app will use same-origin `/api/...` requests
- If the backend is unavailable, the incidents workflow falls back to demo/mock data so local development stays usable

See `apps/web/.env.example` for a minimal example.

## Local Run Strategy

OpsMate currently runs as a single full-stack Next.js service in local development:

- the frontend UI is served from `apps/web`
- the backend API routes live in `apps/web/app/api`
- incidents and runbooks persist to a local SQLite database file
- there is no separate database service yet because SQLite fits the current single-service architecture cleanly

### Local app service

Run the app directly from the web workspace:

```bash
cd apps/web
npm install
cp .env.example .env.local
npm run dev
```

The app will be available at `http://localhost:3000`.

By default, local development persists data to `apps/web/data/opsmate.db`. You can override that with `SQLITE_DB_PATH`.

### Docker Compose

A simple compose setup is available at the repository root for a production-style local run:

```bash
cp .env.example .env
docker compose up --build
```

This starts the current full-stack web service on `http://localhost:${WEB_PORT:-3000}`.
The compose setup mounts a named volume for the SQLite database so local data survives container restarts.

### Environment variables

- `WEB_PORT`: host port published by Docker Compose
- `NEXT_PUBLIC_API_BASE_URL`: optional external backend origin; leave unset to use same-origin `/api` routes in the local Next.js service
- `SQLITE_DB_PATH`: SQLite database file path used by the full-stack app

If you change `NEXT_PUBLIC_API_BASE_URL` for the compose setup, rebuild the image so the public frontend config is refreshed.

## Continuous Integration

GitHub Actions CI is configured to validate the current app service in `apps/web`.

- installs dependencies with `npm ci`
- runs `npm run lint`
- runs `npm run build`

There is also a disabled test placeholder job in the workflow so an automated test step can be enabled later once the repository adds a real test script.

## Deployment

### Recommended target

For the current architecture, the most practical deployment target is a single Railway service backed by a persistent volume:

- OpsMate is currently one full-stack Next.js service
- API routes run inside the same app as the frontend
- incidents and runbooks persist to SQLite
- Railway can deploy the existing Dockerfile and attach a mounted volume for SQLite without forcing a database migration yet

### Why Railway fits this app

Railway is a better fit than a stateless Next.js host for the current version of OpsMate because the app depends on persistent local storage for SQLite.

This setup should remain intentionally simple:

- one web service
- one attached volume
- one running instance

SQLite is a good match for the project at this stage, but it is not the right datastore for horizontally scaled multi-writer deployments. Keeping Railway on a single instance is the honest deployment shape for the current architecture.

### Railway deployment flow

The repository includes a minimal `railway.json` that points Railway at the existing Dockerfile and configures a healthcheck.

1. Create a new Railway project and connect this repository
2. Ensure Railway builds from the repository root
3. Attach a volume to the web service and mount it at `/data`
4. Set the service variable:

```bash
SQLITE_DB_PATH=/data/opsmate.db
```

5. Leave `NEXT_PUBLIC_API_BASE_URL` unset unless you intentionally move the API to another origin
6. Deploy the service

### Deployment notes

- The Railway volume should be mounted at `/data`
- The app should store SQLite data at `/data/opsmate.db`
- `NEXT_PUBLIC_API_BASE_URL` should usually stay unset so the frontend continues using same-origin `/api` routes
- Health checks use `GET /api/health`
- Railway volumes are mounted at runtime, so SQLite data must live on the mounted path, not be created during image build

If you later outgrow the single-instance SQLite model, the next honest step would be moving persistence to a managed database rather than trying to scale the current SQLite deployment pattern.

### Planned backend / infrastructure
- NestJS or Node backend
- FastAPI microservice for AI-assisted classification/recommendations
- Oracle DB
- Docker
- GitHub Actions
- Terraform
- Cloud deployment
