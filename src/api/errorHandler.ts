// Global API error handler
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public data?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export const handleApiError = async (response: Response): Promise<void> => {
  if (response.status === 401) {
    // Session expired - trigger logout (only for 401, not 403)
    console.warn('Session expired. Logging out...')

    // Dispatch custom event that AuthProvider can listen to
    window.dispatchEvent(new CustomEvent('session-expired'))

    throw new ApiError(
      'Your session has expired. Please log in again.',
      response.status
    )
  }

  if (response.status === 403) {
    // Permission denied or CSRF failure - don't log out
    console.warn('Request forbidden (403). May be CSRF or permission issue.')
    throw new ApiError(
      'Request forbidden. Please try again.',
      response.status
    )
  }

  // For other errors, try to get error message from response
  let errorMessage = `Request failed with status ${response.status}`
  try {
    const errorData = await response.json()
    errorMessage = errorData.error || errorData.message || errorMessage
  } catch {
    // If response is not JSON, use default message
  }

  throw new ApiError(errorMessage, response.status)
}

export const fetchWithErrorHandling = async (
  url: string,
  options?: RequestInit
): Promise<Response> => {
  const response = await fetch(url, options)

  if (!response.ok) {
    await handleApiError(response)
  }

  return response
}
