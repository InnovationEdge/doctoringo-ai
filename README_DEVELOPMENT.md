# KnowHow AI - Development Guide

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run TypeScript check
npm run ts

# Lint code
npm run check-all
```

## 📁 Project Structure

```
src/
├── api/                    # API integration layer
│   ├── auth.ts            # Authentication API
│   ├── documents/         # Documents API
│   ├── payment/           # Payment API
│   └── errorHandler.ts    # Global error handling
├── assets/                # Static assets
│   ├── css/              # Global styles
│   └── media/            # Images, icons, SVGs
├── core/                  # Core components
│   ├── components/       # Reusable components
│   ├── helpers/          # Utility functions
│   └── types/            # TypeScript types
├── layouts/              # Layout components
│   ├── Layout.tsx        # Main layout wrapper
│   ├── AppHeader.tsx     # Header component
│   └── AppSider.tsx      # Sidebar component
├── modules/              # Feature modules
│   ├── auth/            # Authentication
│   ├── home/            # Chat interface
│   ├── documents/       # Document management
│   ├── pricing/         # Pricing plans
│   └── menu/            # Menu components
├── providers/            # React context providers
│   ├── AuthProvider.tsx      # Authentication state
│   ├── ThemeContext.tsx      # Dark/Light theme
│   └── TranslationProvider.tsx # i18n
├── hooks/               # Custom React hooks
└── App.tsx             # Root component
```

## 🎨 Key Features

### 1. **Multilingual Support**
- Uses `TranslationProvider` for all text
- Default language: Georgian
- Easy to add new languages

```typescript
const { translate } = useTranslation()
translate('key', 'defaultValue')
```

### 2. **Dark Mode**
- Automatic theme detection
- User can toggle light/dark theme
- All components support dark mode

```typescript
const { isDarkMode, toggleTheme } = useTheme()
```

### 3. **Authentication**
- Session-based authentication
- Auto-logout on session expiration
- Protected routes

```typescript
const { isAuthenticated, user, logout } = useAuth()
```

### 4. **Chat Interface**
- Real-time typewriter effect
- Session management
- Message history
- Search functionality

### 5. **Document Generation**
- Automatic link detection
- Beautiful download UI
- PDF and DOCX support
- Management interface

### 6. **Payment Integration**
- Multiple pricing plans
- Subscription management
- Payment history
- European/Georgian pricing

## 🔧 Development Guidelines

### Component Structure

```typescript
import { useState, useEffect } from 'react'
import { useTranslation } from 'src/providers/TranslationProvider'
import { useTheme } from 'src/providers/ThemeContext'

const MyComponent = () => {
  const { translate } = useTranslation()
  const { isDarkMode } = useTheme()
  const [data, setData] = useState()

  useEffect(() => {
    // Component logic
  }, [])

  return (
    <div style={{
      backgroundColor: isDarkMode ? '#000' : '#fff'
    }}>
      {translate('key', 'Default Text')}
    </div>
  )
}

export default MyComponent
```

### API Integration

```typescript
import { handleApiError } from 'src/api/errorHandler'

const fetchData = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/endpoint/`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    })

    if (!response.ok) {
      await handleApiError(response) // Handles 401, session expiry, etc.
    }

    return await response.json()
  } catch (error) {
    console.error('Error:', error)
    message.error('Error message in Georgian')
  }
}
```

### Styling Best Practices

1. **Use Ant Design components**
2. **Support dark mode** with conditional styles
3. **Use CSS classes** from `assets/css/`
4. **Mobile-first** responsive design

```typescript
<Card
  style={{
    backgroundColor: isDarkMode ? '#141414' : '#fff',
    padding: isMobile ? '16px' : '24px'
  }}
>
  Content
</Card>
```

## 🌍 Adding Translations

Edit translation provider or add new translation keys:

