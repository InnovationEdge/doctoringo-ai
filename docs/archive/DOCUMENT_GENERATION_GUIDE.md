# Document Generation User Guide

## Overview
KnowHow AI now supports automatic and manual document generation from chat conversations. Users can generate PDF and DOCX documents with a single click.

## Features

### 1. Automatic Document Generation
The AI can automatically generate documents when responding to your questions.

**How it works:**
- AI includes a special marker in its response
- System detects the marker and extracts document content
- Document is generated automatically
- Download link appears in the chat

**Example AI Response:**
```
Here is your legal document:

[Document content here...]

<<<GENERATE_DOCUMENT:{"title":"Legal Agreement","format":"pdf"}>>>
```

**Result:**
- Loading message: "დოკუმენტი იქმნება..." (Generating document...)
- Success message: "დოკუმენტი წარმატებით შეიქმნა!" (Document generated successfully!)
- Download link appears: 👉 [Legal_Agreement.pdf](download-url)

### 2. Manual Document Generation
Generate PDF or DOCX documents from any AI response with one click.

**How to use:**
1. Look for the buttons in the top-right corner of any AI message
2. Choose your format:
   - **PDF button** (red icon): Generates a PDF document
   - **DOCX button** (blue icon): Generates a Word document
3. Click the button
4. Document generates and downloads automatically

**Requirements:**
- Message must have substantial content (at least 50 characters)
- You must be logged in
- Content cannot exceed 1MB

## Button Locations

```
┌─────────────────────────────────────┐
│ AI Response                   📋🔴🔵│ ← Buttons here
│                                     │
│ [AI message content goes here...]  │
│                                     │
│ Multiple lines of text...          │
│                                     │
└─────────────────────────────────────┘
```

**Icons:**
- 📋 Copy button (copies text to clipboard)
- 🔴 PDF button (generates PDF document)
- 🔵 DOCX button (generates Word document)

## Document Generation Process

### Step 1: Content Validation
```
✅ Checks content length (min 50 chars)
✅ Validates content size (max 1MB)
✅ Removes excessive whitespace
✅ Extracts appropriate title
```

### Step 2: Generation
```
🔄 Shows loading indicator
📤 Sends content to backend
🔧 Backend generates PDF/DOCX
📥 Receives download URL
```

### Step 3: Success
```
✅ Success message shown
📂 Document opens in new tab
🔔 Documents list refreshes
```

## Title Generation

The system automatically generates titles from your content:

**Priority 1:** Markdown header
```markdown
# My Document Title  ← This becomes the title
Content here...
```

**Priority 2:** First substantial line
```
This is the first line that will be used as title
More content here...
```

**Priority 3:** Default fallback
```
AI_Response_Document_[timestamp]
```

## Error Messages

### "Document content is too short"
- **Cause**: Message has less than 50 characters
- **Solution**: Select a longer AI response

### "Please log in to generate documents"
- **Cause**: Not authenticated
- **Solution**: Log in with your Google account

### "Network error. Please try again"
- **Cause**: Connection issue or backend unavailable
- **Solution**: Check internet connection and try again

### "Document generation failed: [error]"
- **Cause**: Backend error (specific message shown)
- **Solution**: Check error details or contact support

## Tips & Best Practices

### ✅ DO:
- Generate documents from detailed AI responses
- Use for legal advice, contracts, or explanations
- Check the generated document after download
- Keep document titles descriptive

### ❌ DON'T:
- Try to generate from very short messages
- Generate duplicate documents unnecessarily
- Expect instant generation for very long content
- Use special characters in document titles

## Document Management

### Viewing Your Documents
1. Click "Documents" in the sidebar
2. See all generated documents
3. Download, view, or delete as needed

### Document List Features
- **Download**: Re-download any document
- **Delete**: Remove documents you no longer need
- **Sort**: Documents sorted by creation date
- **Search**: Find documents by title (coming soon)

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Copy message | Click copy icon |
| Generate PDF | Click PDF icon |
| Generate DOCX | Click DOCX icon |

## Technical Details

### Supported Formats
- **PDF**: Portable Document Format (universal compatibility)
- **DOCX**: Microsoft Word format (editable)

### Content Processing
- Markdown formatting preserved
- Code blocks included
- Links converted to clickable URLs
- Images referenced (if supported by backend)

### File Naming
- Special characters removed
- Spaces converted to underscores
- Maximum 200 characters
- Format: `Title_Name.pdf` or `Title_Name.docx`

### Storage
- Documents stored on backend server
- Accessible from Documents page
- Associated with your user account
- Can be downloaded anytime

## Troubleshooting

### Buttons not appearing?
- Check if message is from AI (not your message)
- Ensure message is complete (not still generating)
- Verify message has enough content (>100 chars for buttons)

### Generation stuck?
- Check browser console for errors (F12)
- Verify you're logged in
- Check internet connection
- Try refreshing the page

### Download not working?
- Check browser's download settings
- Allow popups for knowhow.ge
- Check available disk space
- Try different browser

### Document looks wrong?
- Backend may need to process markdown better
- Contact support with document ID
- Provide feedback on specific issues

## Frequently Asked Questions

**Q: Can I edit documents after generation?**
A: DOCX files can be edited in Word. PDFs are read-only but can be edited with PDF editors.

**Q: How long are documents stored?**
A: Documents are stored permanently until you delete them.

**Q: Can I share generated documents?**
A: Yes, download and share as you would any PDF/DOCX file.

**Q: Are there limits on document generation?**
A: Free tier may have limits. Check your plan for details.

**Q: Can I regenerate with different format?**
A: Yes, click the other format button to generate again.

**Q: What if generation fails?**
A: Try again, or contact support if it persists.

## Feature Roadmap

### Coming Soon:
- 📊 Document templates
- 🎨 Custom styling options
- 📧 Email documents directly
- 🔍 Document search
- 📑 Multi-page documents with TOC
- 🔐 Password-protected PDFs

### In Development:
- 🤝 Share documents with others
- 📱 Mobile app support
- 🌐 Multiple language support
- 💼 Business plan features

## Support

Need help?
- 📧 Email: support@knowhow.ge
- 💬 In-app chat support
- 📚 Documentation: docs.knowhow.ge
- 🐛 Report issues: GitHub issues

---

**Version**: 1.0
**Last Updated**: 2025-10-13
**Compatibility**: All modern browsers
