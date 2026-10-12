# Real Estate Listing Platform

React + Node.js/Express + MongoDB. This version covers **milestone 1 (setup)**,
**milestone 2 (authentication)**, **milestone 3 (listings)**,
**milestone 4 (admin approval and user management)**, **milestone 5 (search and
map)**, **milestone 6 (favorites, saved searches and the user dashboard)**,
**milestone 7 (inquiries, replies and email notifications)** and a separate
real-time **chat** between users, from the design document.

## What works now

- Register as a user (buyer/renter) or an agent
- Email verification, with a "resend" option (the account is created only once the email is confirmed)
- Sign in and sign out (JWT in an httpOnly cookie)
- Forgot password and reset password by emailed link
- View and edit profile, change password
- Role-based access: `protect` and `authorize` on the server, `ProtectedRoute` and `RoleRoute` in React
- Admin account created from the command line
- Agents create, edit and delete listings with up to 10 photos each
- Image uploads to Cloudinary (falls back to local disk storage when unset)
- Public listing browse with filters, and a listing detail page with an image gallery
- Agent dashboard listing every property the agent has published
- Admin approval queue: approve or reject a listing with a reason
- Admin user management: activate or deactivate accounts
- New and edited listings start as `pending` and are hidden from the public until approved
- Search with filters (city, price, type, size, bedrooms), sorting and pagination
- Interactive Leaflet map with markers; results update as the map moves
- Save and remove favorite listings (heart on cards and the detail page)
- Save the current search and re-run it later from the dashboard
- Buyer/renter dashboard: overview, favorites and saved searches
- Signed-in users send inquiries from a listing; agents get an inbox
- Real-time message delivery over Socket.IO, threaded and quoted replies
- Initials avatars everywhere, with optional profile photos
- Email notifications on new messages
- A separate real-time chat between users: conversation list, message history and unread counts

## Requirements

- Node.js 20 or newer
- MongoDB running locally, or a free MongoDB Atlas cluster

> Use **npm** for this project (there is a `package-lock.json` in each package);
> do not mix in pnpm/yarn, or `node_modules` gets duplicated and installs diverge.

## Setup

### 1. Server

```bash
cd server
npm install
cp .env.example .env      # Windows: copy .env.example .env
```

Open `server/.env` and set:

- `MONGO_URI` to your MongoDB connection string
- `JWT_SECRET` to a long random string

Then start it:

```bash
npm run dev
```

The API runs on http://localhost:5000. Check http://localhost:5000/api/health.

### 2. Client

In a second terminal:

```bash
cd client
npm install
copy .env.example .env      # optional: set a MapTiler key for styled map tiles
npm run dev
```

Open http://localhost:5173.

### 3. Admin account

Set the `ADMIN_*` values in `server/.env`, then:

```bash
cd server
npm run create-admin
```

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
request a new one with "Resend verification email". Note that a successful
password reset also marks the account verified, since opening the emailed reset
link proves control of that inbox.

**No account is created until the email is confirmed.** A signup is stored as a
`PendingUser` (with the password already hashed) and the real `User` is created
only when the verification link is opened. Unconfirmed signups auto-expire after
24 hours, so addresses that never verify leave nothing behind — there are no
dummy accounts. Registering with a placeholder/disposable domain (e.g.
`example.com`, `test.com`, `mailinator.com`) is rejected up front, and
registration also does a DNS check: a domain with no MX (or implicit A) record is
rejected with "That email domain cannot receive mail". Lookups are cached and
fail open on transient resolver errors (`MX_LOOKUP_TIMEOUT_MS`). To clear any
legacy unverified accounts, run `npm run purge-unverified`. For your own testing,
use an address you control — Gmail plus-aliases such as `you+test1@gmail.com`
give you many test addresses in one inbox.

> MX checks confirm the *domain* can receive mail, not that a specific mailbox
> exists. A fake mailbox at a real domain (e.g. `random123@gmail.com`) passes the
> MX check, but still creates **no account** — only a pending signup that expires
> in 24h.

## API (milestone 2)

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

## API (milestone 3: listings)

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | /api/listings | Public | Browse listings (filters: city, listingType, propertyType, minPrice, maxPrice, minArea, maxArea, bedrooms, q, north/south/east/west, sort, page, limit) |
| GET | /api/listings/:id | Public | Listing detail (increments the view count) |
| GET | /api/listings/mine | Agent / admin | Listings owned by the signed-in agent |
| POST | /api/listings | Agent / admin | Create a listing (`multipart/form-data`, up to 10 `images`) |
| PUT | /api/listings/:id | Owner / admin | Update a listing (add `images`, delete with `removeImages`) |
| DELETE | /api/listings/:id | Owner / admin | Delete a listing and its images |

