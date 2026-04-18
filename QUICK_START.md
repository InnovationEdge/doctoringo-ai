# Quick Start Guide

## 🚀 Get Running in 3 Minutes

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.local.example .env.local

# 3. Start dev server
npm start

# 4. Open browser
# Main app: http://localhost:4000
# Debug page: http://localhost:4000/debug
```

## 🔑 Key Files You Need to Know

### API Client
- **`src/lib/api.ts`** - Use `api.get()`, `api.post()`, etc. for all API calls
- Automatically handles CSRF tokens and cookies

### Authentication
- **`src/lib/auth.ts`** - Use `signInWithGoogle()`, `getCurrentUser()`, etc.
- Handles OAuth flow and session management

### Environment
- **`.env.local`** - Local dev config (points to production API)
- **`.env`** - Production config (relative paths)

## 🧪 Testing Your Setup

### Quick Test (30 seconds)

1. Visit http://localhost:4000/debug
2. Click "GET /health" → Should show green success
3. Click "Redirect to Google Login" → Complete OAuth
4. Click "GET /api/csrf/" → Should show CSRF token set
5. Click "GET /api/user/" → Should show your profile

### If Something Breaks

**CORS errors?**
- Check webpack proxy is running (restart dev server)
- Verify `.env.local` exists

**Auth not working?**
- Clear cookies and try again
- Check that you completed OAuth flow
- Call CSRF endpoint after OAuth

**API calls failing?**
- Open Network panel in browser
- Check if backend is up: https://api.knowhow.ge/health/
- Verify environment variables are loaded

## 📝 Common Tasks

### Make an API Call

```typescript
import { api } from 'src/lib/api';

// GET request
const sessions = await api.get('/sessions/');

// POST request (CSRF token added automatically)
const newSession = await api.post('/sessions/', {
  title: 'My Session'
});
```

### Check Authentication

```typescript
import { getCurrentUser, isAuthenticated } from 'src/lib/auth';

const user = await getCurrentUser();
const authed = await isAuthenticated();
```

### Handle Errors

```typescript
try {
  await api.post('/chat/', { sessionId, message });
} catch (error) {
  if (error.response?.status === 402) {
    // Show subscription modal
  } else if (error.response?.status === 429) {
    // Show rate limit message
  }
}
```

## 🎯 Project Structure

```
src/
├── lib/
│   ├── api.ts          ← Use this for API calls
│   └── auth.ts         ← Use this for authentication
├── modules/
│   ├── home/           ← Main chat UI
│   ├── debug/          ← Testing page
│   └── auth/           ← Login/signup pages
└── components/         ← Reusable UI components
```

## ⚙️ Environment Variables

**Local Dev (`.env.local`):**
```bash
NEXT_PUBLIC_API_BASE=https://api.knowhow.ge/api
NEXT_PUBLIC_PAYMENT_BASE=https://api.knowhow.ge/api/payment
NEXT_PUBLIC_ACCOUNTS_BASE=https://api.knowhow.ge/accounts
NEXT_PUBLIC_HEALTH_PATH=https://api.knowhow.ge/health
```

**Production (`.env`):**
```bash
NEXT_PUBLIC_API_BASE=/api
NEXT_PUBLIC_PAYMENT_BASE=/api/payment
NEXT_PUBLIC_ACCOUNTS_BASE=/accounts
NEXT_PUBLIC_HEALTH_PATH=/health
```

## 🔧 Useful Commands

```bash
npm start          # Start dev server (port 4000)
npm run build      # Build for production
npm run ts         # Type check
npm run check-all  # Lint + type check
```

## 📚 Learn More

- Full docs: See [README.md](README.md)
- Integration details: See [INTEGRATION_SUMMARY.md](INTEGRATION_SUMMARY.md)
- Backend API: https://api.knowhow.ge

## 🆘 Help

**Still stuck?**
1. Check browser console for errors
2. Open Network panel and look for failed requests
3. Use `/debug` page to test each endpoint individually
4. Read the troubleshooting section in README.md

---

**Happy coding! 🎉**
