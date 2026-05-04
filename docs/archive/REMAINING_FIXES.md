# Remaining Issues to Fix

**Date:** October 13, 2025
**Priority:** High

## ✅ What's Already Fixed (Just Deployed)

1. **Payment & Subscription Status** - Users now see PRO badge after payment
2. **Payment Callback** - Users redirected to home page after successful payment
3. **Subscription Refresh** - Status updates automatically after payment
4. **Pricing Page** - Shows correct "Current Plan" for premium users

---

## 🚨 Critical Issues Still Remaining

### 1. Streaming Mode Missing (CRITICAL)

**Problem:** Chat responses are NOT streaming - users wait for complete response before seeing anything.

**Current Behavior:**
```typescript
// Line 536 in IndexPage.tsx
const response = await fetch(`${API_BASE_URL}/api/chat/`, { ... })
const data = await response.json()  // ❌ Waits for complete response
```

**Expected Behavior:**
- AI response should appear word-by-word (streaming)
- Backend already supports streaming (`stream=True` in chat/views.py)
- Frontend needs to implement SSE (Server-Sent Events) or read stream

**Impact:** Very poor UX - users think the app is frozen

**Fix Required:**
```typescript
// Need to implement streaming response reader
const reader = response.body.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break

  const chunk = decoder.decode(value)
  // Update message content incrementally
  setMessages(prev => ...)
}
```

**Time:** ~30 minutes
**Priority:** 🔴 CRITICAL

---

### 2. Document Auto-Generation Issue

**Problem:** AI might be adding `<<<GENERATE_DOCUMENT>>>` markers too frequently.

**Current Behavior:**
- Frontend correctly detects the marker and generates documents
- Backend system prompt might be instructing AI to always suggest documents
- Users see document generation even when they didn't request it

**Expected Behavior:**
- Documents should only be generated when user explicitly asks:
  - "შექმენი ხელშეკრულება" (Create a contract)
  - "დამიგენერირე განაცხადი" (Generate an application)
- Manual buttons (PDF/DOCX icons) should always work

**Backend Fix Required:**
Update the system prompt in `chat/views.py` (line 367-381):
```python
# Current prompt tells AI to generate docs
# Need to add: "ONLY suggest document generation if user EXPLICITLY requests it"
```

**Frontend Safeguard (Optional):**
Add detection for document keywords before triggering auto-generation.

**Time:** ~10 minutes (backend prompt update)
**Priority:** 🟡 MEDIUM

---

### 3. Georgian Translation Quality Issues

**Problem:** Translations contain Russian words and poor Georgian.

**Examples of Bad Translations:**
- Mixed Russian-Georgian words
- Unnatural phrasing
- Hypothetical/made-up words

**Files to Fix:**
- `src/core/helpers/geo.json` - All Georgian translations
- Any hardcoded Georgian text in components

**Fix Required:**
- Review all Georgian translations with native speaker
- Replace Russian-influenced words with pure Georgian
- Use natural, conversational Georgian

**Time:** ~1-2 hours (full review)
**Priority:** 🟡 MEDIUM

---

### 4. Chat History Sidebar Display Issues

**Problem:** Sidebar chat history has display/styling problems.

**Possible Issues:**
- Old chats not loading properly
- Styling broken or inconsistent
- Performance issues with many chats
- Search not working correctly

**Current Code:** `src/core/components/ChatHistory.tsx`

**Debug Logs Already Added:**
```typescript
console.log('📥 Fetching sessions from:', url)
console.log('📡 Sessions response:', { status, ok })
console.log('✅ Sessions loaded:', data.length, 'chats')
```

**Fix Required:**
- Test with multiple chats
- Check styling in dark/light mode
- Verify search functionality
- Ensure proper scrolling

**Time:** ~20-30 minutes
**Priority:** 🟢 LOW (UI polish)

---

## 📋 Summary

### Must Fix Today:
1. ✅ Payment/subscription status (DONE)
2. 🔴 Enable streaming mode
3. 🟡 Fix document auto-generation

### Can Fix Later:
4. 🟡 Georgian translation quality
5. 🟢 Chat history sidebar polish

---

## 🔧 Next Steps

### Immediate (Next 30 minutes):

**Step 1: Enable Streaming**
```bash
# Edit src/modules/home/views/IndexPage.tsx
# Replace fetch().json() with streaming reader
# Test with long AI responses
```

**Step 2: Update Backend Prompt**
```bash
# Edit backend chat/views.py line 367
# Add constraint: "Only suggest documents if explicitly requested"
# Deploy backend
```

**Step 3: Test Full Flow**
```bash
# 1. Make payment
# 2. Verify PRO badge appears
# 3. Send 5+ messages (verify no 3-message limit)
# 4. Ask for document (verify it generates)
# 5. Ask normal question (verify NO auto-document)
# 6. Check streaming works smoothly
```

---

## 🎯 Success Criteria

### Payment Flow (Already Working ✅):
- [x] User pays via Flitt
- [x] Redirected to /payment/success
- [x] PRO badge appears in dropdown
- [x] Can send unlimited messages
- [x] Pricing page shows "მიმდინარე გეგმა"

### Chat Experience (Needs Fixing 🔴):
- [ ] Streaming mode enabled
- [ ] Responses appear word-by-word
- [ ] No waiting for complete response
- [ ] Document generation only on request
- [ ] Georgian text quality high
- [ ] Chat history displays correctly

---

## 💾 Database Credentials (Waiting)

Still waiting for your colleague to provide:
```
DB_HOST=?
DB_NAME=?
DB_USER=?
DB_PASSWORD=?
```

Once received, I will:
1. Run RAG migrations
2. Index legal documents with matsne.gov.ge credentials
3. Test complete RAG system
4. Deploy to production

---

**Frontend fixes deployed! Backend RAG ready when DB credentials arrive.** 🚀
