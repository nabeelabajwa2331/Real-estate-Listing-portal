# Real Estate Listing Platform

A full-stack property listing portal: React (Vite) front end, Node.js/Express API,
MongoDB database, and real-time messaging over Socket.IO. It covers the whole
design document — authentication, listings with admin approval, search + map,
favorites and saved searches, inquiries with email notifications, and one-to-one
chat.

**Live app:** https://real-estate-listing-portal-hazel.vercel.app

> The React front end is hosted on Vercel and proxies API calls to the Express
> API on Render. Render's free tier spins down when idle, so the first request
> after a period of inactivity may take 30–60 seconds while the API wakes up.

> **Submission notes:** see [`SUBMISSION.md`](./SUBMISSION.md) for a
> point-by-point response to the project review (links, feature verification and
> test accounts).

---

## Technologies used

**Front end**

- React 18 with Vite
- React Router (client-side routing, protected + role-based routes)
- Axios (API client)
- Leaflet + react-leaflet + react-leaflet-cluster (interactive map)
- socket.io-client (real-time messaging)

**Back end**

- Node.js + Express 5 (ES modules)
- MongoDB with Mongoose (schema, validation, indexes)
- JWT authentication in an httpOnly cookie
- bcryptjs (password hashing)
- express-validator (per-route input validation)
- express-rate-limit (per-IP rate limiting)
- Multer + Cloudinary (image uploads, with a local-disk fallback)
- Nodemailer (verification, password reset and notification emails)
- Helmet (security headers / CSP)
- Socket.IO (per-user rooms for live updates)

**Tooling & infrastructure**

- Vitest (client unit tests), Node's built-in `node:test` (server unit tests)
- Docker (multi-stage build: client + API in one image)
- GitHub Actions (CI: tests, client build, Docker build)
- Vercel (front-end hosting) + Render (API hosting)

---

## Features

**Accounts & auth**

- Register as a buyer/renter (`user`) or an `agent`
- Email verification with a "resend" option, plus placeholder/disposable-domain
  and DNS/MX checks
- Sign in / sign out (JWT in an httpOnly cookie)
- Forgot password and reset password by emailed link
- View and edit profile, change password, optional avatar photo
- Role-based access control on the server (`protect`, `authorize`) and in React
  (`ProtectedRoute`, `RoleRoute`)

**Listings**

- Agents create, edit and delete listings with up to 10 photos each
- Image uploads to Cloudinary (falls back to local disk storage when unset)
- Public listing browse with filters, sorting and pagination
- Listing detail page with an image gallery
- New and edited listings start as `pending` and stay hidden from the public
  until an admin approves them

**Admin**

- Listing approval queue: approve, or reject with a reason
- User management: activate or deactivate accounts
- Admins cannot change their own account status

**Search & map**

- Filter by city, price, type, size and bedrooms; sort and paginate
- Interactive Leaflet map with clustered markers
- Panning/zooming the map re-runs the search against the visible bounds
- Address lookup ("Locate from address") proxied to Nominatim

**Favorites & saved searches**

- Save/remove favorite listings (heart on cards and the detail page)
- Save the current search and re-run it later from the dashboard
- Dashboard (overview, favorites, saved searches) — available to **every
  signed-in account**, not just buyers

**Inquiries & chat**

- Signed-in users send inquiries from a listing; agents get an inbox
- Threaded replies with quoting
- Real-time delivery over Socket.IO, with unread badges
- Email notifications on new messages (dev fallback prints to the terminal)
- A separate real-time one-to-one chat between any two users

---

## Requirements

- Node.js 20 or newer
- MongoDB running locally, or a free MongoDB Atlas cluster

> Use **npm** for this project (there is a `package-lock.json` in each package);
> do not mix in pnpm/yarn, or `node_modules` gets duplicated and installs diverge.

---

## Getting started

### 1. Server

```bash
cd server
npm install
cp .env.example .env      # Windows: copy .env.example .env
```

Open `server/.env` and set at least:

