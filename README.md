# GlobeTrotter (Full Stack)

Backend: Express, PostgreSQL, Redis, JWT rotating refresh, MFA, Cloudinary, metrics.
Frontend: Vite + React + TS.
Observability: Prometheus, Grafana, Loki, Promtail.

## Quick Start (Local without Docker)
1. Backend
```
cd Backend
copy .env.example .env   # Windows
npm install
npm run migrate
npm run seed:adv  # optional advanced data
npm run dev
```
2. Frontend
```
cd Frontend
copy .env.example .env
npm install
npm run dev
```
Visit: http://localhost:5173

## Docker (All Services + Monitoring)
```
docker compose build
docker compose up -d
```
Services:
- App Backend: http://localhost:3000
- Frontend: http://localhost:5173
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin / admin)
- Loki API: http://localhost:3100

Seed (inside backend container):
```
docker compose exec backend node src/scripts/seedAdvanced.js
```

## Metrics
Scrape endpoint: `GET /metrics` on backend (gt_ prefixed default + custom).
Custom metrics:
- `gt_http_request_duration_ms` (Histogram)
- `gt_auth_failures_total` (Counter)

PromQL examples:
```
rate(gt_http_request_duration_ms_count[5m])
histogram_quantile(0.95, sum(rate(gt_http_request_duration_ms_bucket[5m])) by (le))
```

## Logs
Backend file logs: mounted volume `backend_logs` consumed by Promtail -> Loki.
Console JSON logs in production mode also capturable if desired.

## Public Trips Endpoint
`GET /public/trips` returns last 100 public trips (id, name, description, dates, locations, image fields).

## Password Reset Flow (Dev)
1. POST /auth/forgot-password { email }
2. Receive `dev.token` in response (non-prod only)
3. POST /auth/reset-password { token, password }

## Environment Notes
Compose sets `FRONTEND_ORIGIN` so backend CORS allows frontend. Adjust for production with actual domain + enable Secure cookies.

## Tear Down
```
docker compose down -v
```

