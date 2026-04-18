import { handleApiError } from '../errorHandler'
import { API_BASE_URL } from '../../lib/api'

function getCookie(name: string): string | null {
  let cookieValue = null
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';')
    for (let i = 0; i < cookies.length; i++) {
      const cookieElement = cookies[i]
      if (cookieElement) {
        const cookie = cookieElement.trim()
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
          break
        }
      }
    }
  }
  return cookieValue
}

export interface Document {
  id: string
  title: string
  content: string
  format: 'pdf' | 'docx'
  session_id?: string
  created_at: string
  updated_at: string
  file_url?: string
  file_size?: number
}

export interface GenerateDocumentRequest {
  session_id?: string
  content: string
  title: string
  format: 'pdf' | 'docx'
}

export interface GenerateDocumentResponse {
  document_id: string
  file_url: string
  title: string
  format: 'pdf' | 'docx'
  created_at: string
}

export const documentsApi = {
  // Get all user documents
  getDocuments: async (): Promise<Document[]> => {
    const response = await fetch(`${API_BASE_URL}/api/documents/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    })

    if (!response.ok) {
      await handleApiError(response)
    }

    const data = await response.json()
    // Backend returns {count, results}, extract the results array
    return data.results || data
  },

  // Get a specific document
  getDocument: async (documentId: string): Promise<Document> => {
    const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    })

    if (!response.ok) {
      await handleApiError(response)
    }

    return await response.json()
  },

  // Generate a new document from chat content
  generateDocument: async (request: GenerateDocumentRequest): Promise<GenerateDocumentResponse> => {
    const csrfToken = getCookie('csrftoken')

    const response = await fetch(`${API_BASE_URL}/api/documents/generate/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken || ''
      },
      credentials: 'include',
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      await handleApiError(response)
    }

    const data = await response.json()
    // Map backend response to frontend format (backend uses 'id', frontend expects 'document_id')
    return {
      document_id: data.id,
      file_url: data.file_url,
      title: data.title,
      format: data.format,
      created_at: data.created_at
    }
  },

  // Delete a document
  deleteDocument: async (documentId: string): Promise<void> => {
    const csrfToken = getCookie('csrftoken')

    const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}/`, {
      method: 'DELETE',
      headers: {
        'X-CSRFToken': csrfToken || ''
      },
      credentials: 'include'
    })

    if (!response.ok) {
      await handleApiError(response)
    }
  },

  // Fill a court form template with user data + AI data
  fillForm: async (params: {
    form_type: string;
    title: string;
    user_data: Record<string, string>;
    ai_data?: { facts: string; legalGrounds: string[]; stateFee: string; attachments: string[]; disputeType?: string; jurisdiction?: string };
  }): Promise<GenerateDocumentResponse> => {
    const csrfToken = getCookie('csrftoken')

    const response = await fetch(`${API_BASE_URL}/api/documents/fill_form/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken || ''
      },
      credentials: 'include',
      body: JSON.stringify(params)
    })

    if (!response.ok) {
      await handleApiError(response)
    }

    const data = await response.json()
    return {
      document_id: data.document_id || data.id,
      file_url: data.file_url || `/api/documents/${data.document_id || data.id}/download/`,
      title: data.title,
      format: 'docx',
      created_at: data.created_at || new Date().toISOString()
    }
  },

  // Download a document
  downloadDocument: async (documentId: string): Promise<Blob> => {
    // Backend determines format from document model, no need to pass it as parameter
    const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}/download/`, {
      method: 'GET',
      credentials: 'include'
    })

    if (!response.ok) {
      await handleApiError(response)
    }

    return await response.blob()
  }
}
