# KnowHow AI - API Documentation

## Base URL
- **Production**: `https://api.knowhow.ge`
- **Development**: `http://localhost:8000`

## Authentication

ყველა API endpoint (გარდა public-ისა) მოითხოვს session-based authentication-ს.

### CSRF Token
ნებისმიერი mutation (POST, PUT, DELETE, PATCH) მოითხოვს CSRF token-ს.

```javascript
// Get CSRF token from cookie
const csrfToken = document.cookie
  .split(';')
  .find(c => c.trim().startsWith('csrftoken='))
  ?.split('=')[1];

// Include in request headers
headers: {
  'X-CSRFToken': csrfToken,
  'Content-Type': 'application/json'
}
```

---

## Authentication API

### Initialize CSRF Token
აბრუნებს CSRF cookie-ს. გამოიყენეთ აპლიკაციის ჩატვირთვისას.

```
GET /api/csrf/
```

**Response** `200 OK`
```json
{
  "success": "CSRF cookie set"
}
```

---

### Get Current User
აბრუნებს მიმდინარე მომხმარებლის ინფორმაციას.

```
GET /api/user/
```

**Response** `200 OK`
```json
{
  "id": 1,
  "username": "user@example.com",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "jurisdiction": "GE",
  "role": "lawyer",
  "domains": ["corporate", "tax"],
  "date_joined": "2024-01-15T10:30:00Z"
}
```

**Error** `403 Forbidden` - Not authenticated

---

### Update User Profile
განაახლებს მომხმარებლის პროფილს.

```
PATCH /api/user/
```

**Request Body**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "jurisdiction": "GE",
  "role": "lawyer",
  "domains": ["corporate", "tax", "labor"]
}
```

**Response** `200 OK`
```json
{
  "id": 1,
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "jurisdiction": "GE",
  "role": "lawyer",
  "domains": ["corporate", "tax", "labor"]
}
```

---

### Login with Google
გადამისამართება Google OAuth-ზე.

```
GET /accounts/google/login/
```

წარმატებული ავტორიზაციის შემდეგ redirect ხდება `LOGIN_REDIRECT_URL`-ზე.

---

### Logout
გამოსვლა სისტემიდან.

```
POST /accounts/logout/
```

**Response** `200 OK`

---

### Export User Data (GDPR)
ექსპორტი ყველა მომხმარებლის მონაცემის JSON ფორმატში.

```
GET /api/user/export/
```

**Response** `200 OK`
```json
{
  "export_date": "2024-01-20T15:30:00Z",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "date_joined": "2024-01-15T10:30:00Z"
  },
  "chat_sessions": [
    {
      "id": "uuid",
      "title": "Tax Question",
      "created_at": "2024-01-18T09:00:00Z",
      "messages": [
        {"role": "user", "content": "...", "timestamp": "..."},
        {"role": "assistant", "content": "...", "timestamp": "..."}
      ]
    }
  ],
  "documents": [],
  "uploaded_files": [],
  "subscription": {
    "status": "active",
    "plan_name": "Premium",
    "current_period_end": "2024-02-15T00:00:00Z"
  },
  "payments": []
}
```

---

### Logout from All Devices
გამოსვლა ყველა მოწყობილობიდან (გარდა მიმდინარისა).

```
POST /api/sessions/logout-all/
```

**Response** `200 OK`
```json
{
  "success": true,
  "message": "Successfully logged out from 2 other device(s)",
  "sessions_terminated": 2
}
```

---

### Get Active Sessions
აბრუნებს აქტიური სესიების სიას.

```
GET /api/sessions/active/
```

**Response** `200 OK`
```json
{
  "success": true,
  "sessions": [
    {
      "session_key": "abc12345...",
      "is_current": true,
      "expire_date": "2024-01-27T15:30:00Z",
      "device": "Unknown Device",
      "location": "Unknown Location"
    }
  ],
  "total_count": 1
}
```

---

## Chat API

### List Chat Sessions
აბრუნებს მომხმარებლის ჩატის სესიების სიას.

```
GET /api/sessions/
```

**Query Parameters**
- `q` - Search query (optional)

**Response** `200 OK`
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "საგადასახადო კითხვა",
    "created_at": "2024-01-18T09:00:00Z",
    "updated_at": "2024-01-18T10:30:00Z",
    "message_count": 5
  }
]
```

---

### Create Chat Session
ქმნის ახალ ჩატის სესიას.

```
POST /api/sessions/
```

**Request Body**
```json
{
  "title": "New Chat"
}
```

**Response** `201 Created`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "New Chat",
  "created_at": "2024-01-20T12:00:00Z"
}
```

---

### Get Chat Session
აბრუნებს კონკრეტული სესიის დეტალებს.

```
GET /api/sessions/{session_id}/
```

**Response** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "საგადასახადო კითხვა",
  "created_at": "2024-01-18T09:00:00Z",
  "updated_at": "2024-01-18T10:30:00Z"
}
```

