# Divar v2 — First 5 Implementation Issues

> Ordered for a full rewrite. Each is independently reviewable and demoable.
> References are to current code being replaced.

---

## Issue #1 — P0 Foundation: TS + Express app shell, tooling, hygiene

**Why:** `package.json` has only `"start":"nodemon app.js"` (nodemon not in deps), Express 4.16 / debug 2.6 outdated,
`.env` committed, `Temp.js` dead, `app.js:16-20` double `express.static`, no lint/test/CI.
Can't portfolio this.

**Tasks:**
- [ ] `git rm --cached .env Temp.js`; rotate `JWT_PRIVATE_KEY`, `COOKIE_PRIVATE_KEY`, `MONGODB_URL`
- [ ] `.gitignore`: `.env`, `node_modules/`, `dist/`, `coverage/`, `public/uploads/*`
- [ ] Add `.env.example` (PORT, MONGODB_URL, JWT_PRIVATE_KEY, JWT_REFRESH_KEY, COOKIE_PRIVATE_KEY, NODE_ENV, SMS_PROVIDER=mock)
- [ ] Init TS: `typescript, tsx, @types/*`, `tsconfig.json` strict, `vitest.config.ts`
- [ ] `src/app.ts` (`createExpressApp()` — helmet, cors, json, urlencoded, cookieParser, static once, pino) + `src/server.ts` (listen only) + `src/config/env.ts` (zod) + `src/config/db.ts` (connect+retry+SIGTERM) + `GET /health`
- [ ] ESLint + Prettier + Husky pre-commit, `scripts`: `dev, build, start, lint, format, test`
- [ ] Upgrade `express@~4.19`, `mongoose@8`, remove `translatte, utf8, ejs-lint` (unused/broken)

**Acceptance criteria:**
- [ ] `npm run dev` boots with only `.env.example` copied; missing var fails fast with zod message
- [ ] `npm run build && npm start` serves `/health` -> `{status:"ok"}`
- [ ] `npm run lint && npm test` (even with 1 smoke test) green
- [ ] `git log` shows `.env` removal; no secrets in history of new branch

---

## Issue #2 — Auth hardening (OTP + sessions)

**Why:** OTP `10000-99999` with 2-min window, no rate-limit/attempt cap (`src/services/auth.service.js`),
`authorization` double-sends after redirect (`src/middlewares/auth.middleware.js:21-22`),
`addUserToReq` hangs on error (`:26-36`), `logout(render)` never clears cookie, 1-week JWT no refresh.

