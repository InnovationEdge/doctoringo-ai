# KnowHow AI Frontend - Backend Integration Summary

## What Was Fixed

This document summarizes the changes made to integrate the frontend with the Django backend at `https://api.knowhow.ge`.

## Files Created

### 1. Environment Configuration

**`.env.local.example`** - Example environment file for local development
- Points to production API directly: `https://api.knowhow.ge/api`
- Includes all necessary environment variables
- Copy to `.env.local` to use

**`.env`** - Production environment file
- Uses relative paths (`/api`, `/accounts`, `/health`)
- For production deployment where FE and BE are under same domain

### 2. API Client Layer

**`src/lib/api.ts`** - Centralized axios client
- Base URL from environment variables
- `withCredentials: true` for cookie-based auth
- CSRF token interceptor (reads from cookie, adds to headers)
- Separate `paymentApi` client for payment endpoints
- `csrfHandshake()` helper function
- `checkHealth()` helper function
- Error handling for 402, 429, 403 status codes

**`src/lib/auth.ts`** - Authentication helpers
- `signInWithGoogle()` - Redirects to OAuth
- `signOut()` - Logs out and clears session
- `afterOAuth()` - Completes OAuth flow (CSRF + user fetch)
- `getCurrentUser()` - Gets current user profile
- `isAuthenticated()` - Checks auth status

### 3. Debug Tools

**`src/modules/debug/DebugPage.tsx`** - Internal testing page
- Health check button
- OAuth redirect button
- CSRF handshake test
- User profile fetch
- Session CRUD operations
- Chat message test
- Visual feedback for all operations
- Accessible at `/debug`

**`src/modules/debug/routes.ts`** - Debug route configuration
- Registers `/debug` route
- Marked as public (no auth required)

## Files Modified

### 1. Webpack Configuration

**`webpack.dev.ts`**
- Fixed require path: `./webpack.common.ts` (was `../knowhowai/webpack.common.ts`)
- Added proxy configuration for `/api`, `/accounts`, `/health`
- Proxies to `https://api.knowhow.ge` to avoid CORS
- Cookie modification for local dev (removes Secure, changes SameSite)

### 2. API Layer Updates

**`src/api/requests.ts`**
- Updated `baseURL` to use environment variables
- Fallback chain: `API_BASE_URL` → `NEXT_PUBLIC_API_BASE` → `/api`

**`src/api/privateRequest.ts`**
- Updated `baseURL` to use environment variables
- Same fallback chain as above

**`src/modules/home/views/IndexPage.tsx`**
- Updated `API_BASE_URL` constant to use environment variable
- Changed from hardcoded `/api` to `process.env.NEXT_PUBLIC_API_BASE || '/api'`

### 3. Documentation

**`README.md`**
- Complete rewrite with:
  - Project overview and tech stack
  - Installation instructions
  - API integration details
  - Authentication flow explanation
  - Comprehensive acceptance tests
  - Browser testing steps
  - Troubleshooting guide
  - Production deployment notes

## How It Works

### Local Development Flow

1. Developer runs `npm start`
2. Webpack dev server starts on `http://localhost:4000`
3. Frontend makes requests to `/api`, `/accounts`, `/health`
4. Webpack proxy forwards to `https://api.knowhow.ge`
5. Cookies are modified to work with localhost (no Secure flag)
6. CSRF token is automatically added to mutating requests

### Production Flow

1. Build with `npm run build`
2. Deploy static files to CDN/server
3. Configure nginx to proxy API requests
4. Frontend uses relative paths (`/api`, `/accounts`, `/health`)
5. All requests go through same domain (no CORS issues)

### Authentication Flow

1. User visits app
2. Clicks "Sign in with Google"
3. Redirects to `/accounts/google/login/` (Django Allauth)
4. User completes OAuth with Google
5. Redirected back to app
6. App calls `GET /api/csrf/` to get CSRF token
7. App calls `GET /api/user/` to get user profile
8. Session cookie is set, user is authenticated

### CSRF Protection

All POST/PUT/PATCH/DELETE requests automatically include:
- Header: `X-CSRFToken: <token_from_cookie>`
- Cookie: `csrftoken=<token>`

This is handled transparently by the axios interceptor.

## Environment Variables Reference

| Variable | Local Dev | Production | Description |
|----------|-----------|------------|-------------|
| `NEXT_PUBLIC_API_BASE` | `https://api.knowhow.ge/api` | `/api` | Main API base URL |
| `NEXT_PUBLIC_PAYMENT_BASE` | `https://api.knowhow.ge/api/payment` | `/api/payment` | Payment API base URL |
| `NEXT_PUBLIC_ACCOUNTS_BASE` | `https://api.knowhow.ge/accounts` | `/accounts` | Auth endpoints base URL |
| `NEXT_PUBLIC_HEALTH_PATH` | `https://api.knowhow.ge/health` | `/health` | Health check endpoint |
| `API_BASE_URL` | `https://api.knowhow.ge/api` | `/api` | Legacy support |

## Testing Checklist

### Backend Connectivity
- [ ] `curl -I https://api.knowhow.ge/health/` returns 200
- [ ] `curl -I https://api.knowhow.ge/api/csrf/` returns 200 with CSRF cookie

### Browser Tests (http://localhost:4000/debug)
- [ ] Health check works
- [ ] Google OAuth redirect works
- [ ] After OAuth, CSRF handshake succeeds
- [ ] User profile loads
- [ ] Can create session
- [ ] Can list sessions
- [ ] Can send chat message (or get appropriate error)

### Network Panel Checks
- [ ] No CORS errors
- [ ] No `/api/api` double prefix
- [ ] POST requests include `X-CSRFToken` header
- [ ] Requests include session cookies
- [ ] Responses set cookies correctly

## Error Handling

The app properly handles:

- **402 Payment Required** - User needs subscription
- **429 Rate Limit** - Free tier limit exceeded
- **400 Validation** - Message not Georgian or not legal topic
- **401/403 Unauthorized** - Not authenticated or CSRF failure
- **500 Server Error** - Backend issue

## Next Steps

1. Copy `.env.local.example` to `.env.local`
2. Install dependencies: `npm install`
3. Start dev server: `npm start`
4. Open http://localhost:4000/debug
5. Test all functionality
6. Check browser console and network panel
7. Verify no errors

## Production Deployment Checklist

- [ ] Build with `npm run build`
- [ ] Use `.env` with relative paths
- [ ] Configure nginx to proxy `/api`, `/accounts`, `/health`
- [ ] Enable HTTPS
- [ ] Set proper CORS headers on backend
- [ ] Configure Django CSRF_TRUSTED_ORIGINS
- [ ] Test OAuth redirect URLs
- [ ] Verify cookies work across domains
- [ ] Remove or protect `/debug` route

## Support

For issues:
1. Check the README troubleshooting section
2. Use `/debug` page to isolate the problem
3. Check browser console and network panel
4. Verify environment variables are set correctly
5. Confirm backend is accessible

---

**Generated:** 2025-10-04
**Backend API:** https://api.knowhow.ge
**Frontend Repo:** https://github.com/knowhowaiassistant/knowhow-ai-frontend
