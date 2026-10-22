# Submission — Real Estate Listing Portal

**Author:** Nabeela Iqbal
**Submitted to:** MentorTechz Team
**Date:** 22 October 2026

## Deliverables at a glance

| Requirement | Where |
| --- | --- |
| Source code (GitHub) | https://github.com/nabeelabajwa2331/Real-estate-Listing-portal |
| Live application | https://real-estate-listing-portal-hazel.vercel.app |
| Documentation | [`README.md`](./README.md) in the repository root |

---

## 1. Source code

- **Repository:** https://github.com/nabeelabajwa2331/Real-estate-Listing-portal (public)
- **Default branch:** `main`
- **Latest commit:** `cfa8085`
- **Stack:** React 18 + Vite (front end) · Node.js + Express 5 (API) · MongoDB + Mongoose (database) · Socket.IO (real-time)

The repository contains the complete client (`client/`) and server (`server/`) source,
tests, CI workflow, Docker setup, and deployment configuration.

---

## 2. Live deployment

- **Front end (Vercel):** https://real-estate-listing-portal-hazel.vercel.app
- **API:** hosted on Render and reached through Vercel rewrites (`/api`, `/uploads`,
  `/socket.io`), so the browser only ever talks to the Vercel origin.

**On the Vercel / Next.js note:** this project is a **React + Vite** application, not
Next.js. The front end is now deployed on **Vercel** as requested. The API remains on a
persistent host because the application uses a long-running **Express + Socket.IO**
server (and Socket.IO real-time requires WebSockets, which Vercel's serverless
functions cannot host). Vercel proxies the API calls, so requests and the auth cookie
stay same-origin. Render's free tier may cold-start after inactivity (30–60 s); the
Vercel front end itself loads immediately.

---

## 3. Documentation

[`README.md`](./README.md) is comprehensive and includes:

- Requirements and local setup (server **and** client)
- Environment variables reference
- Technologies used
- Feature overview
- Complete API reference
- Search & map, image uploads, validation and rate limiting
- Testing instructions
- Deployment guides (Vercel + Render, Docker, plain Node)

---

## 4. Feature completion — the items flagged as missing

All items below are implemented and were **verified against the live deployment on
22 October 2026**.

| Feature | Status | UI location | API endpoints | Live verification |
| --- | --- | --- | --- | --- |
| **Favorites** | ✅ Implemented | `/dashboard/favorites`; heart on cards & detail page | `GET /api/favorites`, `GET /api/favorites/ids`, `POST /api/favorites/:listingId`, `DELETE /api/favorites/:listingId` | `POST` → 201, `GET` → 200, `DELETE` → 200 |
| **Saved searches** | ✅ Implemented | `/dashboard/searches`; "Save search" on `/listings` | `GET/POST /api/saved-searches`, `DELETE /api/saved-searches/:id` | `POST` → 201, `GET` → 200, `DELETE` → 200 |
| **Admin property approval** | ✅ Implemented | `/admin` (approval queue) | `GET /api/admin/listings?status=pending`, `PATCH /api/admin/listings/:id/approve`, `PATCH /api/admin/listings/:id/reject` | `GET` → 200 (queue + counts) |
| **Agent inquiry / chat** | ✅ Implemented | `/inbox`, `/inbox/:id`, `/chat` | `GET/POST /api/inquiries`, `POST /api/inquiries/:id/reply`, `GET/POST /api/chat/conversations`, `POST /api/chat/conversations/:id/messages` | `GET` → 200 for inbox and conversations |

**Approval workflow details:** new and edited listings start as `pending` and are hidden
from the public listing feed until an admin approves them. Rejecting a listing records a
reason; editing an approved listing returns it to the `pending` queue for re-review.

### Public data and sign-in

- **What guests see:** aggregate stats on the landing page (live listings, verified agents,
  cities) and the photos of any property opened through a shared link.
- **What requires an account:** the browse catalogue (`/listings`), the full property detail
  — price, address, description, amenities, agent name — and all agent contact information.
  A guest who opens a shared property link sees its photos plus a *“Sign in to view this
  property”* panel.
