import { message as uiMessage } from 'src/components/ui'

/**
 * Get the current UI language from localStorage
 */
export const getCurrentLanguage = (): 'georgian' | 'english' => {
  const lang = localStorage.getItem('language')
  return lang === 'english' ? 'english' : 'georgian'
}

/**
 * Error message translations
 */
export const ERROR_MESSAGES = {
  // Network errors
  network_error: {
    georgian: 'ქსელის შეცდომა. გთხოვთ, სცადოთ თავიდან',
    english: 'Network error. Please try again'
  },
  connection_failed: {
    georgian: 'კავშირი ვერ დამყარდა',
    english: 'Connection failed'
  },
  timeout: {
    georgian: 'მოთხოვნის დრო ამოიწურა',
    english: 'Request timed out'
  },

  // Authentication errors
  unauthorized: {
    georgian: 'ავტორიზაცია საჭიროა',
    english: 'Authorization required'
  },
  session_expired: {
    georgian: 'სესია ამოიწურა. გთხოვთ, ხელახლა გაიაროთ ავტორიზაცია',
    english: 'Session expired. Please log in again'
  },
  please_login: {
    georgian: 'გთხოვთ, გაიარეთ ავტორიზაცია',
    english: 'Please log in'
  },

  // Document errors
  document_generation_failed: {
    georgian: 'დოკუმენტის გენერირება ვერ მოხერხდა',
    english: 'Document generation failed'
  },
  document_content_too_short: {
    georgian: 'დოკუმენტის შინაარსი ძალიან მოკლეა',
    english: 'Document content is too short'
  },
  document_not_found: {
    georgian: 'დოკუმენტი ვერ მოიძებნა',
    english: 'Document not found'
  },
  failed_to_delete_document: {
    georgian: 'დოკუმენტის წაშლა ვერ მოხერხდა',
    english: 'Failed to delete document'
  },

  // General errors
  something_went_wrong: {
    georgian: 'რაღაც შეცდომა მოხდა',
    english: 'Something went wrong'
  },
  server_error: {
    georgian: 'სერვერის შეცდომა',
    english: 'Server error'
  },
  invalid_request: {
    georgian: 'არასწორი მოთხოვნა',
    english: 'Invalid request'
  },
  permission_denied: {
    georgian: 'წვდომა აკრძალულია',
    english: 'Permission denied'
  },
  usage_limit_reached: {
    georgian: 'უფასო გეგმის ლიმიტი ამოიწურა. გთხოვთ, გადახვიდეთ პრემიუმ გეგმაზე.',
    english: 'Free plan limit reached. Please upgrade to premium.'
  },

  // Success messages
  document_generated_successfully: {
    georgian: 'დოკუმენტი წარმატებით შეიქმნა!',
    english: 'Document generated successfully!'
  },
  document_deleted_successfully: {
    georgian: 'დოკუმენტი წარმატებით წაიშალა',
    english: 'Document deleted successfully'
  },
  saved_successfully: {
    georgian: 'წარმატებით შეინახა',
    english: 'Saved successfully'
  },

  // Loading states
  generating_document: {
    georgian: 'დოკუმენტი იქმნება...',
    english: 'Generating document...'
  },
  loading: {
    georgian: 'იტვირთება...',
    english: 'Loading...'
  },
  please_wait: {
    georgian: 'გთხოვთ დაელოდოთ...',
    english: 'Please wait...'
  }
}

/**
 * Get translated error message based on current language
 */
export const getErrorMessage = (key: keyof typeof ERROR_MESSAGES, fallback?: string): string => {
  const lang = getCurrentLanguage()
  const messageObj = ERROR_MESSAGES[key]

  if (messageObj) {
    return messageObj[lang]
  }

  return fallback || ERROR_MESSAGES.something_went_wrong[lang]
}

/**
 * Show error message in correct language
 */
export const showError = (key: keyof typeof ERROR_MESSAGES, fallback?: string) => {
  uiMessage.error(getErrorMessage(key, fallback))
}

/**
 * Show success message in correct language
 */
export const showSuccess = (key: keyof typeof ERROR_MESSAGES, fallback?: string) => {
  uiMessage.success(getErrorMessage(key, fallback))
}

/**
 * Show loading message in correct language
 */
export const showLoading = (key: keyof typeof ERROR_MESSAGES = 'loading', _duration = 0) => {
  uiMessage.loading(getErrorMessage(key))
}

/**
 * Destroy all messages
 */
export const destroyAllMessages = () => {
  uiMessage.destroy()
}
