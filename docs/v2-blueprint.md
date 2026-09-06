# Divar v2 — Full Rewrite Blueprint (Portfolio Grade)

> Goal: Fullstack portfolio. Full rewrite. TypeScript + Express, keep server-rendered EJS.
> Priorities: Tests+docs, Docker+CI/deploy, Auth & security, fa/en i18n.

## 1. Why rewrite vs refactor

Current `src/routes -> controllers (?render=true) -> services -> models` couples JSON API + EJS,
has no validation, no authZ, snapshot `publishedBy: Object`, regex injection, broken
`authorization`/`addUserToReq` (`src/middlewares/auth.middleware.js:7-36`), leaky user routes
(`src/routes/user.route.js`). Incremental fix leaves the `?render` coupling in place.
Rewrite keeps domain ideas (OTP, Category tree + Options, Ad + bookmarks/notes) with clean seams.

## 2. Target stack (locked)

- **Runtime:** Node 20 LTS, TypeScript strict, Express 4.19+ (keep EJS familiarity, easiest hiring signal)
- **DB:** MongoDB 7 + Mongoose 8, `zod` for DTO validation
- **Views:** EJS (existing `src/views/*` ported), `connect-flash` + `express-session`, no `?render` hack
- **Security:** `helmet`, `cors`, `express-rate-limit`, `cookie-parser`, `escape-string-regexp`
- **Quality:** ESLint + Prettier + Husky, Vitest + Supertest, Pino, Swagger (`swagger-jsdoc`)
- **Ship:** Dockerfile + `docker-compose.yml` (app+mongo), GitHub Actions CI, Render/Fly + Atlas demo

Alternative considered: Fastify — rejected for v2 to reuse Express knowledge + EJS partials.

## 3. Target folder structure

```
divar-project/
  src/
    server.ts              # listen only
    app.ts                 # createExpressApp() — testable, no listen
    config/
      env.ts               # zod-validated process.env (PORT, MONGODB_URL, JWT_*)
      db.ts                # mongoose.connect + retry + graceful shutdown
      logger.ts            # pino
      swagger.ts           # OpenAPI def, securityScheme bearer + cookie
    common/
      middlewares/
        auth.ts            # requireAuth, optionalAuth (fixed, no hang/double-send)
        validate.ts        # zod wrapper for body/query/params
        errorHandler.ts    # ApiError -> JSON for /api/*, render error.ejs for views
        rateLimit.ts       # otpLimiter, authLimiter
        notFound.ts
      errors/
        ApiError.ts        # statusCode, message, details
      utils/
        pagination.ts      # page/limit/sort parser with caps
        regex.ts           # escapeRegExp helper
        slug.ts            # slugify wrapper (replaces translatte)
    modules/
      auth/
        auth.routes.ts     # /api/v1/auth + /auth (views) split
        auth.controller.ts # api* vs view* handlers, no branching
        auth.service.ts    # sendOTP/checkOTP/refresh/logout + SmsProvider interface
        auth.schema.ts     # sendOtpSchema, checkOtpSchema
        auth.types.ts
      users/
        user.model.ts      # mobile unique, otp{code,expiresIn,attempts}, bookmarks, notes
        user.routes.ts
        user.controller.ts user.service.ts user.schema.ts
      categories/
        category.model.ts  # no autoPopulate, explicit .populate only where needed
        category.*         # admin-only write
      options/
        option.model.ts option.*  # admin-only write
      ads/
        ad.model.ts        # publishedBy: ObjectId ref User, options: Record<string,unknown>
        ad.routes.ts       # /api/v1/ads + /ads views
        ad.controller.ts ad.service.ts ad.schema.ts (create/list/detail/bookmark/note)
      uploads/
        multer.ts          # uuid names, mime+ext whitelist, 3MB, public/uploads only
    views/
      layouts/website.ejs layouts/panel.ejs layouts/auth.ejs layouts/error.ejs
      partials/...         # ported from src/views/partials/*
      pages/...            # home, ad-detail, login, dashboard, create-ad, my-ads, bookmarks, notes
    public/                # as-is, minus vendored apexcharts if unused
  tests/
    setup.ts               # mongodb-memory-server
    auth.test.ts ads.test.ts authz.test.ts
  docs/
    v2-blueprint.md (this) v2-issues.md
    adr/001-express-ts-ejs.md adr/002-api-vs-views-split.md
  Dockerfile docker-compose.yml .github/workflows/ci.yml
  .env.example .eslintrc .prettierrc vitest.config.ts
```

Key rule: **controllers are thin, services own logic, schemas own validation.**
`api/*` returns JSON always. `view*` returns `res.render` always. No `req.query.render`.

## 4. API design (v1)