- **Why:** agent phone numbers and emails are personal data, and the listing details are
  the product's value. Restricting them also reduces scraping and spam. The rule is
  enforced by the API, not just the UI: `GET /api/listings` returns `401` without a session,
  and `GET /api/listings/:id` returns only `_id` and `images` when no user is signed in.
- **What sign-in unlocks:** the catalogue, full property details, agent phone/email,
  favorites, saved searches, inquiries, real-time chat, and the agent/admin dashboards.
- **Landing-page numbers** are aggregate counts of approved listings, agents and cities —
  they contain no private user data and are safe to display publicly.

---

## 5. How to test (demo accounts)

Seeded accounts (from `server/scripts/seed.js`):

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@example.com` | *provided separately to reviewers* |
| Agent | `agent@example.com` | `Agent12345` |
| Buyer | `buyer@example.com` | `Buyer12345` |

> The admin password is intentionally **not** published in this repository; it is
> supplied privately with the submission.

Suggested click-paths:

1. **Favorites** — sign in as the buyer → open any listing → click the heart → open
   **Dashboard → Favorites**.
2. **Saved searches** — on `/listings`, apply filters (e.g. city, price) → **Save search**
   → open **Dashboard → Saved searches** → **Run search**.
3. **Admin approval** — sign in as admin → **Admin** → review the pending queue →
   **Approve** or **Reject** with a reason.
4. **Inquiries** — as the buyer, open a listing → **Contact agent** → send a message;
   then sign in as the agent → **Messages** → **Inquiries** → open the thread and reply.
5. **Chat** — sign in as any user → **Messages** → **New chat** → start a one-to-one
   conversation. Chats and inquiries share the same WhatsApp-style list.
6. **Guest gating** — sign out → open `/listings`: you are redirected to sign in. A shared
   listing link still opens and shows only the photos and a sign-in panel. In DevTools →
   Network, `GET /api/listings` returns `401`, and `GET /api/listings/:id` contains only
   `_id` and `images` (no price, address or agent contact). Sign in and reload to see the
   full details and the Call/Email buttons.

> For a quick end-to-end check of the approval flow, sign in as the agent, create a
> listing, then sign in as the admin and approve it.

---

## 6. Technical implementation highlights

- **Role-based access control** enforced server-side (`protect`, `authorize`) and in
  React (`ProtectedRoute`, `RoleRoute`) for `user`, `agent` and `admin`.
- **Authentication** with JWT stored in an httpOnly cookie (Secure in production,
  SameSite=Lax because the browser sees a single Vercel origin).
- **Listing lifecycle:** `pending → approved / rejected`, with edits re-entering review.
- **Validation & hardening:** `express-validator` on every write route, per-IP rate
  limiting, Helmet security headers with a tuned CSP.
- **Uploads:** Cloudinary when configured, with a local-disk fallback for development.
- **Real-time:** Socket.IO per-user rooms power live inquiry and chat updates.
- **Data models:** `User`, `Listing`, `SavedSearch`, `Inquiry`, `Conversation`,
  `PendingUser`.
- **Testing:** Vitest (client) and Node's built-in `node:test` (server).

---

## 7. Point-by-point response to the feedback

| Feedback item | Response |
| --- | --- |
| Source code for review | Public GitHub repository linked in §1. |
| Comprehensive README | [`README.md`](./README.md) covers setup, technologies, features, API, testing and deployment (§3). |
| Complete favorites & saved searches | Implemented and verified live (§4). |
| Complete admin approval workflow | Implemented and verified live (§4). |
| Complete agent inquiry/chat | Implemented and verified live (§4). |
| Ensure features are accessible / functional | Verified against the live deployment; demo accounts provided in §5. |
| Deploy on Vercel | Front end is deployed on Vercel. The Express + Socket.IO API stays on a persistent host because Vercel cannot host WebSockets; Vercel proxies the API (§2). |
| Cold starts | Noted; caused by the free hosting tier, not the application (§2). |

---

## 8. Notes

- The demo agent/buyer credentials are published in the seed script; **change them
  before using the site publicly**. The admin password is not published and is shared
  privately with reviewers.
- Email verification is disabled in the deployed demo (`REQUIRE_EMAIL_VERIFICATION=false`),
  so accounts can sign in immediately. Configure `SMTP_*` to enable real verification
  emails.
- Health check: `GET /api/health`.