---

### Update Chat Session (Rename)
ცვლის სესიის სათაურს.

```
PATCH /api/sessions/{session_id}/
```

**Request Body**
```json
{
  "title": "New Title"
}
```

**Response** `200 OK`

---

### Delete Chat Session
შლის ჩატის სესიას.

```
DELETE /api/sessions/{session_id}/
```

**Response** `204 No Content`

---

### Get Chat History
აბრუნებს სესიის მესიჯების ისტორიას.

```
GET /api/history/{session_id}/
```

**Response** `200 OK`
```json
{
  "messages": [
    {
      "id": "msg-uuid-1",
      "role": "user",
      "content": "რა არის დღგ?",
      "timestamp": "2024-01-18T09:00:00Z"
    },
    {
      "id": "msg-uuid-2",
      "role": "assistant",
      "content": "დამატებული ღირებულების გადასახადი (დღგ) არის...",
      "thought": "მომხმარებელი ეკითხება საქართველოს საგადასახადო კოდექსის შესახებ...",
      "timestamp": "2024-01-18T09:00:15Z"
    }
  ]
}
```

---

### Send Chat Message (Streaming)
გზავნის მესიჯს და იღებს AI პასუხს streaming-ით.

```
POST /api/chat/
```

**Request Headers**
```
Accept: text/event-stream
Content-Type: application/json
X-CSRFToken: {csrf_token}
```

**Request Body**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "რა არის დღგ-ს განაკვეთი საქართველოში?",
  "model_tier": "premium",
  "country_code": "GE",
  "file_id": null,
  "stream": true
}
```

**Response** `200 OK` (Server-Sent Events)
```
data: {"thinking": "მომხმარებელი ეკითხება საქართველოს დღგ-ს შესახებ..."}

data: {"thinking": "საქართველოს საგადასახადო კოდექსის მიხედვით..."}

data: {"content": "საქართველოში დამატებული ღირებულების გადასახადის (დღგ) "}

data: {"content": "სტანდარტული განაკვეთი შეადგენს **18%**-ს."}

data: {"done": true, "session_id": "550e8400-e29b-41d4-a716-446655440000"}
```

**Model Tiers**
- `premium` - Gemini 2.0 Flash Thinking (with reasoning)
- `standard` - Gemini 2.5 Flash (fast)

---

### Upload File
ატვირთავს ფაილს ანალიზისთვის.

```
POST /api/upload/
```

**Request** (multipart/form-data)
- `file` - File to upload
- `session_id` - Chat session ID (optional)

**Response** `201 Created`
```json
{
  "id": "file-uuid",
  "filename": "contract.pdf",
  "file_type": "pdf",
  "file_size": 125000,
  "preview": "First 500 characters of extracted text..."
}
```

**Supported Formats**: PDF, DOCX, TXT, MD

---

## Payment API

### Get Subscription Status
აბრუნებს სუბსკრიფციის სტატუსს.

```
GET /api/payment/subscription/
```

**Response** `200 OK`
```json
{
  "status": "active",
  "plan_name": "Premium",
  "current_period_start": "2024-01-15T00:00:00Z",
  "current_period_end": "2024-02-15T00:00:00Z",
  "auto_renew": true,
  "premium_questions_used": 3,
  "premium_questions_limit": 10,
  "has_saved_payment_method": true
}
```

**Status Values**: `active`, `cancelled`, `expired`, `free`

---

### Create Payment
იწყებს გადახდის პროცესს.

```
POST /api/payment/create/
```

**Request Body**
```json
{
  "auto_renew": true,
  "save_payment_method": true
}
```

**Response** `200 OK`
```json
{
  "success": true,
  "redirect_url": "https://pay.flitt.com/...",
  "order_id": "order-123"
}
```

---

### Get Payment History
აბრუნებს გადახდების ისტორიას.

```
GET /api/payment/history/
```

**Response** `200 OK`
```json
[
  {
    "id": 1,
    "amount": 15.00,
    "currency": "GEL",
    "status": "completed",
    "created_at": "2024-01-15T10:00:00Z"
  }
]
```

---

### Cancel Subscription
აუქმებს სუბსკრიფციის ავტო-განახლებას.

```
POST /api/payment/subscription/cancel/
```

**Response** `200 OK`
```json
{
  "success": true,
  "message": "Subscription will not renew after current period",
  "current_period_end": "2024-02-15T00:00:00Z"
}
```

---

### Reactivate Subscription
ააქტიურებს გაუქმებულ სუბსკრიფციას.

```
POST /api/payment/subscription/reactivate/
```

**Response** `200 OK`
```json
{
  "success": true,
  "message": "Subscription reactivated",
  "auto_renew": true
}
```

---

### Remove Payment Method
შლის შენახულ გადახდის მეთოდს.

```
POST /api/payment/subscription/remove-payment-method/
```

**Response** `200 OK`
```json
{
  "success": true,
  "message": "Payment method removed"
}
```

---

## Documents API

### List Documents
აბრუნებს მომხმარებლის დოკუმენტების სიას.

```
GET /api/documents/
```

**Response** `200 OK`
```json
{
  "count": 2,
  "results": [
    {
      "id": "doc-uuid-1",
      "title": "ხელშეკრულება",
      "format": "pdf",
      "file_size": 45000,
      "created_at": "2024-01-18T14:00:00Z"
    }
  ]
}
```

---

### Get Document
აბრუნებს კონკრეტულ დოკუმენტს.

```
GET /api/documents/{id}/
```

**Response** `200 OK`
```json
{
  "id": "doc-uuid-1",
  "title": "ხელშეკრულება",
  "content": "Full document content...",
  "format": "pdf",
  "file_size": 45000,
  "created_at": "2024-01-18T14:00:00Z"
}
```

---

### Generate Document
გენერირებს PDF ან DOCX დოკუმენტს.

```
POST /api/documents/generate/
```

**Request Body**
```json
{
  "title": "ხელშეკრულება",
  "content": "Document content in markdown...",
  "format": "pdf",
  "session_id": "chat-session-uuid"
}
```

**Response** `201 Created`
```json
{
  "id": "doc-uuid",
  "title": "ხელშეკრულება",
  "format": "pdf",
  "file_size": 45000,
  "created_at": "2024-01-20T15:00:00Z"
}
```

---

### Download Document
ჩამოტვირთავს დოკუმენტის ფაილს.

```
GET /api/documents/{id}/download/
```

**Response** `200 OK`
- Content-Type: `application/pdf` or `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Content-Disposition: `attachment; filename="document.pdf"`