## API (milestone 4: admin)

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | /api/admin/listings | Admin | Approval queue (`status=pending\|approved\|rejected\|all`) plus counts |
| PATCH | /api/admin/listings/:id/approve | Admin | Approve a listing |
| PATCH | /api/admin/listings/:id/reject | Admin | Reject with `reason` |
| GET | /api/admin/users | Admin | List users (`role`, `q` filters) |
| PATCH | /api/admin/users/:id/activate | Admin | Activate an account |
| PATCH | /api/admin/users/:id/deactivate | Admin | Deactivate an account |

Admins cannot change their own account status. Editing an existing listing returns
it to the `pending` queue so it is reviewed again.

## API (milestone 5: search, map and geocoding)

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | /api/listings | Public | Filters, sorting, pagination and map-bounds search (see above) |
| GET | /api/stats | Public | Headline counts (listings, agents, cities) for the home page |
| GET | /api/geocode?q= | Signed in | Turn an address into `{ lat, lng, label }` (proxies Nominatim) |

`GEOCODE_USER_AGENT` in `.env` is sent to Nominatim, as their usage policy
requires. Lookups are rate limited per minute (`GEOCODE_RATE_LIMIT`).

## API (milestone 6: favorites and saved searches)

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
“Run search” simply navigates to `/listings?…`.

## API (milestone 7: inquiries)

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | /api/inquiries?box=sent\|received | Signed in | Your conversations |
| GET | /api/inquiries/unread-count | Signed in | Unread conversations (badge) |
| GET | /api/inquiries/:id | Participant | Full thread (marks your side read) |
| POST | /api/inquiries | Signed in | Contact an agent about a listing |
| POST | /api/inquiries/:id/reply | Participant | Reply (optional `quotedId`) |

Sending an inquiry or replying emails the other party. With SMTP unconfigured,
the message is printed in the server terminal instead (same dev fallback as the
auth emails).

### Real-time updates

Messages are also pushed over Socket.IO. The client connects using the same
httpOnly auth cookie (Vite proxies `/socket.io` in development), joins a room
named after the user id, and listens for `inquiry:message`. When it fires, the
open thread refetches and the unread badge updates — no polling.

### Avatars

Users show an initials avatar (colour derived from the name) unless they have a
profile photo. Photos are optional:

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | /api/auth/me/avatar | Signed in | Upload/replace profile photo (`multipart`, field `avatar`) |
| DELETE | /api/auth/me/avatar | Signed in | Remove profile photo |

## API (chat)

