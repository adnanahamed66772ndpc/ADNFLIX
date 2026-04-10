# ADNFLIX Code Index

## 1) High-Level Architecture Summary

- Monorepo split: `backend` is an Express + MySQL API; `frontend` is a React + Vite SPA with route-level pages and hook-driven data access.
- Backend design: route modules under `backend/src/routes` map HTTP paths to controller functions in `backend/src/controllers`; auth/role middleware gates protected/admin endpoints.
- Data model usage: controllers read/write users/profiles/roles, titles/seasons/episodes, watchlist, playback progress, transactions/subscriptions, ad settings/videos/impressions, tickets/replies, and editable page content.
- Frontend design: `api/client.ts` centralizes API URL + auth token handling; `contexts` wrap `useAuth` and `useTitles`; pages compose hooks/components.
- Playback stack: custom `VideoPlayer` + `VideoPlayerWithAds` supports HLS/direct video, progress persistence/resume, pre/mid/post-roll ads, and VAST/VMAP parsing/tracking.
- Admin surface: admin page orchestrates tabs for catalog CRUD, users/subscriptions, payment approvals, ad config, tickets, and settings.

## 2) Backend Index

### `config`

- `backend/src/config/database.js` - Creates MySQL pool with optional SSL/cloud settings and startup connectivity check.
- `backend/src/config/storage.js` - Resolves/creates video storage directory and exports video size/storage config.

### `middleware`

- `backend/src/middleware/auth.js` - JWT/session auth middlewares (`authenticateJWT`, `authenticateSession`, `optionalAuth`) that hydrate `req.user`.
- `backend/src/middleware/roles.js` - Role checks (`hasRole`, `requireAdmin`, `requireRole`) via `user_roles` table.
- `backend/src/middleware/upload.js` - Multer config for raw video uploads, extension filter, size limit.
- `backend/src/middleware/audioUpload.js` - Multer config for separate audio track uploads into `storage/audio`.

### `utils`

- `backend/src/utils/jwt.js` - JWT sign/verify/decode helpers with production secret validation.
- `backend/src/utils/password.js` - Password hash/compare helpers using bcrypt.

### `controllers`

- `backend/src/controllers/authController.js` - Register/login/logout/profile/password + subscription validity checks.
- `backend/src/controllers/videoController.js` - Video/audio upload/serve/delete/list + external stream proxy + HLS manifest rewrite.
- `backend/src/controllers/titlesController.js` - Public title retrieval + admin CRUD for titles/seasons/episodes.
- `backend/src/controllers/watchlistController.js` - User watchlist get/add/remove endpoints.
- `backend/src/controllers/playbackController.js` - Movie/series playback progress read/write/delete endpoints.
- `backend/src/controllers/transactionsController.js` - Payment transaction create/list + admin approve/reject with subscription update transaction.
- `backend/src/controllers/adminController.js` - Admin user listing/role/subscription management + payment method settings update.
- `backend/src/controllers/adsController.js` - Ad settings CRUD, ad video CRUD, active ads fetch, impression tracking.
- `backend/src/controllers/categoriesController.js` - Category CRUD with slug conflict checks.
- `backend/src/controllers/ticketsController.js` - Ticket list/detail/create/update + threaded replies for user/admin support.
- `backend/src/controllers/pagesController.js` - Terms/privacy/help content fetch/create-default/update for CMS-like pages.
- `backend/src/controllers/cronController.js` - Subscription expiry job (downgrades expired paid plans to free).

### `routes`

- `backend/src/routes/auth.js` - Auth/profile/password/subscription-check routes.
- `backend/src/routes/videos.js` - Stream proxy, video/audio upload, serve, list, delete routes.
- `backend/src/routes/titles.js` - Public title fetch and admin title/season/episode management routes.
- `backend/src/routes/watchlist.js` - Authenticated watchlist routes.
- `backend/src/routes/playback.js` - Authenticated playback progress routes (combined + movie + series).
- `backend/src/routes/transactions.js` - Authenticated transaction routes plus admin approve/reject handlers.
- `backend/src/routes/admin.js` - Admin user/config management routes.
- `backend/src/routes/ads.js` - Public ad settings/active-ads/impression routes + admin ad management routes.
- `backend/src/routes/categories.js` - Public category read routes + admin category mutation routes.
- `backend/src/routes/tickets.js` - Authenticated support ticket/reply routes (admin for ticket status update).
- `backend/src/routes/pages.js` - Public page content read + admin page content edit/list.
- `backend/src/routes/config.js` - Public config payload (plans/payment methods/app metadata).
- `backend/src/routes/cron.js` - Secret-protected cron endpoint for subscription expiration.

### `migrations`

- `backend/src/migrations/runMigrations.js` - Executes SQL migration files in order with idempotent duplicate-safe behavior.
- `backend/src/migrations/seedAdmin.js` - Seeds default admin user/profile/role if missing.

### Root backend entry

