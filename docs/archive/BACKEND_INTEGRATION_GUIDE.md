# Backend Integration Guide for Document Generation

## Frontend is Ready! ✅

The frontend now has complete document generation support with beautiful UI. Here's what you need to implement on the backend:

## How It Works

### User Flow:
1. User asks in chat: "შექმენი მომსახურების ხელშეკრულება PDF ფორმატში"
2. Backend AI generates response with document
3. Frontend automatically detects document and creates beautiful download button
4. User clicks and downloads

## Backend Implementation Required

### Method 1: Include Special Marker in AI Response (Automatic)

When your AI detects a document request, include this marker in the response:

```
<<<GENERATE_DOCUMENT:{"title":"Service_Agreement","format":"pdf","content":"full document text here..."}>>>
```

**Example AI Response:**
```
გამარჯობა! მოამზადე მომსახურების ხელშეკრულება.

<<<GENERATE_DOCUMENT:{"title":"Service_Agreement_Template","format":"pdf","content":"FULL DOCUMENT CONTENT HERE"}>>>

დოკუმენტი მზადაა გადმოსაწერად!
```

The frontend will:
- Detect the marker automatically
- Call `POST /api/documents/generate/` endpoint
- Replace marker with beautiful download button
- Show success message in Georgian

### Method 2: Include Direct Download Link (Manual)

If you generate the document on your backend, just include a markdown link:

```
[Service_Agreement.pdf](/api/documents/123/download/)
```

Frontend will automatically render it as a beautiful download button with:
- ✅ Green checkmark
- 📄 File icon (PDF/DOCX)
- 🎨 Professional styling
- 🌙 Dark mode support

## API Endpoints You Have

### Generate Document
```
POST /api/documents/generate/
Content-Type: application/json

{
  "session_id": "optional-session-id",
  "title": "Document Name",
  "format": "pdf",  // or "docx"
  "content": "Full document content..."
}

Response:
{
  "document_id": "123",
  "file_url": "/api/documents/123/download/",
  "title": "Document Name",
  "format": "pdf",
  "created_at": "2025-10-09T..."
}
```

### List Documents
```
GET /api/documents/
Response: Array of Document objects
```

### Download Document
```
GET /api/documents/{id}/download/?format=pdf
Response: Binary file (PDF or DOCX)
```

### Delete Document
```
DELETE /api/documents/{id}/
Response: 204 No Content
```

## AI Detection Keywords (Suggestions)

Detect these Georgian phrases to trigger document generation:
- "შექმენი დოკუმენტი" (create document)
- "დააგენერირე PDF" (generate PDF)
- "ჩამოტვირთვადი ფაილი" (downloadable file)
- "მოამზადე ხელშეკრულება" (prepare contract)
- "გაკეთე დოკუმენტი" (make document)

## Testing

### Test with curl:
```bash
# Generate document
curl -X POST http://your-api/api/documents/generate/ \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","format":"pdf","content":"Test content"}'

# Download document
curl http://your-api/api/documents/123/download/?format=pdf -o test.pdf
```

### Test AI Response:
```
User: "შექმენი მომსახურების ხელშეკრულება"

AI Response should include:
<<<GENERATE_DOCUMENT:{"title":"Service_Agreement","format":"pdf","content":"ARTICLE 1: SERVICES..."}>>>
```

## Frontend Features Already Implemented ✅

- ✅ Automatic document detection
- ✅ Beautiful download UI with green checkmark
- ✅ PDF and DOCX support
- ✅ Documents sidebar list
- ✅ Full documents management page
- ✅ Real-time updates
- ✅ Download and delete functionality
- ✅ Dark mode support
- ✅ Mobile responsive
- ✅ 100% Georgian language
- ✅ Success/error messages

## What's Missing?

**Only the backend needs to:**
1. Detect when user asks for document generation
2. Either:
   - Option A: Include the special marker in AI response
   - Option B: Generate document and return download link directly

That's it! Everything else is ready on the frontend.

## Example Implementation (Python/Django)

```python
# In your AI response handler
def generate_ai_response(user_message, session_id):
    # Detect document request
    if any(keyword in user_message.lower() for keyword in ['შექმენი', 'დააგენერირე', 'pdf']):
        # Generate document content
        document_content = create_legal_document(user_message)

        # Include marker in response
        marker = f'<<<GENERATE_DOCUMENT:{{"title":"Legal_Document","format":"pdf","content":"{document_content}"}}>>>'

        response = f"გამარჯობა! დოკუმენტი მზადაა.\n\n{marker}\n\nგადმოწერე ზემოთ."
        return response

    # Regular AI response
    return generate_normal_response(user_message)
```

## Questions?

If you need help with backend implementation, let me know!