```
POST /api/v1/auth/otp/send {mobile} -> {message, retryAfter}
POST /api/v1/auth/otp/verify {mobile, code} -> sets httpOnly cookie + {accessToken, user}
POST /api/v1/auth/refresh -> rotates refresh token
POST /api/v1/auth/logout -> clearCookie

GET  /api/v1/ads?search=&city=&category=&page=&limit=&sort=
GET  /api/v1/ads/:id
POST /api/v1/ads (auth, multipart images[10])
DELETE /api/v1/ads/:id (auth + ownerOnly)
GET  /api/v1/ads/mine (auth)
POST /api/v1/ads/:id/bookmark DELETE .../bookmark GET /api/v1/me/bookmarks
POST /api/v1/ads/:id/notes {content} DELETE .../notes GET /api/v1/me/notes

GET  /api/v1/categories (+ ?tree=true)
POST /api/v1/categories (admin)  DELETE /api/v1/categories/:id (admin)
... same for /api/v1/options, /api/v1/options?categoryId= /by-slug/:slug

GET /health  GET /swagger
Views: GET / GET /a/:id GET /auth/login GET /panel GET /panel/ads/new ...
```

Auth for views: `httpOnly SameSite=Lax` cookie. For API clients: `Authorization: Bearer`.

## 5. Data model fixes (old -> new)

| Old (`src/models/*`) | Problem | New |
|---|---|---|
| `Ad.publishedBy: Object` | stale snapshot, `{"publishedBy._id":id}` fragile (`ad.service.js:76`) | `publishedBy: {type:ObjectId, ref:User, required:true, index:true}` + `populate("publishedBy","mobile")` |
| `Ad.options: Object` + `getOptionsFromBody` pushes `body[title]` values (`ad.service.js:32-52`) | loses keys, breaks render | `options: {type:Map, of:Schema.Types.Mixed, default:{}}` keyed by `option.key`, validated against category options |
| `User.notes.for unique:true` | global unique blocks 2 users noting same ad | compound `unique {user, for}` via subdoc — enforce one note per (user,ad) in service |
| `Category pre(find,findOne) autoPopulate children` (`category.model.js:21`) | N+1 / recursion | remove hook, explicit `?tree=true` aggregation or 2-query build |
| No indexes | `new RegExp(search)` full scan (`ad.service.js:58`) | `Ad.title text + description text`, `city:1, category:1, createdAt:-1` |
| `price` uncoerced, `address/details` mismatch | form `name=details` never saved | Zod coerce + rename EJS field to `address` |

## 6. Auth flow (new)

1. `sendOTP`: validate IR mobile (`/^09\d{9}$/`), rate-limit 5/hr/IP + 1/2min/mobile, `code=String(randomInt(10000,99999))`, `expiresIn=Date.now()+120_000`, `attempts=0`, persist. Dev: log via Pino + return `previewCode` only when `NODE_ENV!=production`. Prod: `SmsProvider.send()` interface (mock now).
2. `verify`: fetch user, check expiry 401, `attempts>=5` -> 429 + invalidate, `timingSafeEqual(code)`, set `verifiedMobile=true`, clear otp, issue `access(15m)+refresh(7d, hashed in DB)`, `res.cookie(access_token, ..., {httpOnly:true, sameSite:lax, secure:prod})`.
3. `requireAuth`: verify cookie *or* Bearer, `User.findById`, attach `req.user`, `401 JSON` for `/api/*` else `redirect(/auth/login)` + `return` (fixes double-send). `optionalAuth`: `try{}catch{next()}` — always `next()` (fixes hang).
4. `logout`: `clearCookie` in both modes (fixes `auth.middleware` render path).

## 7. Cross-cutting

- **Validation:** every route uses `validate(schema)` — body/query/params. Fixes `new Types.ObjectId(bad)` CastError, OTP number-vs-string `!==`, price strings.
- **Errors:** `throw new ApiError(404,...)` in services; handler maps to `{statusCode,error:{message,details}}` or `error.ejs`.
- **Uploads:** `multer.diskStorage public/uploads`, `uuidv4+ext`, `fileFilter` checks ext *and* mimetype, `limits 3MB`, delete files on ad delete, no `express.static` double-mount.
- **i18n:** keep `jalali-moment` + RTL, add `src/config/i18n.ts` dict `fa/en`, `?lang=` persisted in cookie, EJS `t()` helper. Default `fa`, README English-first.
- **Seed:** `scripts/seed.ts` replaces raw `mongoimport` — imports `divar-store.categories.json`, generates slugs locally (drop `translatte` dep).
- **Hygiene:** `git rm --cached .env Temp.js`, rotate `JWT_PRIVATE_KEY/COOKIE_PRIVATE_KEY`, `.env.example`, `.gitignore` += `.env node_modules dist coverage`.

## 8. Definition of Done for v2

`npm run build+test+lint` green, `docker compose up` runs demo seeded, `/health` + `/swagger` live,
5 core flows manual-tested (OTP login, create ad with images, search/filter, bookmark, note),
README has badges + demo link + screenshots.
