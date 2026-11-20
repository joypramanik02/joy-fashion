# Joy Fashion — Backend

Node.js + Express API + the store frontend, in one server. The same server serves
the shop (`/`), the admin panel (`/admin.html`) and the API (`/api/*`).

## Run it on your computer

```bash
cd backend
npm install
npm start
```

Then open http://localhost:3000 — the full store runs there.
Admin: http://localhost:3000/admin.html — username `admin`, password `admin123`.

Change the password and secret before going live — copy `.env.example` to `.env`
and edit it:

```bash
cp .env.example .env
# edit ADMIN_PASSWORD and JWT_SECRET in .env
```

Data is stored in `data/db.json` (created automatically on first run, seeded with
the 12 products). It is git-ignored, so your real orders never go to GitHub.
Back it up by copying the file.

## API

| Method | Route | Who | What |
| --- | --- | --- | --- |
| GET | /api/health | anyone | Server check |
| GET | /api/products | anyone | List products (filters: ?cat=Men, ?q=saree) |
| GET | /api/products/:id | anyone | One product |
| POST | /api/orders | anyone | Place an order — the server calculates the total and reduces stock |
| POST | /api/admin/login | anyone | Login, returns a JWT token (12h) |
| GET | /api/admin/stats | admin | Products / orders / revenue / low stock |
| GET | /api/admin/orders | admin | All orders, newest first |
| PATCH | /api/admin/orders/:id/status | admin | Change order status |
| POST | /api/admin/products | admin | Add a product |
| PUT | /api/admin/products/:id | admin | Edit a product |
| DELETE | /api/admin/products/:id | admin | Delete a product |

Admin routes need `Authorization: Bearer <token>` from the login response.
Wrong password returns 401, and unauthenticated admin calls return 401 too.

## Deploy free (so anyone can open your shop)

**Render.com (free tier):**
1. Push this repo to GitHub (already done: `joypramanik02/joy-fashion`).
2. On render.com → New → Web Service → pick the repo.
3. Root Directory: `backend` — Build Command: `npm install` — Start Command: `npm start`.
4. Environment variables: `ADMIN_PASSWORD` (your own password), `JWT_SECRET` (a long random string).
5. Deploy — you get a link like `https://joy-fashion.onrender.com`. That link is
   your live shop WITH backend. Share that link, not the GitHub Pages link.

**Note:** the GitHub Pages link (`joypramanik02.github.io/joy-fashion`) stays as a
demo — GitHub Pages cannot run a server, so there the store falls back to
localStorage demo mode. The Render link is the real business version.

## What the backend does that the demo could not

- Orders are saved on the server, so you see them from any device — not just the
  browser the customer used.
- The server calculates prices and totals, so a customer cannot fake a lower total.
- Stock goes down automatically when an order is placed.
- Admin login is checked on the server with a bcrypt-hashed password and a JWT
  token, instead of a password written in JavaScript.
- Products edited in the admin panel change for every visitor at once.