Direct one-to-one chat between users, separate from listing inquiries.

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | /api/chat/conversations | Signed in | Conversation list with last message + unread |
| POST | /api/chat/conversations | Signed in | Start/find a conversation (`{ userId }`) |
| GET | /api/chat/conversations/:id | Participant | Message history (marks the other party's messages read) |
| POST | /api/chat/conversations/:id/messages | Participant | Send a message |
| GET | /api/chat/unread-count | Signed in | Conversations with unread + message total (badge) |
| GET | /api/chat/users?q= | Signed in | Find people to start a chat with |

New messages are pushed over the shared Socket.IO connection as `chat:message`.
The client owns one socket (`SocketContext`); inquiries and chat subscribe to
their own events on it.

## Image uploads

Listing photos go to **Cloudinary** when `CLOUDINARY_CLOUD_NAME`,
`CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` are set in `.env`. When they are
left empty the server saves files under `server/uploads` and serves them from
`/uploads`, so uploads work during development without an account.

## Search and map

The browse page (`/listings`) supports city, price, type, size and bedroom
filters, sorting (newest, price, area) and pagination. Listings carry an optional
GeoJSON `location` (set by clicking the map in the listing form), which powers
the Leaflet map. Panning or zooming the map re-runs the search against the
visible bounds; this can be turned off with the "Search as I move the map"
checkbox. Listings without coordinates still appear in the list but not on the map.

Nearby markers are grouped into clusters that split apart as you zoom in.

### Map tiles and geocoding

Tiles default to OpenStreetMap, so the map works with no signup. To use
MapTiler's styled basemaps (recommended for a production look), copy
`client/.env.example` to `client/.env` and set `VITE_MAPTILER_KEY`; `VITE_MAP_STYLE`
picks the MapTiler style (e.g. `streets-v2`, `basic-v2`, `streets-v2-dark`).

Agents can fill in the address and press **Locate from address** in the listing
form. The client calls `/api/geocode`, which proxies Nominatim on the server and
drops a pin at the result.

## Validation and rate limiting

- Every write endpoint validates its input with `express-validator` (declared per
  route under `routes/`) and rejects with a readable, per-field message via
  `middleware/validate.js`. `:id` params are checked as Mongo ids too.
- Saved-search params are whitelisted (`utils/query.js`) so stored searches always
  replay safely. Search input is regex-escaped before use.
- Rate limits (per IP, configurable via env): a broad `API_RATE_LIMIT` on all of
  `/api`, plus stricter limits on auth (`AUTH_RATE_LIMIT`), geocoding
  (`GEOCODE_RATE_LIMIT`) and messaging — inquiries and chat
  (`MESSAGE_RATE_LIMIT`). `app.set('trust proxy', 1)` makes the limits correct
  behind a reverse proxy.
- Helmet sets security headers, including a CSP that allows the map tiles and
  Cloudinary images.

## Testing

Both packages have a test script.

```bash
cd server && npm test     # node:test — validation/query and token helpers
cd client && npm test     # vitest — search and avatar helpers
```

The suites cover the pure logic that is easy to get wrong: regex escaping, saved
search param cleaning, JWT/hash helpers, search summaries and avatar initials.

## Deployment

### Option A — Docker (recommended)

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

Uploads fall back to the container's `server/uploads` when Cloudinary isn't set;
that path is ephemeral, so configure Cloudinary for production.

### Option B — plain Node

```bash
cd client && npm install && npm run build      # produces client/dist
cd ../server && npm install
NODE_ENV=production npm start                   # serves /api and the SPA on PORT
```

With `NODE_ENV=production` the server serves `client/dist` and falls back to
`index.html` for client-side routes, so one process runs the whole app.

### Environment checklist

- `NODE_ENV=production`, a strong `JWT_SECRET`, `MONGO_URI` (Atlas) and
  `CLIENT_URL` (your public URL). Copy `server/.env.example` as a starting point.
- **`SMTP_*` is required:** accounts are created only after email verification, so
  without working email **no one can complete signup**.
- **Cloudinary** keys (or a persistent volume) — otherwise uploads are lost on
  redeploy.
- The auth cookie is `secure` automatically in production, so the site must be
  served over **HTTPS**. Adjust `COOKIE_SAMESITE` (`none` for cross-site HTTPS).
- Optional: set `VITE_MAPTILER_KEY` in `client/.env` before building for styled
  map tiles; otherwise OpenStreetMap is used.
- Create the admin: `npm run create-admin`. Health check: `GET /api/health`.

### CI

`.github/workflows/ci.yml` runs on push/PR: server tests, client tests + build,
and a Docker image build.

### Separate frontend

Deploy `client/dist` to any static host and point it at the API (set `CLIENT_URL`
on the server for CORS). Cross-site cookies require `COOKIE_SAMESITE=none` and
HTTPS.

## Protecting a route (for the next milestones)

```js
import { protect, authorize } from '../middleware/auth.js';

router.post('/', protect, authorize('agent'), createListing);
```

## Project structure

```
Dockerfile                  Builds the client + runs the API in one image
docker-compose.yml          Runs the app with env from a root .env
.github/workflows/ci.yml    CI: server tests, client tests + build, docker build
server/
  config/db.js              MongoDB connection
  models/User.js            User schema, password hashing, favorites
  models/Listing.js         Listing schema (address, images, status, location)
  models/SavedSearch.js     Stored search params
  models/Inquiry.js         Buyer/agent conversation with replies
  models/Conversation.js    One-to-one chat between users
  models/PendingUser.js     Unverified signup (account created on verify)
  controllers/authController.js
  controllers/listingController.js
  controllers/adminController.js
  controllers/geocodeController.js
  controllers/favoriteController.js
  controllers/savedSearchController.js
  controllers/inquiryController.js
  controllers/chatController.js
  routes/authRoutes.js      Routes and input validation
  routes/listingRoutes.js
  routes/adminRoutes.js
  routes/geocodeRoutes.js
  routes/favoriteRoutes.js
  routes/savedSearchRoutes.js
  routes/inquiryRoutes.js
  routes/chatRoutes.js
  middleware/               auth, validate, errorHandler, rateLimit
  utils/                    token, sendEmail, upload, query, email (address checks)
  uploads/                  Local image storage (development fallback)
  test/                     node:test unit tests (query, token, email)
  scripts/createAdmin.js
  scripts/purgeUnverified.js
  socket.js                 Socket.IO setup and per-user rooms
  app.js                    Express app
  server.js                 Entry point + http/socket server
client/
  .env.example              Map tile settings (MapTiler key, style)
  src/api/axios.js          Axios instance
  src/config/map.js         Tile URL, attribution and default view
  src/context/AuthContext.jsx
  src/context/SocketContext.jsx
  src/context/FavoritesContext.jsx
  src/context/InquiryContext.jsx
  src/context/ChatContext.jsx
  src/utils/                search.js, avatar.js (each with a *.test.js)
  src/routes/               ProtectedRoute, RoleRoute
  src/components/           Navbar, ListingCard, ImageGallery, ListingMap, LocationPicker, Avatar
  src/pages/                Home, Listings, ListingDetail, Inbox, Thread, Chat, Login,
                            Register, VerifyEmail, ForgotPassword, ResetPassword, Profile
  src/pages/agent/          AgentDashboard, ListingForm
  src/pages/admin/          AdminDashboard
  src/pages/dashboard/      DashboardLayout, Overview, Favorites, SavedSearches
```
