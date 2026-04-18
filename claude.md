# KnowHow AI — Frontend Development Guide

## Tech Stack
- **Framework**: React 18.3 + TypeScript 5.4
- **Build**: Vite 6.4
- **Styling**: Tailwind CSS 3.4 (no Ant Design — fully custom components)
- **Animations**: motion/react (framer-motion)
- **Icons**: lucide-react
- **Markdown**: react-markdown + remark-gfm
- **Deployment**: Vercel (primary) + Google Cloud Run (legacy)
- **Analytics**: Firebase

## Project Structure
```
src/
├── components/          # Shared UI components
│   ├── ChatArea.tsx      # Main chat interface (landing + active chat)
│   ├── ChatMessage.tsx   # Message rendering with dynamic font
│   ├── SettingsModal.tsx  # Full settings (9 tabs, ~1700 lines)
│   ├── PlansPage.tsx     # Pricing page (3 plans, 3 languages)
│   ├── OwlLogo.tsx       # Animated brand logo
│   └── ...
├── core/
│   ├── helpers/          # Translations: geo.json, eng.json, rus.json
│   ├── types.ts          # LanguageType enum (GEO=1, ENG=2, RUS=3)
│   └── utils/
├── modules/
│   ├── payment/views/    # CheckoutPage, PaymentSuccess
│   └── ...
├── providers/
│   ├── AuthProvider.tsx       # Auth context + Google OAuth
│   ├── ThemeContext.tsx        # Dark/light mode
│   ├── TranslationProvider.tsx # i18n (ka-GE, en-US, ru-RU)
│   └── SessionProvider.tsx    # Chat session management
├── lib/
│   └── api.ts            # API client (authApi, chatApi, paymentApi)
└── App.tsx               # Routes, modals, global providers
```

## Design Tokens
- **Accent**: `#d48e6c`
- **Background light**: `#fcfcf9` / dark: `#171717`
- **Cards**: `rounded-[28px]`, border `#e5e5e0` / dark `#2d2d2d`
- **Headings**: `font-serif` (Playfair Display)
- **Body**: `font-sans` (SF Pro Display)
- **Sections**: `py-20 md:py-32 px-6 md:px-12 xl:px-32`, `max-w-[1200px] mx-auto`

## Development Rules

### Code Style
- Georgian language in UI copy, English in code
- All translations in 3 files: `geo.json`, `eng.json`, `rus.json` — always update all 3
- Use `translate('key', 'fallback')` from TranslationProvider
- Use `motion/react` (not `framer-motion`) for animations
- Icons from `lucide-react` only
- No Ant Design — all components are custom Tailwind

### Component Patterns
- ChatArea.tsx has **two copies** of landing input (normal + incognito) — use `replace_all: true` when editing
- SettingsModal uses dual persistence: profile fields → API, toggle fields → localStorage
- Font preference: saved to `knowhow_chat_font` in localStorage, dispatches `knowhow-font-change` event
- PlansPage accepts `language` prop from App.tsx mapped from TranslationProvider

### Consistency Rules
- Back buttons: icon-only ArrowLeft, `p-2 rounded-xl`, positioned top-left
- Input widget: identical dimensions on landing and active chat
- CTA buttons: single line with horizontal scroll, no wrapping
- All modals: consistent close button style

### What NOT to Do
- Don't use Ant Design components or import from 'antd'
- Don't add npm packages without discussion
- Don't hardcode colors — use design tokens above
- Don't create separate CSS files — Tailwind classes only
- Don't mix languages in translation values

## Deployment

### Production
- **Primary**: Vercel (auto-deploy on git push to main)
- **URL**: https://knowhow.ge
- **Build**: `npm run build` (Vite)

### Google Cloud Run (legacy, frontend also deployed here)
- **Project**: knowhowai
- **Region**: europe-west3
- **Config**: 1 CPU, 256Mi RAM, maxScale 3, gen1

### GCP Cost Optimization Rules
- **ALWAYS** clear old tagged revisions after deploys: `gcloud run services update-traffic <service> --clear-tags`
- **ALWAYS** delete old revisions (keep latest 3-5): `gcloud run revisions delete <rev> --quiet`
- Frontend has NO minScale (scales to 0) — this is correct, don't change
- Backend has minScale=1 with cpu-throttling=true — keeps one warm instance but only bills CPU during requests
- Never set `cpu-throttling: false` on any service — it bills 24/7

## API Integration
- Backend: `https://api.knowhow.ge` (Django + DRF)
- Auth: Google OAuth via Django, session-based with CSRF
- Chat: SSE streaming for real-time responses
- Payment: Flitt (Georgian gateway) via `paymentApi`

## Key Files for Common Tasks
| Task | File(s) |
|------|---------|
| Chat UI & input | `ChatArea.tsx` |
| Message rendering | `ChatMessage.tsx` |
| Settings | `SettingsModal.tsx` |
| Pricing page | `PlansPage.tsx` |
| Checkout | `modules/payment/views/CheckoutPage.tsx` |
| API calls | `lib/api.ts` |
| Translations | `core/helpers/{geo,eng,rus}.json` |
| Routes | `App.tsx` |
| Auth | `providers/AuthProvider.tsx` |
| Theme | `providers/ThemeContext.tsx` |

---
*Last Updated: 2026-03-12*