- `backend/src/server.js` - App bootstrap (dotenv, CORS, helmet, sessions, healthcheck, route mounting, static frontend serving, error handlers, listen).

## 3) Frontend Index

### `api`

- `frontend/src/api/client.ts` - Dynamic API base URL resolver + typed fetch wrapper + token persistence + upload helper.

### `contexts`

- `frontend/src/contexts/AuthContext.tsx` - Context provider exposing auth state/actions from `useAuth`.
- `frontend/src/contexts/TitlesContext.tsx` - Context provider exposing titles catalog/query helpers from `useTitles`.

### `hooks`

- `frontend/src/hooks/useAuth.ts` - Login/register/logout/profile/password flow and auth bootstrap from stored token.
- `frontend/src/hooks/useTitles.ts` - Titles fetch/search/filter helpers + admin CRUD helper methods.
- `frontend/src/hooks/useWatchlist.ts` - Watchlist sync and mutation methods.
- `frontend/src/hooks/usePlaybackProgress.ts` - Continue-watching derivation and progress sync logic.
- `frontend/src/hooks/useTransactions.ts` - User payment submission and admin approve/reject transaction actions.
- `frontend/src/hooks/useAdSettings.ts` - Admin ad settings/video management plus active-ad fetch hook.
- `frontend/src/hooks/useAdminUsers.ts` - Admin user list + role/subscription/delete actions.
- `frontend/src/hooks/useCategories.ts` - Category fetch/create/update/delete helpers.
- `frontend/src/hooks/useTickets.ts` - Ticket list/detail/status update helper methods.
- `frontend/src/hooks/use-mobile.tsx` - Mobile breakpoint detection hook.
- `frontend/src/hooks/use-toast.ts` - Global toast state/reducer hook for notifications.

### `lib`

- `frontend/src/lib/utils.ts` - Shared class name merge helper (`cn`).
- `frontend/src/lib/sanitize.ts` - HTML sanitization helper for server-managed page content rendering.
- `frontend/src/lib/languageUtils.ts` - Language code-to-label mapping utilities for audio track UX.
- `frontend/src/lib/audioTrackUtils.ts` - Browser audio-track detection/switching/validation helpers.
- `frontend/src/lib/videoUrl.ts` - Cross-origin play URL proxying and HLS manifest rewriting to blob URLs.
- `frontend/src/lib/vastParser.ts` - VAST XML parsing/fetching/media selection and wrapper handling.
- `frontend/src/lib/vmapParser.ts` - VMAP XML parsing and resolution to scheduled ad breaks.
- `frontend/src/lib/adTracking.ts` - VAST tracking macro replacement/pixel firing/event tracker utilities.
- `frontend/src/lib/adProvider.ts` - Ad provider abstraction (web now, AdMob-ready shape later).

### `components` (non-UI)

- `frontend/src/components/Navbar.tsx` - Top navigation with auth-aware menus, search, and mobile nav.
- `frontend/src/components/Footer.tsx` - Site footer links and branding.
- `frontend/src/components/NavLink.tsx` - Compatibility wrapper around React Router `NavLink`.
- `frontend/src/components/HeroSlider.tsx` - Homepage featured carousel with quick actions.
- `frontend/src/components/FilterBar.tsx` - URL-query-driven content filtering/search/sort control.
- `frontend/src/components/TitleCard.tsx` - Poster card with play/resume, watchlist, and progress overlays.
- `frontend/src/components/TitleRow.tsx` - Horizontal row scroller for title collections.
- `frontend/src/components/VideoPlayer.tsx` - Core player (HLS/direct, controls, fullscreen, resume/progress persistence).
- `frontend/src/components/VideoPlayerWithAds.tsx` - Orchestrates content playback with pre/mid/post ad states and VAST/VMAP/custom ad sources.
- `frontend/src/components/AdPlayer.tsx` - Fullscreen ad playback component with skip/click/tracking behaviors.
- `frontend/src/components/admin/VideoUpload.tsx` - Admin uploader/URL picker for videos with format guidance and preview.
- `frontend/src/components/admin/AudioUpload.tsx` - Admin uploader for alternate audio tracks.
- `frontend/src/components/admin/AdsTab.tsx` - Admin ad management UI (source selection, tag testing, ad CRUD, timing config).

### `components/ui` (compressed)

- Mostly shadcn/radix UI primitives (`button`, `dialog`, `select`, `tabs`, `sheet`, etc.) as presentational infrastructure.
- Notable custom behavior:
  - `frontend/src/components/ui/sidebar.tsx` - Cookie-backed sidebar state persistence and `Ctrl/Cmd+B` keyboard toggle.
  - `frontend/src/components/ui/chart.tsx` - Chart theming/config context wrappers for Recharts.
- Toast plumbing appears in both `frontend/src/components/ui/use-toast.ts` and app-level `frontend/src/hooks/use-toast.ts`.

### `pages`

