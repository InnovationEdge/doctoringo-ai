# Firebase Analytics - Production Deployment Guide

## Firebase Configuration

Project: **knowhowai-5ccf5**
Account: KnowhowAIAssistant@gmail.com

## Environment Variables for Google Cloud Run

Add these environment variables to your Google Cloud Run service:

### Method 1: Using Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Cloud Run**
3. Select your frontend service (knowhow-ai-frontend)
4. Click **"Edit & Deploy New Revision"**
5. Under **"Variables & Secrets"** > **"Environment Variables"**, add:

```
REACT_APP_FIREBASE_API_KEY=AIzaSyAxCjkt33nKGJDBCgdPJ-tMKNQPM27gD3o
REACT_APP_FIREBASE_AUTH_DOMAIN=knowhowai-5ccf5.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=knowhowai-5ccf5
REACT_APP_FIREBASE_STORAGE_BUCKET=knowhowai-5ccf5.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=656836586331
REACT_APP_FIREBASE_APP_ID=1:656836586331:web:c1efeed4900d95e52e887e
REACT_APP_FIREBASE_MEASUREMENT_ID=G-7LGG85DRZS
```

6. Click **"Deploy"**

### Method 2: Using gcloud CLI

```bash
gcloud run services update knowhow-ai-frontend \
  --update-env-vars "REACT_APP_FIREBASE_API_KEY=AIzaSyAxCjkt33nKGJDBCgdPJ-tMKNQPM27gD3o,REACT_APP_FIREBASE_AUTH_DOMAIN=knowhowai-5ccf5.firebaseapp.com,REACT_APP_FIREBASE_PROJECT_ID=knowhowai-5ccf5,REACT_APP_FIREBASE_STORAGE_BUCKET=knowhowai-5ccf5.firebasestorage.app,REACT_APP_FIREBASE_MESSAGING_SENDER_ID=656836586331,REACT_APP_FIREBASE_APP_ID=1:656836586331:web:c1efeed4900d95e52e887e,REACT_APP_FIREBASE_MEASUREMENT_ID=G-7LGG85DRZS" \
  --region=us-central1
```

### Method 3: Update GitHub Actions Workflow

If using GitHub Actions for deployment, add these as GitHub Secrets:

1. Go to your GitHub repository
2. Settings > Secrets and variables > Actions
3. Add each variable as a secret:
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_MESSAGING_SENDER_ID`
   - `FIREBASE_APP_ID`
   - `FIREBASE_MEASUREMENT_ID`

4. Update `.github/workflows/deploy.yml` to pass these as build args:

```yaml
- name: Build and push Docker image
  env:
    REACT_APP_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
    REACT_APP_FIREBASE_AUTH_DOMAIN: ${{ secrets.FIREBASE_AUTH_DOMAIN }}
    REACT_APP_FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
    REACT_APP_FIREBASE_STORAGE_BUCKET: ${{ secrets.FIREBASE_STORAGE_BUCKET }}
    REACT_APP_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.FIREBASE_MESSAGING_SENDER_ID }}
    REACT_APP_FIREBASE_APP_ID: ${{ secrets.FIREBASE_APP_ID }}
    REACT_APP_FIREBASE_MEASUREMENT_ID: ${{ secrets.FIREBASE_MEASUREMENT_ID }}
```

## Verifying Firebase Analytics

### 1. Local Testing

```bash
npm start
# Open browser console, should see:
# 🔥 Firebase initialized successfully
# 📊 Firebase Analytics enabled
```

### 2. Production Testing

After deployment:
1. Visit https://knowhow.ge
2. Open browser DevTools Console
3. Look for Firebase initialization messages
4. Perform actions (login, send message, etc.)
5. Check for event tracking logs

### 3. View Analytics Dashboard

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select **knowhowai-5ccf5** project
3. Click **Analytics** > **Dashboard**
4. You should see real-time users and events

**Note:** Initial data may take 24-48 hours to appear in reports, but real-time view is instant.

## What's Being Tracked

### User Events
- `login` - User authentication
- `logout` - User sign out
- User properties: email, subscription_status, is_european

### Chat Events
- `chat_message_sent` - User sends message
- `chat_response_received` - AI responds (tracks response time)
- `new_chat_session` - New conversation started
- `file_uploaded` - File attached to chat

### Document Events
- `document_generated` - Document created (tracks success/failure)
- `document_downloaded` - Document downloaded by user

### Navigation Events
- `page_view` - Automatic on all page changes
- `view_pricing` - Pricing page visited

## Troubleshooting

### Firebase not initializing
- Check environment variables are set correctly
- Verify Firebase config in browser console
- Check network tab for Firebase API calls

### Events not appearing in dashboard
- Wait 24-48 hours for initial data
- Check real-time view for immediate verification
- Verify measurement ID is correct

### Analytics blocked by ad blockers
- This is expected behavior
- Analytics will work for most users
- Ad blocker users won't be tracked (privacy-friendly)

## Security Notes

- API key is safe to expose in frontend code
- Firebase security rules control data access
- Analytics data is automatically anonymized
- No PII is tracked without user consent

## Support

For issues:
1. Check Firebase Console for errors
2. Review browser console logs
3. Verify environment variables
4. Check GitHub Actions deployment logs
