/**
 * Utility functions for document generation
 */

/**
 * Strip markdown formatting from content to get plain text
 * This helps create cleaner PDFs and DOCX files
 */
export const stripMarkdown = (markdown: string): string => {
  if (!markdown) return ''

  let text = markdown

  // Remove code blocks (```...```)
  text = text.replace(/```[\s\S]*?```/g, '')

  // Remove inline code (`...`)
  text = text.replace(/`([^`]+)`/g, '$1')

  // Remove headers (# ## ### etc.)
  text = text.replace(/^#{1,6}\s+/gm, '')

  // Remove bold (**text** or __text__)
  text = text.replace(/(\*\*|__)(.*?)\1/g, '$2')

  // Remove italic (*text* or _text_)
  text = text.replace(/(\*|_)(.*?)\1/g, '$2')

  // Remove strikethrough (~~text~~)
  text = text.replace(/~~(.*?)~~/g, '$1')

  // Remove links [text](url)
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

  // Remove images ![alt](url)
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')

  // Remove horizontal rules (--- or ***)
  text = text.replace(/^(-{3,}|\*{3,})$/gm, '')

  // Remove blockquotes (> )
  text = text.replace(/^>\s+/gm, '')

  // Remove list markers (- or * or 1.)
  text = text.replace(/^[\s]*[-*+]\s+/gm, '')
  text = text.replace(/^[\s]*\d+\.\s+/gm, '')

  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, '')

  // Remove extra whitespace
  text = text.replace(/\n{3,}/g, '\n\n')
  text = text.trim()

  return text
}

/**
 * Validate document content before generation
 */
export const validateDocumentContent = (content: string): { valid: boolean; error?: string } => {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: 'Document content is empty' }
  }

  const plainText = stripMarkdown(content)

  if (plainText.length < 50) {
    return { valid: false, error: 'Document content too short (minimum 50 characters)' }
  }

  if (plainText.length > 1000000) { // 1MB limit
    return { valid: false, error: 'Document content too long (maximum 1MB)' }
  }

  return { valid: true }
}

/**
 * Extract document title from content if not provided
 */
export const extractTitleFromContent = (content: string, defaultTitle: string = 'Document'): string => {
  // Try to find first header
  const headerMatch = content.match(/^#\s+(.+)$/m)
  if (headerMatch && headerMatch[1]) {
    return headerMatch[1].trim()
  }

  // Try to find first line with substantial content
  const lines = content.split('\n').filter(line => line.trim().length > 0)
  if (lines.length > 0 && lines[0]) {
    const firstLine = stripMarkdown(lines[0]).trim()
    if (firstLine.length > 3 && firstLine.length < 100) {
      return firstLine
    }
  }

  return defaultTitle
}

/**
 * Clean and prepare content for document generation
 */
export const prepareDocumentContent = (content: string, removeFirstHeading: boolean = true): string => {
  // Keep markdown for now as backend might support it
  // Just clean up excessive whitespace and formatting
  let cleaned = content

  // Remove the first heading if it matches the extracted title
  // This prevents duplicate titles in the generated document
  if (removeFirstHeading) {
    // Remove first heading (# Title) to avoid duplication
    // The backend will add the title at the top
    cleaned = cleaned.replace(/^#\s+.+$/m, '').trim()
  }

  // Remove excessive line breaks (more than 2 consecutive)
  cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n')

  // Remove trailing spaces
  cleaned = cleaned.replace(/[ \t]+$/gm, '')

  // Normalize line endings
  cleaned = cleaned.replace(/\r\n/g, '\n')

  return cleaned.trim()
}

/**
 * Format file size in human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Generate a safe filename from title
 */
export const sanitizeFilename = (title: string, format: 'pdf' | 'docx'): string => {
  // Remove special characters and replace spaces with underscores
  const safe = title
    .replace(/[^a-zA-Z0-9\s\-_]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 200) // Limit length

  return safe ? `${safe}.${format}` : `document_${Date.now()}.${format}`
}