```typescript
// In component
translate('new_key', 'ახალი ტექსტი')

// The system will:
// 1. Look for translation key
// 2. Fall back to default value
// 3. Cache for performance
```

## 🎯 Common Tasks

### Adding a New Page

1. Create module folder: `src/modules/mypage/`
2. Create views: `src/modules/mypage/views/IndexPage.tsx`
3. Create routes: `src/modules/mypage/routes.ts`
4. Add to routing in `App.tsx`

### Adding a New API Endpoint

1. Create/update API file in `src/api/`
2. Add TypeScript interfaces
3. Implement API method
4. Use `handleApiError` for error handling

### Updating Styles

1. Global styles: `src/assets/css/style.scss`
2. Component-specific: inline styles with theme support
3. Ant Design theme: `App.tsx` ConfigProvider

## 🐛 Debugging

### Check API Calls
```bash
# Terminal
./test-backend.sh

# Browser DevTools
F12 → Network tab → Filter by "api"
```

### Check Authentication
```typescript
// In component
console.log('Auth:', useAuth())
```

### Check Theme
```typescript
// In component
console.log('Dark mode:', isDarkMode)
```

## 📦 Building for Production

```bash
# Create production build
npm run build

# Output: dist/ folder
# Contains optimized HTML, CSS, JS
```

## 🔐 Environment Variables

Required `.env` file:

```bash
REACT_APP_API_BASE_URL=https://api.knowhow.ge
```

## 🧪 Testing Backend Integration

```bash
# Run automated tests
./test-backend.sh

# Manual test with curl
curl https://api.knowhow.ge/api/user/
```

## 📚 Documentation Files

- `BACKEND_INTEGRATION_GUIDE.md` - Backend integration guide
- `BACKEND_CHECKLIST.md` - Backend endpoint checklist
- `FINAL_STATUS.md` - Current project status
- `STATUS_REPORT.md` - Detailed status report

## 🎨 Design System

### Colors
- Primary Blue: `#1890ff`
- Success Green: `#52c41a`
- Error Red: `#ff4d4f`
- Dark Background: `#141414`
- Light Background: `#ffffff`

### Typography
- Headings: Ant Design Title components
- Body: 14-15px
- Small: 12-13px

### Spacing
- Mobile: 12px, 16px
- Desktop: 16px, 24px
- Large: 32px, 48px

### Borders
- Small radius: 8px
- Medium radius: 12px
- Large radius: 35px (pill shape)

## 🚀 Performance Tips

1. **Lazy load** heavy components
2. **Memoize** expensive calculations
3. **Use React.memo** for pure components
4. **Optimize images** before adding
5. **Code split** by route

## 🔒 Security Best Practices

1. **Never commit** .env files
2. **Always use** CSRF tokens for POST
3. **Sanitize** user input
4. **Use** credentials: 'include' for cookies
5. **Handle** session expiry properly

## 📱 Mobile Responsiveness

All components must work on:
- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+

Use `useMobile()` hook:

```typescript
const isMobile = useMobile()

<div style={{ padding: isMobile ? '12px' : '24px' }}>
```

## 🎯 Next Steps for New Developers

1. Read this README
2. Check `FINAL_STATUS.md` for current state
3. Run `npm install && npm start`
4. Open DevTools and explore
5. Check `BACKEND_CHECKLIST.md` for API status
6. Make a small change and test
7. Read component code to understand patterns

## 💡 Pro Tips

1. **Always test** in both themes
2. **Always test** on mobile
3. **Always use** translate() for text
4. **Always handle** loading states
5. **Always handle** error states
6. **Check DevTools** Network tab when debugging APIs
7. **Use git** branches for features
8. **Keep commits** focused and descriptive

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Commit with descriptive message
5. Push and create PR

## 📞 Support

For issues or questions:
- Check documentation files
- Review existing code
- Test with `test-backend.sh`
- Check browser DevTools

---

**Last Updated:** 2025-10-09
**Status:** Production Ready ✅