**Tasks:**
- [ ] `modules/auth/auth.schema.ts`: `mobile=/^09\d{9}$/`, `code=/^\d{5}$/` (coerce number->string)
- [ ] `modules/auth/auth.service.ts`: `sendOTP` (upsert, `attempts=0`, resend cooldown 2min), `verifyOTP` (`timingSafeEqual`, max 5 attempts -> invalidate + 429), `SmsProvider` interface + `MockSmsProvider` (Pino log, `previewCode` only non-prod)
- [ ] Tokens: `access 15m` + `refresh 7d (sha256 in User.refreshTokens[])`, `POST /api/v1/auth/refresh` rotation, `POST /api/v1/auth/logout` always `clearCookie`
- [ ] `common/middlewares/auth.ts`: `requireAuth` (cookie *or* Bearer, 401 JSON for `/api/*` else redirect + `return`), `optionalAuth` (always `next()`), `requireAdmin` stub (for #3)
- [ ] Rate limits: `otpLimiter (5/hr/IP)`, `verifyLimiter (10/10min/IP)`
- [ ] Split `auth.routes.ts`: `/api/v1/auth/*` JSON + `/auth/*` EJS views (`login.ejs`)

**Acceptance criteria:**
- [ ] 6th wrong code -> 429, old code invalidated after success/expiry
- [ ] Resend within 2min -> 429 with `retryAfter`
- [ ] `curl /api/v1/ads/mine` without token -> 401 JSON; `GET /panel` without cookie -> 302 `/auth/login` (no `ERR_HTTP_HEADERS_SENT`)
- [ ] Logout clears `access_token` in both API and view flows
- [ ] Tests: `tests/auth.test.ts` covers send/verify/expiry/brute-force/logout

---

## Issue #3 — Domain + data fix: Category / Option / Ad (+ validation)

**Why:** `Ad.publishedBy: Object` (`src/models/ad.model.js:17`), `getMyAds` queries `publishedBy._id` string (`src/services/ad.service.js:75-78`),
`getOptionsFromBody` drops keys (`:32-52`), `address` form uses `name=details` so never saved,
`Category autoPopulate children` N+1 (`src/models/category.model.js:17-21`), no indexes, `deleteAdById` checks truthy `deleteOne` (`ad.service.js:87-92`), `Option.removeOption` uses `findOneAndDelete(id)` (never deletes).

**Tasks:**
- [ ] Models: `Ad.publishedBy: ObjectId ref User + index`, `Ad.options: Map<Mixed>`, text index `title+description`, `city:1 category:1 createdAt:-1`; `Note.for` compound unique per-user (remove global `unique:true` in `user.model.js:39`); Category remove pre-hook
- [ ] Schemas (zod): `createAd` (title/desc/category:ObjectId/province/city/price coerce/options record), `listAds` query (page/limit cap 50, sort enum, escape search), `bookmark/note` params
- [ ] Services: `createAd(ownerId)`, `listAds` (escaped regex + category subtree via `parents` + pagination), `deleteAdById(id, ownerId)` (owner check + `deletedCount===0` -> 404 + unlink images), `bookmark/unbookmark/note` idempotent, fix option key mapping by `option.key`
- [ ] Routes: `POST/DELETE /api/v1/categories|options` behind `requireAuth+requireAdmin`; `DELETE /api/v1/ads/:id` behind `requireAuth+owner`
- [ ] `scripts/seed.ts`: import `divar-store.categories.json`, local slugify (drop `translatte`)

**Acceptance criteria:**
- [ ] Non-owner `DELETE /api/v1/ads/:id` -> 403; bad `category` id -> 400 (not CastError 500)
- [ ] `GET /api/v1/ads?search=.*&page=999&limit=500` safe: escaped, limit clamped to 50, paginated `{data, page, total}`
- [ ] Create ad with required category option missing -> 400 naming the option; `options` stored as `{key:value}`
- [ ] Two users can note same ad; one user can't double-note (upsert)
- [ ] Tests: `ads.test.ts + authz.test.ts` green

---

## Issue #4 — API vs Views split + EJS port + uploads fix

**Why:** Every controller branches on `?render=true` (`src/controllers/ad.controller.js`), global `let message=null` race,
`GET /` forced via `addQueryParam` (`src/routes/index.route.js:11`), `multer` ext-only check + timestamp collisions + no cleanup (`src/utils/multer.util.js`), error handler always JSON (breaks pages).

**Tasks:**
- [ ] Delete `addQueryParam.util.js`, `?render` branches; create `ad.controller.ts` with `api*` (JSON) + `view*` (`res.render`) handlers; `views/layouts/*.ejs` + `connect-flash` for messages
- [ ] Port pages: `home, ad-detail (swiper), login, dashboard, create-ad (fix input name details->address), my-ads, bookmarks, notes`; add `error.ejs`; `t()` helper + `?lang=` cookie (`fa` default, keep `jalali-moment`)
- [ ] `modules/uploads/multer.ts`: `uuidv4` filenames, ext+mimetype whitelist, 3MB, single `express.static(public)`, delete files on ad delete
- [ ] `errorHandler.ts`: `/api/*` -> JSON `{statusCode,error}`, else `res.status().render("error")`; `notFound.ts` same split

**Acceptance criteria:**
- [ ] `GET /` + `GET /panel` render without query params; form validation errors re-render with flash (no JSON leak)
- [ ] Upload `.exe` renamed to `.jpg` rejected; 4MB rejected; ad delete removes its files from `public/uploads`
- [ ] API error `GET /api/v1/ads/bad-id` -> JSON 400; view error `GET /a/bad-id` -> rendered error page 404
- [ ] Manual: login -> create ad with 2 images -> search/filter -> bookmark -> note all work in browser

---

## Issue #5 — Quality bar: tests, Swagger, Docker/CI, portfolio README

**Why:** No tests/lint/CI/Docker/healthcheck/logger; Swagger has only 200s, no auth scheme (`src/swagger/*`);
README has no demo/badges/architecture — weak portfolio signal.

**Tasks:**
- [ ] Tests: `tests/setup.ts` (mongodb-memory-server), extend `auth/ads/authz` to >=70% service coverage; `npm test` in CI
- [ ] Swagger: consolidate to `src/config/swagger.ts`, `securitySchemes: bearer + cookie`, document 400/401/403/404 + examples for all `/api/v1/*`
- [ ] `Dockerfile` (multi-stage build+run) + `docker-compose.yml` (app+mongo+seed) + GH Actions `.github/workflows/ci.yml` (lint+test+build+docker)
- [ ] Pino request logging, remove `console.log`, add `/swagger` + `/health` to compose healthcheck
- [ ] README rewrite: badges, 30-sec GIF/screenshots, `Clone -> cp .env.example -> docker compose up --seed -> open :3000`, architecture diagram (API vs views), API table, i18n note, roadmap

**Acceptance criteria:**
- [ ] `docker compose up --build` boots seeded demo; `/health` + `/swagger` reachable
- [ ] CI green on PR (lint, test, build); Swagger UI `Authorize` works with Bearer
- [ ] README lets a recruiter run demo in <5min and see auth/search/bookmark flows
- [ ] Release tag `v2.0.0` + live URL (Render/Fly + Atlas) linked in README + repo About

---

**Suggested branch order:** `v2/foundation` (#1) -> `v2/auth` (#2) -> `v2/domain` (#3) -> `v2/views-uploads` (#4) -> `v2/ship` (#5).
