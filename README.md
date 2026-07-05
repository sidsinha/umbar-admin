# Umbar Ops Admin

Password-protected operations console for the Umbar team — dashboard stats and lists for instructors, classes, students, and marketplace inquiries.

This repo is the **admin UI only** — a static Next.js app (same layout as [`umbar-blog-admin`](../umbar-blog-admin)) that talks to the Umbar API from the browser. Auth and data live in [`umbar-app`](../umbar-app) (`apps/api`).

## What this repo does

- **Dashboard home** — platform stats at `/`
- **Internal list pages** — instructors, classes, students, inquiries
- **Team login** — shared password auth; JWT stored in the browser
- **Static deploy** — builds to `out/` (FileZilla / any static host)

No Firebase.

## How it fits in

| App | Role |
| --- | --- |
| `umbar-app` API | Supabase + public/admin endpoints (blog + ops) |
| `umbar-blog-admin` | Blog CMS UI |
| **`umbar-admin`** (this repo) | Ops admin UI |

Ops admin routes on the API:

- `GET /admin/ops/stats`
- `GET /admin/ops/instructors`, `/admin/ops/classes`, `/admin/ops/students`, `/admin/ops/inquiries`

**Separate login from blog CMS:**

| Admin | Login endpoint | Env password |
| --- | --- | --- |
| Blog CMS (`umbar-blog-admin`) | `POST /admin/auth/login` | `ADMIN_UI_PASSWORD` |
| Ops admin (this repo) | `POST /admin/ops/auth/login` | `ADMIN_OPS_UI_PASSWORD` |

Both use the same `ADMIN_JWT_SECRET`, but JWTs are scoped by role — a blog token cannot access ops routes and vice versa.

## Setup

1. Configure the **Umbar API** (`umbar-app/apps/api/.env`):

- `ADMIN_OPS_UI_PASSWORD` — team password for **this** ops admin UI
- `ADMIN_JWT_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

(`ADMIN_UI_PASSWORD` is only for blog CMS.)

2. Create a local env file for this UI:

```bash
cp .env.example .env.local
```

Set `NEXT_PUBLIC_UMBAR_API_BASE_URL=http://localhost:8080`

3. Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3002/login/](http://localhost:3002/login/).

## Local end-to-end test

```bash
# Terminal 1 — Umbar API
cd ../umbar-app && npm run api:dev    # :8080

# Terminal 2 — Ops admin UI
cd ../umbar-admin && npm run dev      # :3002
```

## Routes

| Route | Description |
| --- | --- |
| `/login/` | Team password login |
| `/` | Dashboard — stats overview |
| `/instructors/` | Instructor list |
| `/classes/` | Class list |
| `/students/` | Student list |
| `/inquiries/` | Marketplace inquiry list |

## Deploy

1. Set production `NEXT_PUBLIC_UMBAR_API_BASE_URL` in `.env.local` before building.

2. Build:

```bash
npm run build
```

Upload contents of `out/` via FileZilla to your static host docroot.

3. Ensure the Umbar API is deployed with ops routes (`adminOps` router in `umbar-app`).

Preview locally:

```bash
npx serve out
```
