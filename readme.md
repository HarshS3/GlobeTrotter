## GlobeTrotter Backend (Modular Monolith)

Production-ready Node.js backend scaffold: Express, PostgreSQL, Redis, JWT auth with rotating refresh tokens, MFA (TOTP), rate limiting, caching, structured logging, and test setup.

### Architecture Overview
Layers / modules:
- core: config loader, logger (Winston + daily rotate), error (ApiError)
- config: db (pg Pool), redis lazy client, SQL migrations
- middleware: requestId, requestLogger, auth, mfa enforcement, rateLimiter, validate (Joi), errorHandler
- models: users, tokenStore (refresh chain), apiKeys
- utils: auth token issuance/rotation
- cache: generic wrapper + userCache domain helpers (profile + MFA temp secrets)
- controllers & routes: auth, user
- tests: unit + integration (Vitest + Supertest)

### Auth & Token Flow (Rotating Refresh Tokens)
Text diagram:
1. Login / Register -> Issue (Access15m, Refresh7d[H]) store hash in DB
2. Access expires -> Client sends /auth/refresh with RefreshPlain
3. Server:
	 - Hash incoming token -> find row
	 - If revoked OR already rotated (has parent hash) -> revoke full chain (parent) -> 401
	 - Else: create new row with parent=oldHash; mark old row implicitly by parent relation
	 - Return new (Access, RefreshPlainNew)
4. Logout -> revoke current refresh hash

MFA states in access token payload:
{ userId, email, isMfaActive, mfaVerified }

MFA enabling flow:
setup -> get temporary secret (cache) + QR -> verify -> persist secret -> issue new access with mfaVerified true.

### Database Schema (Simplified)
See `src/config/migrations/001_init.sql` (users, token_store, api_keys).

### Rate Limiting
Fixed window: Redis INCR + EX. Degrades gracefully if Redis down (no 429).

### Caching Strategy
Best-effort Redis. JSON serialization. userCache functions: getOrLoadUserProfile, invalidateUserProfile, store/consume MFA secret.

### Security Highlights
- HttpOnly, SameSite=strict cookies; Secure flag in production
- Hash (SHA-256) refresh tokens & API keys
- No secret logging (logger never logs token values)
- Input validation via Joi everywhere
- Role & MFA enforcement middlewares
- Helmet baseline headers (placeholder for future CSP)

### File / Folder Structure
```
src/
	core/ (apiError.js, config.js, logger.js, constants.js)
	config/ (db.js, redis.js, migrations/, scripts/migrate.js)
	middleware/ (requestId, requestLogger, validate, auth, rateLimiter, errorHandler)
	models/ (users.js, tokenStore.js, apiKeys.js)
	utils/ (authTokens.js)
	cache/ (index.js, userCache.js)
	controllers/ (authController.js, userController.js)
	routes/ (authRoutes.js, userRoutes.js)
	tests/ (setupTest.js, unit/*, integration/*)
Dockerfile, docker-compose.yml, .env.example, .env.test, .env.docker.example
```

### Environment Variables
Documented in `.env.example`:
`PORT, DATABASE_URL / PG*, REDIS_HOST, REDIS_PORT, JWT_SECRET, ACCESS_TOKEN_TTL_MIN, REFRESH_TOKEN_TTL_DAYS, LOG_LEVEL, CACHE_NAMESPACE, RATE_LIMIT_LOGIN, RATE_LIMIT_WINDOW`

### Running Locally (Without Docker)
Prereqs: Node 20+, PostgreSQL, Redis running locally.
1. Copy env: `cp .env.example .env` (Windows: `copy .env.example .env`)
2. Create DB: `createdb globetrotter` (or manual)
3. Install deps: `npm install`
4. Run migrations: `npm run migrate`
5. Start dev: `npm run dev`

Example requests (after server starts on :3000):
```
POST /auth/register { email, password }
POST /auth/login { email, password }
GET  /auth/status
POST /auth/refresh
```

### Running with Docker Compose
```
docker compose build
docker compose up -d
```
Backend: http://localhost:3000/health

### Testing
```
npm test            # run all
npm run test:watch  # watch
```
Global setup runs migrations & truncates tables pre each test.

### Assumptions
- Simple direct SQL migrations (no version table) – idempotency assumed for single run environment.
-- User roles removed (simplified user model); future permissions could be added later.
- No soft-delete for users; physical delete accepted for MVP.
- Token reuse detection revokes entire chain via parent hash.
- API key scope storage as text/JSON left flexible (not fully enforced yet).

### Next Step Suggestions
1. OpenAPI / Swagger generation + typed client
2. Add metrics (Prometheus) & tracing (OpenTelemetry)
3. Secrets management (Vault / KMS) + rotation policies
4. Add session listing & revoke others endpoint
5. Expand rate limiting (user-based, dynamic buckets)
6. Add E2E test container orchestration + CI pipeline
7. Implement API key auth middleware & scope enforcement
8. Add feature flags & config validation schema
9. Implement CSP, HSTS, additional security headers
10. Multi-region deployment readiness (Redis cluster, read replicas)

### License
MIT

### Extended Travel Planning Endpoints
All endpoints require auth + MFA (if enabled) except where noted.

Trips:
- POST /trips { name, start_date, end_date, start_location, end_location, description?, cover_photo_url? }
- GET /trips (list user trips)
- GET /trips/:tripId (trip with stops)
- PUT /trips/:tripId (partial update, can include is_public, start_location?, end_location?)
- DELETE /trips/:tripId
- GET /trips/:tripId/budget (aggregated activities cost)

Stops:
- POST /trips/:tripId/stops { position, city, country?, start_date, end_date }
- PUT /trips/stops/:stopId
- DELETE /trips/stops/:stopId

Activities Catalog:
- POST /trips/activities { title, category?, base_cost?, duration_minutes?, metadata? }
- GET /trips/activities?category=Cat

Stop Activity Assignments:
- POST /trips/stops/:stopId/activities { activity_id, day_offset?, start_time?, cost_override?, notes? }
- GET /trips/stops/:stopId/activities
- DELETE /trips/activities/assignments/:assignmentId


