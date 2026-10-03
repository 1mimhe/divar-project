# Divar (Node.js + TypeScript)

[![CI](https://github.com/1mimhe/divar-project/actions/workflows/ci.yml/badge.svg)](https://github.com/1mimhe/divar-project/actions/workflows/ci.yml)
![Node >= 22.6](https://img.shields.io/badge/node-%3E%3D22.6-brightgreen)
![License ISC](https://img.shields.io/badge/license-ISC-blue)

<div align="center">
    <img src="./public/assets/images/logos/DivarLogo.png" alt="Divar Project" style="width: 300px;"/>
</div>

Ads website cloned from [Divar.ir](https://divar.ir/). JSON API plus Persian (RTL, Jalali dates) pages using the same services.

## Requirements

- Node.js >= 22.6, npm, Docker (for the container path)

## Setup (containers)

```sh
git clone https://github.com/1mimhe/divar-project
cd divar-project
cp .env.example .env   # fill the four *-SECRET values (min 32 chars each)
docker compose up --build -d
docker compose exec app node --experimental-strip-types scripts/seed.ts
open http://localhost:3000
```

## Setup (local)

```sh
npm install
cp .env.example .env   # fill secrets; need MongoDB on 27018 (`docker compose up mongo -d`) or point MONGODB_URL at your own
npm run seed           # categories (+ promotes ADMIN_MOBILE when set)
npm run dev            # http://localhost:3000
```

Demo login: use any `09xxxxxxxxx` number. There is no real SMS; outside
production the code is shown on the verify page. Set `ADMIN_MOBILE` in `.env`
before seeding to mark your user as admin. Category/option writes need admin.

## Features

Simple implementation, good enough for local demo:

- OTP login: 5-digit code, 2-minute expiry, 5 tries per code, resend waits for expiry. IP limits: 5 sends/hour, 10 verifies/10 min. No real SMS gateway.
- Sessions: 15-minute access token + 7-day refresh token with rotation. Sent as `httpOnly` cookie or `Authorization: Bearer`. No device list.
- Categories: simple tree (parent ref). Options: typed fields (string/number/boolean/array + enum) per leaf category. Writes are admin-only (`isAdmin` flag).
- Ads: create with images, list/detail/delete, `GET /ads/mine`. Search is plain contains-match on title/description (not full-text). Filters: city, category subtree. Paging with limit max 50. Sort: newest/cheapest/expensive. Options are checked against the category definition.
- Uploads: saved to local `public/uploads`, jpg/jpeg/png/webp only, 3 MB per file, random names. Files are deleted with the ad. No thumbnails or resizing.
- Bookmarks: save/unsave. Notes: one private note per user per ad.
- Pages: plain EJS, Persian only. Home list, ad detail, login/verify, panel (publish, my ads, bookmarks, notes). Forms show `422` with input kept.
- Docs: basic OpenAPI at `/swagger`, health at `/health`.

## Structure

- `src/modules/<feature>/`: `schema → model → service → controller → routes`
- `src/common/`: error shape `{ statusCode, error }`, zod validation, pagination
- `src/web/`: EJS pages using the same services as the API
- Tests in `tests/`: unit runs offline; e2e needs MongoDB and skips without it.

## Scripts

| Script              | What it does                                  |
| ------------------- | --------------------------------------------- |
| `npm test`          | Unit (no DB) then e2e (needs MongoDB)         |
| `npm run test:unit` | Offline unit tests only                       |
| `npm run test:e2e`  | DB-backed flows, skips cleanly without Mongo  |
| `npm run seed`      | Seed categories/options/ads + admin promotion |
| `npm run dev`       | Watch-mode server                             |
| `npm start`         | Production server (`NODE_ENV=production`)     |

## API

Base path `/api/v1`. Full shapes in `/swagger`.

| Area       | Endpoints                                                                                                                          |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Auth       | `POST /auth/otp/send`, `POST /auth/otp/verify`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`                          |
| Users      | `GET /users`, `GET /users/:id` (admin)                                                                                             |
| Categories | `GET /categories[?tree=true]`, `POST /categories`, `DELETE /categories/:id` (writes: admin)                                        |
| Options    | CRUD + `GET /options/by-category/:id`, `GET /options/by-category-slug/:slug` (writes: admin)                                       |
| Ads        | `GET /ads?search=&city=&category=&page=&limit=&sort=`, `POST /ads` (multipart), `GET /ads/mine`, `GET /ads/:id`, `DELETE /ads/:id` |
| Social     | `POST / DELETE /ads/:id/bookmark`, `GET /me/bookmarks`, `POST / GET / DELETE /ads/:id/note`, `GET /me/notes`              |

## Pages

| Page                 | Route                                                           |
| -------------------- | --------------------------------------------------------------- |
| Home list + filters  | `GET /`                                                         |
| Ad detail + note     | `GET /a/:id`                                                    |
| Login / verify       | `GET /auth/login`, `POST /auth/otp/*`                           |
| Panel, publish, mine | `GET /panel`, `/panel/ads/new`, `POST /panel/ads`, `/panel/ads` |
| Panel saved          | `GET /panel/bookmarks`, `GET /panel/notes`                      |