- `MONGO_URI` — your MongoDB connection string
- `JWT_SECRET` — a long random string
  (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`)

Then start it:

```bash
npm run dev
```

The API runs on http://localhost:5000 — check http://localhost:5000/api/health.

### 2. Client

In a second terminal:

```bash
cd client
npm install
copy .env.example .env      # optional: set a MapTiler key for styled map tiles
npm run dev
```

Open http://localhost:5173.

### 3. Create an admin account

Set the `ADMIN_*` values in `server/.env`, then:

```bash
cd server
npm run create-admin
```

### 4. (Optional) Seed demo data

To explore the app with ready-made accounts and listings (including map
coordinates), run:

```bash
cd server
npm run seed
```

This creates:

| Role  | Email               | Password                |
| ----- | ------------------- | ----------------------- |
| Admin | `admin@example.com` | *shared with reviewers* |
| Agent | `agent@example.com` | `Agent12345`            |
| Buyer | `buyer@example.com` | `Buyer12345`            |

> The admin password is intentionally **not** published in this repository; it is
> shared privately with reviewers. Never run the seed script against a production
> database (it resets these demo accounts).

…plus 8 approved listings across several cities. The script is idempotent: it
resets these demo accounts and replaces the demo agent's listings on each run.
Change the credentials in `server/scripts/seed.js` before using it anywhere
public.

---

## Environment variables

Copy `server/.env.example` to `server/.env`. The most important values:

| Variable | Purpose |
| --- | --- |
| `PORT` | API port (default `5000`) |
| `NODE_ENV` | Set to `production` when deployed |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing auth tokens |
| `CLIENT_URL` | Public URL of the app (CORS + links in emails) |
| `COOKIE_SAMESITE` | `lax` for same-site, `none` for cross-site HTTPS |
| `REQUIRE_EMAIL_VERIFICATION` | `true` in production, `false` to skip the email step |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `EMAIL_FROM` | Outgoing email |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Image uploads |
| `GEOCODE_USER_AGENT` | User-Agent sent to Nominatim (their policy requires one) |

Optional client settings live in `client/.env` (`VITE_MAPTILER_KEY`,
`VITE_MAP_STYLE`).

---

## Emails (verification, reset, notifications)

Email behaviour depends on configuration:

- **Production:** set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (and
  `EMAIL_FROM`). Emails are delivered to the recipient's own inbox, so each user
  verifies their own account. Any SMTP provider works — Gmail (app password),
  Resend, SendGrid, Mailgun, Amazon SES, etc.
- **Development:** leave `SMTP_HOST` empty and `EMAIL_TRANSPORT=ethereal` (the
  default). Emails are captured in a throwaway **Ethereal** inbox and a preview
  URL is printed in the terminal — no real inbox or signup needed. Set
  `EMAIL_TRANSPORT=console` to just print the message instead.

Verification links expire after `VERIFY_EXPIRES_HOURS` (default 24); users can
request a new one with "Resend verification email". A successful password reset
also marks the account verified, since opening the emailed reset link proves
control of that inbox.

**Verification is controlled by `REQUIRE_EMAIL_VERIFICATION`** (default `true`).
When `true`, new accounts must confirm via email. When `false`, registration
creates a ready-to-use account with **no email step** — handy in development so
test/dummy addresses can sign in immediately. `VERIFICATION_BYPASS_EMAILS`
(comma-separated) lists specific addresses that skip verification even when it is
required.

**No account is created until the email is confirmed.** A signup is stored as a
`PendingUser` (with the password already hashed) and the real `User` is created
only when the verification link is opened. Unconfirmed signups auto-expire after
24 hours. Registering with a placeholder/disposable domain (e.g. `example.com`,
`test.com`, `mailinator.com`) is rejected up front, and registration also does a
DNS check: a domain with no MX (or implicit A) record is rejected with "That
email domain cannot receive mail". Lookups are cached and fail open on transient
resolver errors (`MX_LOOKUP_TIMEOUT_MS`). To clear any legacy unverified
accounts, run `npm run purge-unverified`.

> MX checks confirm the *domain* can receive mail, not that a specific mailbox
> exists. A fake mailbox at a real domain (e.g. `random123@gmail.com`) passes the
> MX check, but still creates **no account** — only a pending signup that expires
> in 24h.

> **Deploying a demo?** Email verification requires working SMTP, or nobody can
> finish signup. For a public demo either configure `SMTP_*`, or set
> `REQUIRE_EMAIL_VERIFICATION=false` (as the included `render.yaml` does).

---

## API reference

### Auth (milestone 2)

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | /api/auth/register | Public | Create a user or agent account |
| GET | /api/auth/verify/:token | Public | Verify email |
| POST | /api/auth/resend-verification | Public | Send a new verification link |
| POST | /api/auth/login | Public | Sign in |
| POST | /api/auth/logout | Public | Sign out |
| POST | /api/auth/forgot-password | Public | Email a reset link |
| POST | /api/auth/reset-password/:token | Public | Set a new password |
| GET | /api/auth/me | Signed in | Current user |
| PUT | /api/auth/me | Signed in | Update profile or password |
| POST | /api/auth/me/avatar | Signed in | Upload/replace profile photo |
| DELETE | /api/auth/me/avatar | Signed in | Remove profile photo |

### Listings (milestone 3)

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | /api/listings | Public | Browse (filters: city, listingType, propertyType, minPrice, maxPrice, minArea, maxArea, bedrooms, q, north/south/east/west, sort, page, limit) |
| GET | /api/listings/:id | Public | Listing detail (increments the view count) |
| GET | /api/listings/mine | Agent / admin | Listings owned by the signed-in agent |
| POST | /api/listings | Agent / admin | Create a listing (`multipart/form-data`, up to 10 `images`) |
| PUT | /api/listings/:id | Owner / admin | Update a listing (add `images`, delete with `removeImages`) |
| DELETE | /api/listings/:id | Owner / admin | Delete a listing and its images |

### Admin (milestone 4)

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | /api/admin/listings | Admin | Approval queue (`status=pending\|approved\|rejected\|all`) plus counts |
| PATCH | /api/admin/listings/:id/approve | Admin | Approve a listing |
| PATCH | /api/admin/listings/:id/reject | Admin | Reject with `reason` |
| GET | /api/admin/users | Admin | List users (`role`, `q` filters) |
| PATCH | /api/admin/users/:id/activate | Admin | Activate an account |
| PATCH | /api/admin/users/:id/deactivate | Admin | Deactivate an account |

Editing an existing listing returns it to the `pending` queue so it is reviewed
again.

### Search, map and geocoding (milestone 5)

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | /api/stats | Public | Headline counts (listings, agents, cities) for the home page |
| GET | /api/geocode?q= | Signed in | Turn an address into `{ lat, lng, label }` (proxies Nominatim) |

### Favorites and saved searches (milestone 6)

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | /api/favorites | Signed in | Saved listings (populated) |
| GET | /api/favorites/ids | Signed in | Just the saved listing ids |
| POST | /api/favorites/:listingId | Signed in | Save a listing |
| DELETE | /api/favorites/:listingId | Signed in | Remove a saved listing |
| GET | /api/saved-searches | Signed in | List saved searches |
| POST | /api/saved-searches | Signed in | Save `{ name, params }` |
| DELETE | /api/saved-searches/:id | Signed in | Delete a saved search |

Saved-search `params` are whitelisted to the browse query keys, so a stored
search always replays safely. The browse page reads its filters from the URL, so
"Run search" simply navigates to `/listings?…`.

### Inquiries (milestone 7)

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | /api/inquiries?box=sent\|received | Signed in | Your conversations |
| GET | /api/inquiries/unread-count | Signed in | Unread conversations (badge) |
| GET | /api/inquiries/:id | Participant | Full thread (marks your side read) |
| POST | /api/inquiries | Signed in | Contact an agent about a listing |
| POST | /api/inquiries/:id/reply | Participant | Reply (optional `quotedId`) |

### Chat

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | /api/chat/conversations | Signed in | Conversation list with last message + unread |
| POST | /api/chat/conversations | Signed in | Start/find a conversation (`{ userId }`) |
| GET | /api/chat/conversations/:id | Participant | Message history (marks the other party's messages read) |
| POST | /api/chat/conversations/:id/messages | Participant | Send a message |
| GET | /api/chat/unread-count | Signed in | Conversations with unread + message total (badge) |
| GET | /api/chat/users?q= | Signed in | Find people to start a chat with |

### Real-time updates

Messages are pushed over Socket.IO. The client connects using the same httpOnly
auth cookie (Vite proxies `/socket.io` in development), joins a room named after
the user id, and listens for `inquiry:message` and `chat:message`. When one
fires, the open thread/chat refetches and the unread badge updates — no polling.
The client owns a single socket (`SocketContext`); the inquiry and chat contexts
subscribe to their own events on it.

---

## Search and map

The browse page (`/listings`) supports city, price, type, size and bedroom
filters, sorting (newest, price, area) and pagination. Listings carry an optional
GeoJSON `location` (set by clicking the map in the listing form), which powers
the Leaflet map. Panning or zooming the map re-runs the search against the
visible bounds; this can be turned off with the "Search as I move the map"
checkbox. Listings without coordinates still appear in the list but not on the
map, and nearby markers are grouped into clusters that split apart as you zoom.

### Map tiles and geocoding

Tiles default to OpenStreetMap, so the map works with no signup. For a production
look, copy `client/.env.example` to `client/.env` and set `VITE_MAPTILER_KEY`
(and optionally `VITE_MAP_STYLE`, e.g. `streets-v2`, `basic-v2`,
`streets-v2-dark`). Note that OpenStreetMap's public tile servers block app
traffic under their usage policy, so a real deployment should use MapTiler (or
another provider).

Agents can fill in the address and press **Locate from address** in the listing
form. The client calls `/api/geocode`, which proxies Nominatim on the server and
drops a pin at the result.

---

## Image uploads

Listing photos (and avatars) go to **Cloudinary** when `CLOUDINARY_CLOUD_NAME`,
`CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` are set. When they are left empty
the server saves files under `server/uploads` and serves them from `/uploads`, so
uploads work during development without an account. That folder is ephemeral in a
container, so configure Cloudinary (or a persistent volume) for production.

---

## Validation and rate limiting

- Every write endpoint validates its input with `express-validator` (declared per
  route under `routes/`) and rejects with a readable, per-field message via
  `middleware/validate.js`. `:id` params are checked as Mongo ids too.
- Saved-search params are whitelisted (`utils/query.js`) so stored searches always
  replay safely. Search input is regex-escaped before use.
- Rate limits (per IP, configurable via env): a broad `API_RATE_LIMIT` on all of
  `/api`, plus stricter limits on auth (`AUTH_RATE_LIMIT`), geocoding
  (`GEOCODE_RATE_LIMIT`) and messaging (`MESSAGE_RATE_LIMIT`). `app.set('trust
  proxy', 1)` makes the limits correct behind a reverse proxy.
- Helmet sets security headers, including a CSP that allows the map tiles and
  Cloudinary images.

---

## Testing

Both packages have a test script.

```bash
cd server && npm test     # node:test — validation/query and token helpers
cd client && npm test     # vitest — search and avatar helpers
```

The suites cover the pure logic that is easy to get wrong: regex escaping and
saved-search param cleaning, JWT/token hashing, email address/domain checks, and
the client's search summaries and avatar initials.

---

## Deployment

### Option A — Docker (single service)

A multi-stage `Dockerfile` builds the React client and runs the API, which serves
the SPA in production. Nothing else is needed on the host.

```bash
# from the repository root
docker build -t real-estate-app .
docker run -p 5000:5000 --env-file server/.env -e NODE_ENV=production real-estate-app

# styled tiles: pass the key at build time
docker build --build-arg VITE_MAPTILER_KEY=your_key -t real-estate-app .
```

Or with Compose (reads a `.env` next to `docker-compose.yml`):

```bash
docker compose up --build
```

### Option B — Render (Docker web service)

Create a **Web Service**, point it at this repo, choose the **Docker** runtime
with Dockerfile path `./Dockerfile` and leave the root directory blank, then add
the environment variables from `server/.env.example`. A `render.yaml` blueprint is
included as an alternative (New → Blueprint).

Because Vite inlines `VITE_*` values at build time, Render passes service
environment variables as Docker build arguments, so set `VITE_MAPTILER_KEY` /
`VITE_MAP_STYLE` on the service for styled map tiles. Health check:
`GET /api/health`.

> Free-tier services spin down when idle, so the first request after inactivity
> is slow. A paid plan (or any always-on host) avoids the cold start.

### Option C — Vercel (front end) + Render (API) — current setup

Vercel hosts static front ends and serverless functions; it **cannot** run this
project's long-running Express + Socket.IO server or its MongoDB-backed API. The
practical setup is: **API on Render, client on Vercel**, with Vercel *proxying*
API requests so the browser only ever talks to the Vercel origin.

1. Deploy the API first (Option A or B) and note its public URL.
2. Put that URL in `client/vercel.json` as the destination of the `/api`,
   `/uploads` and `/socket.io` rewrites (set it to your API's public URL).
3. On the API host set `CLIENT_URL` to the Vercel URL so CORS and email links
   point at the front end. `COOKIE_SAMESITE=lax` is fine here because the browser
   sees a single origin.
4. On Vercel, import the repo and configure:
   - **Root Directory:** `client`
   - **Framework Preset:** Vite
   - **Install Command:** `npm install`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - Environment variables: `VITE_MAPTILER_KEY` / `VITE_MAP_STYLE` (optional,
     for styled map tiles). Leave `VITE_API_URL` unset so requests stay relative.
5. Redeploy the API so the new CORS settings apply.

`client/vercel.json` proxies `/api`, `/uploads` and `/socket.io` to the API host
and falls back to `index.html` for client-side routes. Prefer calling the API
directly (a different origin) instead? Set `VITE_API_URL` on Vercel and
`COOKIE_SAMESITE=none` on the API — but some browsers restrict cross-site
cookies, so the proxy is more reliable. Either way, Vercel does not proxy
WebSockets, so live updates use Socket.IO's polling fallback.

### Option D — plain Node

```bash
cd client && npm install && npm run build      # produces client/dist
cd ../server && npm install
NODE_ENV=production npm start                   # serves /api and the SPA on PORT
```

With `NODE_ENV=production` the server serves `client/dist` and falls back to
`index.html` for client-side routes, so one process runs the whole app.

### Deployment environment checklist

- `NODE_ENV=production`, a strong `JWT_SECRET`, `MONGO_URI` (Atlas) and
  `CLIENT_URL` (your public URL). Copy `server/.env.example` as a starting point.
- **`SMTP_*` is required** for signup unless `REQUIRE_EMAIL_VERIFICATION=false`.
- **Cloudinary** keys (or a persistent volume) — otherwise uploads are lost on
  redeploy.
- The auth cookie is `secure` automatically in production, so the site must be
  served over **HTTPS**. Adjust `COOKIE_SAMESITE` (`none` for cross-site HTTPS).
- Optional: set `VITE_MAPTILER_KEY` at build time for styled map tiles;
  otherwise OpenStreetMap is used.
- Create the admin (`npm run create-admin`) and optionally seed demo data
  (`npm run seed`). Health check: `GET /api/health`.

### CI

`.github/workflows/ci.yml` runs on push/PR: server tests, client tests + build,
and a Docker image build.

### Separate frontend

Deploy `client/dist` to any static host and point it at the API (set `CLIENT_URL`
on the server for CORS). Cross-site cookies require `COOKIE_SAMESITE=none` and
HTTPS.

---

## Project structure

```
Dockerfile                  Builds the client + runs the API in one image
docker-compose.yml          Runs the app with env from a root .env
render.yaml                 Render blueprint (one Docker web service)
.github/workflows/ci.yml    CI: server tests, client tests + build, docker build
server/
  config/db.js              MongoDB connection
  models/User.js            User schema, password hashing, favorites
  models/Listing.js         Listing schema (address, images, status, location)
  models/SavedSearch.js     Stored search params
  models/Inquiry.js         Buyer/agent conversation with replies
  models/Conversation.js    One-to-one chat between users
  models/PendingUser.js     Unverified signup (account created on verify)
  controllers/              auth, listing, admin, geocode, favorite,
                            savedSearch, inquiry, chat
  routes/                   Route definitions + per-route validation
  middleware/               auth, validate, errorHandler, rateLimit
  utils/                    token, sendEmail, upload, query, email (address checks)
  uploads/                  Local image storage (development fallback)
  test/                     node:test unit tests (query, token, email)
  scripts/createAdmin.js    Create/promote the admin account
  scripts/seed.js           Seed demo accounts + listings
  scripts/purgeUnverified.js
  socket.js                 Socket.IO setup and per-user rooms
  app.js                    Express app
  server.js                 Entry point + http/socket server
client/
  .env.example              Map tile settings (MapTiler key, style) + API URL
  vercel.json               Rewrites /api, /uploads, /socket.io to the API host
  src/api/axios.js          Axios instance
  src/config/map.js         Tile URL, attribution and default view
  src/context/              Auth, Socket, Favorites, Inquiry, Chat
  src/utils/                search.js, avatar.js (each with a *.test.js)
  src/routes/               ProtectedRoute, RoleRoute
  src/components/           Navbar, ListingCard, ImageGallery, ListingMap,
                            LocationPicker, Avatar
  src/pages/                Home, Listings, ListingDetail, Inbox, Thread, Chat,
                            Login, Register, VerifyEmail, ForgotPassword,
                            ResetPassword, Profile
  src/pages/agent/          AgentDashboard, ListingForm
  src/pages/admin/          AdminDashboard
  src/pages/dashboard/      DashboardLayout, Overview, Favorites, SavedSearches
```