- `frontend/src/pages/Index.tsx` - Home page composing hero + curated rows + continue watching.
- `frontend/src/pages/Browse.tsx` - Search/filter/sort catalog page.
- `frontend/src/pages/TitleDetails.tsx` - Title detail, metadata, watch/resume CTA, and series episode browsing.
- `frontend/src/pages/Watch.tsx` - Watch session page: resume logic, episode routing, player mounting, progress-on-exit.
- `frontend/src/pages/Watchlist.tsx` - Watchlist and continue watching dashboard.
- `frontend/src/pages/Login.tsx` - Sign-in flow.
- `frontend/src/pages/Register.tsx` - Sign-up flow.
- `frontend/src/pages/Account.tsx` - Profile, password change, and subscription overview tabs.
- `frontend/src/pages/Subscription.tsx` - Plan selection + manual payment submission flow.
- `frontend/src/pages/HelpCenter.tsx` - Ticket creation/list page for user support.
- `frontend/src/pages/TicketDetail.tsx` - Ticket conversation thread/reply page.
- `frontend/src/pages/HelpPage.tsx` - Public Help CMS page renderer.
- `frontend/src/pages/Terms.tsx` - Public Terms page renderer.
- `frontend/src/pages/Privacy.tsx` - Public Privacy page renderer.
- `frontend/src/pages/Admin.tsx` - Admin panel tabs for content/users/payments/tickets/ads/settings/docs.
- `frontend/src/pages/APIDocs.tsx` - In-app API documentation explorer/exporter.
- `frontend/src/pages/NotFound.tsx` - 404 fallback page.

### Frontend app entry

- `frontend/src/main.tsx` - React mount bootstrap with top-level error fallback.
- `frontend/src/App.tsx` - Providers and SPA route table.
- `frontend/src/vite-env.d.ts` - Vite type references.

## 4) Key Runtime Flows

### Auth flow

1. UI calls `useAuth` (`/auth/login` or `/auth/register`) via `apiClient`.
2. Backend `authController` validates credentials, sets session, returns JWT + user profile.
3. Frontend stores token (`apiClient.setToken` -> localStorage), context marks authenticated.
4. Protected calls include `Authorization: Bearer ...`; backend middleware accepts JWT (or session fallback).
5. `GET /auth/me` hydrates current user roles/subscription state after reload.

### Browse/watch flow

1. Catalog pages use `useTitles` (`GET /titles`) and URL-driven filtering in UI.
2. Title details select movie or series episode paths and pass into watch routes.
3. Watch page resolves playable URL (`getPlayableVideoUrl`) and mounts `VideoPlayerWithAds`.
4. Player streams video (`/videos/:filename` or proxied external via `/videos/stream`) with HLS/direct support.
5. Progress posts to `/playback`; `usePlaybackProgress` builds Continue Watching and resume positions.
6. Watchlist actions hit `/watchlist` endpoints and reflect in cards/rows.

### Admin flow

1. Admin route guard uses roles from `useAuth`; non-admin users are redirected.
2. `Admin.tsx` composes tabs for title CRUD, users/roles/subscriptions, transaction moderation, categories, tickets, ads, and settings.
3. Mutations go through admin-protected endpoints (`authenticateJWT + requireAdmin`).
4. Refresh methods sync UI after each operation; tickets can poll for updates.

### Ads flow

1. Playback checks subscription (premium bypasses ads).
2. `useActiveAds` fetches `/ads/settings` + `/ads/videos/active`.
3. `VideoPlayerWithAds` selects ad source: custom ad videos, VAST tags, VMAP schedule, optional fallback.
4. `AdPlayer` runs ad media and fires tracking (`adTracking`) for impression/quartiles/click/complete/skip.
5. Backend records impression events via `/ads/impressions`.

## 5) Important Environment Variables

### Backend

- `NODE_ENV` - Production toggles in `backend/src/server.js`, `backend/src/utils/jwt.js`, `backend/src/config/database.js`.
- `PORT`, `HOST` - Server bind settings in `backend/src/server.js`.
- `CORS_ORIGINS`, `CORS_DEV_ORIGINS` - CORS allowlist in `backend/src/server.js`.
- `SESSION_SECRET` - Express-session secret in `backend/src/server.js`.
- `SERVE_FRONTEND` - Whether backend serves built frontend in `backend/src/server.js`.
- `JWT_SECRET`, `JWT_EXPIRES_IN` - JWT config in `backend/src/utils/jwt.js`.
- `CRON_SECRET` - Cron route protection in `backend/src/routes/cron.js`.
- `VIDEO_PROXY_ALLOWED_ORIGINS` - Stream proxy allowlist in `backend/src/controllers/videoController.js`.
- `VIDEO_STORAGE_PATH`, `MAX_VIDEO_SIZE` - Storage path and upload size in `backend/src/config/storage.js`.
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - DB config in `backend/src/config/database.js` and migration scripts.
- `DB_SSL`, `DB_SSL_CA` - DB SSL settings in `backend/src/config/database.js`.

### Frontend

- `VITE_API_URL` - API base URL override in `frontend/src/api/client.ts`.