---

### Delete Document
შლის დოკუმენტს.

```
DELETE /api/documents/{id}/
```

**Response** `204 No Content`

---

## Contact API

### Submit Contact Form
გზავნის საკონტაქტო ფორმას (public endpoint).

```
POST /api/contact/
```

**Request Body**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Question about pricing",
  "message": "Hello, I would like to know..."
}
```

**Response** `200 OK`
```json
{
  "success": true,
  "message": "Your message has been received. We will get back to you soon."
}
```

Email იგზავნება: `KnowHowAIassistant@gmail.com`

---

## Countries API

### List Supported Countries
აბრუნებს მხარდაჭერილი ქვეყნების სიას (public endpoint).

```
GET /api/countries/
```

**Response** `200 OK`
```json
{
  "success": true,
  "countries": [
    {
      "code": "GE",
      "name": "Georgia",
      "native_name": "საქართველო",
      "flag_emoji": "🇬🇪",
      "source_name": "Matsne",
      "source_url": "https://matsne.gov.ge",
      "default_language": "ka",
      "document_count": 15000
    },
    {
      "code": "US",
      "name": "United States",
      "native_name": "United States",
      "flag_emoji": "🇺🇸",
      "source_name": "Congress.gov",
      "source_url": "https://www.congress.gov",
      "default_language": "en",
      "document_count": 0
    }
  ],
  "default": "GE"
}
```

---

## Error Responses

### Standard Error Format
```json
{
  "error": "Error message in Georgian",
  "error_type": "ValidationError",
  "detail": "Additional details if available"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `201` | Created |
| `204` | No Content (successful delete) |
| `400` | Bad Request - Invalid input |
| `401` | Unauthorized - Not logged in |
| `403` | Forbidden - No permission |
| `404` | Not Found |
| `429` | Too Many Requests (rate limited) |
| `500` | Server Error |
| `503` | Service Unavailable (AI API down) |

---

## Rate Limits

| Tier | Chat Messages | File Uploads |
|------|---------------|--------------|
| Free | 10/day | 5/day |
| Premium | Unlimited | 50/day |

---

## Frontend Usage Example

```typescript
import { authApi, chatApi, paymentApi } from './lib/api';

// Initialize app
await authApi.initCsrf();
const user = await authApi.getCurrentUser();

// Send chat message with streaming
const response = await chatApi.sendMessageStream({
  sessionId: 'uuid',
  message: 'What is VAT rate in Georgia?',
  model_tier: 'premium',
  country_code: 'GE'
});

// Handle streaming response
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));

      if (data.thinking) {
        // Display thinking/reasoning
        console.log('Thinking:', data.thinking);
      }
      if (data.content) {
        // Display response content
        console.log('Content:', data.content);
      }
      if (data.done) {
        // Response complete
        console.log('Done');
      }
    }
  }
}
```

---

## WebSocket Support

ამჟამად WebSocket არ გამოიყენება. Real-time streaming ხდება Server-Sent Events (SSE) მეშვეობით `/api/chat/` endpoint-ზე.
