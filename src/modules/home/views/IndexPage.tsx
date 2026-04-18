import { TextArea, Button, message, notification } from 'src/components/ui'
import { useEffect, useRef, useState, useCallback, useMemo, memo } from 'react'
import { useTranslation } from 'src/providers/TranslationProvider'
import { useTheme } from 'src/providers/ThemeContext'
import { useAuth } from 'src/providers/AuthProvider'
import { useCountry } from 'src/providers/CountryProvider'
import { usePrivateMode } from 'src/providers/PrivateModeProvider'
import { useNavigate } from 'react-router-dom'
import useMobile from 'src/hooks/useMobile'
import { handleApiError } from 'src/api/errorHandler'
import { documentsApi } from 'src/api/documents'
import { ChatMessage } from 'src/components/ChatMessage'

interface ChatMessageData {
  id: string | number;
  content: string;
  isUser: boolean;
  role: 'user' | 'assistant';
  timestamp: string | Date;
  isComplete: boolean;
  thought?: string;
  isStreaming?: boolean;
}
import FileUploadButton from 'src/components/FileUploadButton'
import ModelSelector, { ModelTier, ModelQuotaInfo } from 'src/components/ModelSelector'
import { getCookie } from 'src/utils/cookieHelper'
import { logger, perfLogger } from 'src/utils/logger'
import { validateDocumentContent, prepareDocumentContent, extractTitleFromContent } from 'src/utils/documentHelpers'
import { trackChatMessage, trackChatResponse, trackNewChatSession, trackFileUpload, trackDocumentGeneration } from 'src/utils/firebase'
import { API_BASE_URL } from 'src/lib/api'
// Logo imports removed - using greeting text instead
import 'src/assets/css/chat.css'

// Memoized Send Button to prevent re-renders
const SendButton = memo(({
  onClick,
  disabled,
  isLoading,
  hasInput,
  isMobile
}: {
  onClick: () => void
  disabled: boolean
  isLoading: boolean
  hasInput: boolean
  isMobile: boolean
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`chat-send-btn ${isMobile ? 'mobile' : ''} ${hasInput && !isLoading ? 'active' : ''}`}
  >
    {isLoading ? (
      <div className="chat-send-spinner" />
    ) : (
      <svg width='14' height='14' viewBox='0 0 24 24' fill='none' style={{ display: 'block' }}>
        <path
          d='M7 11L12 6L17 11M12 6V18'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    )}
  </button>
))

SendButton.displayName = 'SendButton'

const IndexPage = () => {
  useTheme() // Keep context subscription for theme changes
  const { translate } = useTranslation()
  const { isAuthenticated, user } = useAuth()
  const { selectedCountry } = useCountry()
  const { isPrivateMode } = usePrivateMode()
  const [inputText, setInputText] = useState('')
  const [messages, setMessages] = useState<ChatMessageData[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [userHasScrolled, setUserHasScrolled] = useState(false)
  const [selectedModel, setSelectedModel] = useState<ModelTier>(() => {
    // Load saved model preference from localStorage
    try {
      const saved = localStorage.getItem('doctoringo_preferred_model');
      if (saved === 'premium' || saved === 'standard') {
        return saved;
      }
    } catch (e) {
      // ignore localStorage errors
    }
    return 'standard';
  })
  const [modelQuotaInfo, setModelQuotaInfo] = useState<ModelQuotaInfo | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const navigate = useNavigate()
  const isMobile = useMobile()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
      // Just clear messages and session ID - don't create a session yet
      setMessages([])
      setActiveSessionId(null)
      setIsLoading(false)
    } else {
      setMessages([])
      setActiveSessionId(null)
    }
  }, [isAuthenticated])

  useEffect(() => {
    const handleSessionSelect = (event: CustomEvent) => {
      loadSession(event.detail.sessionId).then()
    }
    window.addEventListener('select-session' as any, handleSessionSelect)
    return () => window.removeEventListener('select-session' as any, handleSessionSelect)
  }, [])

  // Save model preference to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('doctoringo_preferred_model', selectedModel);
    } catch (e) {
      // ignore localStorage errors
    }
  }, [selectedModel])

  const createNewSession = useCallback(async () => {
    return await perfLogger.measureAsync('Create Session', async () => {
      const csrfToken = getCookie('csrftoken')

      // Validate CSRF token exists
      if (!csrfToken) {
        logger.error('❌ CSRF token not found')
        throw new Error('Security token missing. Please refresh the page.')
      }

      logger.info('🆕 Creating new session:', {
        hasCSRF: !!csrfToken,
        endpoint: `${API_BASE_URL}/api/sessions/`,
        userAgent: navigator.userAgent,
        cookiesEnabled: navigator.cookieEnabled
      })

      try {
        const response = await fetch(`${API_BASE_URL}/api/sessions/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
          },
          credentials: 'include',
          body: JSON.stringify({ title: 'New Chat' })
        })

        logger.info('📡 Session creation response:', {
          status: response.status,
          ok: response.ok,
          statusText: response.statusText
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          logger.error('❌ Failed to create session:', {
            status: response.status,
            errorData,
            csrfToken: csrfToken ? 'present' : 'missing'
          })

          // Provide more specific error message
          if (response.status === 403) {
            throw new Error('Authentication required. Please log in again.')
          }

          throw new Error(errorData.detail || errorData.error || 'Failed to create session')
        }

        const newSession = await response.json()
        logger.info('✅ Session created:', newSession.id)
        return newSession
      } catch (error: any) {
        logger.error('❌ Session creation error:', error)
        throw error
      }
    })
  }, [])

  const loadSession = async (sessionId: string) => {
    setIsLoading(true)
    setActiveSessionId(sessionId)
    try {
      const response = await fetch(`${API_BASE_URL}/api/history/${sessionId}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })
      if (response.ok) {
        const chatHistory = await response.json()
        const formattedMessages: ChatMessageData[] = chatHistory.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          isUser: msg.isUser,
          role: msg.role,
          timestamp: msg.timestamp,
          isComplete: true
        }))
        setShouldAutoScroll(false) // Don't auto-scroll when loading historical messages
        setMessages(formattedMessages)
        logger.info(`Loaded session ${sessionId} with ${formattedMessages.length} messages`)
      } else {
        logger.error('Failed to load session:', response.status)
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      logger.error('Failed to load session:', error)
      message.error('ჩატის ისტორიის ჩატვირთვა ვერ მოხერხდა')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const handleResetChat = () => {
      logger.info('Reset chat event received, isAuthenticated:', isAuthenticated)
      if (isAuthenticated) {
        logger.info('Resetting chat state')
        setMessages([])
        setActiveSessionId(null)
        setIsLoading(false)
        // Notify sidebar about new chat state
        window.dispatchEvent(new CustomEvent('new-chat-started'))
      } else {
        logger.warn('Cannot reset chat - user not authenticated')
      }
    }
    window.addEventListener('reset-chat', handleResetChat)
    return () => window.removeEventListener('reset-chat', handleResetChat)
  }, [isAuthenticated])

  // Scroll detection to respect user's scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (!messagesContainerRef.current) return

      const container = messagesContainerRef.current
      const { scrollTop, scrollHeight, clientHeight } = container
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100

      // If user scrolled up, stop auto-scroll
      if (!isNearBottom && shouldAutoScroll) {
        setUserHasScrolled(true)
        setShowScrollButton(true)
      } else if (isNearBottom) {
        setUserHasScrolled(false)
        setShowScrollButton(false)
      }
    }

    const container = messagesContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
    return undefined
  }, [shouldAutoScroll])

  // Auto-scroll only if user hasn't manually scrolled up
  useEffect(() => {
    if (messages.length > 0 && shouldAutoScroll && !userHasScrolled && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages, shouldAutoScroll, userHasScrolled])

  const scrollToBottom = useCallback(() => {
    setUserHasScrolled(false)
    setShowScrollButton(false)
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [])


  // Process AI response and generate document if AI indicates one should be created
  const processAIResponseForDocuments = useCallback(async (content: string, aiMessageId: string | number) => {
    // Check for court form filling marker first
    // Format: <<<FILL_COURT_FORM:{"form_type":"civil_claim","user_data":{...},"ai_data":{...}}>>>
    const courtFormRegex = /<<<FILL_COURT_FORM:(.*?)>>>/s
    const courtMatch = content.match(courtFormRegex)

    if (courtMatch && courtMatch[1]) {
      try {
        logger.info('⚖️ Court form marker detected')

        message.loading({
          content: translate('generating_court_form', 'სასამართლო ფორმა მზადდება...'),
          key: 'court-form-gen',
          duration: 15
        })

        const formData = JSON.parse(courtMatch[1])
        const { form_type, user_data, ai_data } = formData

        if (!form_type || !user_data) {
          throw new Error('Invalid court form data')
        }

        const title = formData.title || `${form_type} - ${new Date().toLocaleDateString('ka-GE')}`

        const result = await documentsApi.fillForm({
          form_type,
          title,
          user_data,
          ai_data,
        })

        logger.info('✅ Court form generated successfully:', result)

        const documentMessage = `⚖️ **${translate('court_form_ready', 'სასამართლო ფორმა მზადაა')}**\n\n${translate('court_form_generated_message', 'თქვენი სასამართლო ფორმა წარმატებით შეივსო და მზადაა გადმოსაწერად:')}\n\n**📥 [${result.title}.docx](${API_BASE_URL}${result.file_url})**\n\n${translate('court_form_info', 'დაწკაპუნეთ ზემოთ მოცემულ ბმულზე ფორმის გადმოსაწერად.')}`

        const cleanedText = content.substring(0, courtMatch.index).trim()
        const updatedContent = cleanedText
          ? `${cleanedText}\n\n---\n\n${documentMessage}`
          : documentMessage

        setMessages(prev =>
          prev.map(msg =>
            msg.id === aiMessageId ? { ...msg, content: updatedContent } : msg
          )
        )

        window.dispatchEvent(new Event('document-generated'))
        message.destroy('court-form-gen')
        message.success({
          content: translate('court_form_generated_successfully', 'სასამართლო ფორმა წარმატებით შეიქმნა!'),
          duration: 3
        })
      } catch (error: any) {
        logger.error('❌ Failed to generate court form:', error)
        message.destroy('court-form-gen')
        message.error({
          content: `${translate('court_form_generation_failed', 'სასამართლო ფორმის გენერირება ვერ მოხერხდა')}: ${error.message || ''}`,
          duration: 5
        })

        const cleanedContent = content.replace(courtFormRegex, '')
        setMessages(prev =>
          prev.map(msg =>
            msg.id === aiMessageId ? { ...msg, content: cleanedContent } : msg
          )
        )
      }
      return
    }

    // Check if AI response contains document generation markers
    // Format: <<<GENERATE_DOCUMENT:{"title":"Document Name","format":"pdf"}>>>
    const docGenRegex = /<<<GENERATE_DOCUMENT:(.*?)>>>/s
    const match = content.match(docGenRegex)

    if (match && match[1]) {
      try {
        logger.info('📄 Document generation marker detected')

        // Show loading indicator (10 second duration, auto-dismiss)
        message.loading({
          content: translate('generating_document', 'დოკუმენტი იქმნება...'),
          key: 'doc-gen',
          duration: 10  // Auto-dismiss after 10 seconds to avoid persistent flashing
        })

        // Parse document metadata
        let docData
        try {
          docData = JSON.parse(match[1])
        } catch (parseError) {
          logger.error('❌ Failed to parse document metadata:', parseError)
          throw new Error('Invalid document metadata format')
        }

        // Extract document content from the message (everything before the marker)
        let documentContent = content.substring(0, match.index).trim()

        // Validate content
        const validation = validateDocumentContent(documentContent)
        if (!validation.valid) {
          throw new Error(validation.error || 'Document content validation failed')
        }

        // Prepare and clean content
        documentContent = prepareDocumentContent(documentContent)

        // Extract title if not provided
        const title = docData.title || extractTitleFromContent(documentContent, 'Document')
        const format = docData.format || 'pdf'

        logger.info('✅ Generating document:', {
          title,
          format,
          contentLength: documentContent.length,
          hasSessionId: !!activeSessionId
        })

        // Generate the document
        const result = await documentsApi.generateDocument({
          session_id: activeSessionId || undefined,
          content: documentContent,
          title,
          format
        })

        logger.info('✅ Document generated successfully:', result)

        // Track successful document generation
        trackDocumentGeneration(result.format, true)

        // Create professional document ready message
        const documentMessage = `📄 **${translate('document_ready', 'დოკუმენტი მზადაა')}**\n\n${translate('document_generated_message', 'თქვენი დოკუმენტი წარმატებით შეიქმნა და მზადაა გადმოსაწერად:')}\n\n**📥 [${result.title}.${result.format}](${API_BASE_URL}${result.file_url})**\n\n${translate('document_info', 'დაწკაპუნეთ ზემოთ მოცემულ ბმულზე დოკუმენტის გადმოსაწერად.')}`

        // Replace entire content with clean professional message
        // Remove document text and marker, show only download link
        const updatedContent = content.substring(0, match.index).trim()
          ? `${translate('document_prepared', 'მოამზადე შემდეგი დოკუმენტი:')}\n\n---\n\n${documentMessage}`
          : documentMessage

        // Update message with clean download link only
        setMessages(prev =>
          prev.map(msg =>
            msg.id === aiMessageId ? { ...msg, content: updatedContent } : msg
          )
        )

        // Notify documents list to refresh
        window.dispatchEvent(new Event('document-generated'))

        // Close loading and show success
        message.destroy('doc-gen')
        message.success({
          content: translate('document_generated_successfully', 'დოკუმენტი წარმატებით შეიქმნა!'),
          duration: 3
        })
      } catch (error: any) {
        logger.error('❌ Failed to auto-generate document:', error)
        logger.error('Error details:', {
          message: error?.message,
          status: error?.statusCode,
          data: error?.data
        })

        // Track failed document generation (use 'unknown' as fallback if format not available)
        trackDocumentGeneration('unknown', false)

        // Close loading
        message.destroy('doc-gen')

        // Show user-friendly error message
        let errorMessage = translate('document_generation_failed', 'დოკუმენტის გენერირება ვერ მოხერხდა')

        if (error?.message?.includes('Authentication') || error?.statusCode === 401 || error?.statusCode === 403) {
          errorMessage = translate('please_login_to_generate', 'დოკუენტის შესაქმნელად გაიარეთ ავტორიზაცია')
        } else if (error?.message?.includes('too short')) {
          errorMessage = translate('document_content_too_short', 'დოკუმენტის შინაარსი ძალიან მოკლეა')
        } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
          errorMessage = translate('network_error', 'ქსელის შეცდომა. გთხოვთ სცადოთ თავიდან')
        } else if (error?.message) {
          // Show the actual error message if available
          errorMessage = `${translate('document_generation_failed', 'დოკუმენტის გენერირება ვერ მოხერხდა')}: ${error.message}`
        }

        message.error({
          content: errorMessage,
          duration: 5
        })

        // Remove the marker from the message so it doesn't show
        const cleanedContent = content.replace(docGenRegex, '')
        setMessages(prev =>
          prev.map(msg =>
            msg.id === aiMessageId ? { ...msg, content: cleanedContent } : msg
          )
        )
      }
    }
  }, [activeSessionId, translate])

  const applyTypewriterEffect = useCallback((aiMessageId: string | number, fullContent: string) => {
    // PERFORMANCE OPTIMIZATION: Removed expensive typewriter animation (saved 1-2s per response)
    // Since we use streaming by default, typewriter effect is rarely needed
    // When it IS needed (fallback), showing instantly is better UX than 1-2s delay

    // Show content immediately instead of animating
    setMessages(prev => {
      const msgExists = prev.some(msg => msg.id === aiMessageId)
      if (!msgExists) {
        return [
          ...prev,
          {
            id: aiMessageId,
            content: fullContent,
            isUser: false,
            role: 'assistant',
            timestamp: new Date().toISOString(),
            isComplete: true
          }
        ]
      }
      return prev.map(msg =>
        msg.id === aiMessageId ? { ...msg, content: fullContent, isComplete: true, isStreaming: false } : msg
      )
    })

    setIsLoading(false)

    // Process for automatic document generation
    processAIResponseForDocuments(fullContent, aiMessageId)
  }, [processAIResponseForDocuments])

  const handleSendMessage = useCallback(async (overrideText?: string) => {
    const trimmedInput = (overrideText ?? inputText).trim()
    if (!trimmedInput || isLoading) return

    // If not authenticated, redirect to login page
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    const userMessageId = `user-${Date.now()}`
    const aiMessageId = `ai-${Date.now() + 1}`

    // Check if this is the first message (no active session)
    const isFirstMessage = !activeSessionId || messages.length === 0

    let sessionId = activeSessionId

    // If no active session, create one first
    if (!sessionId) {
      try {
        setIsLoading(true)
        const newSession = await createNewSession()
        sessionId = newSession.id
        setActiveSessionId(sessionId)

        // Track new chat session creation
        trackNewChatSession()

        // Notify sidebar to refresh and show the new chat
        window.dispatchEvent(new Event('chat-title-updated'))
      } catch (error: any) {
        logger.error('Error creating session:', error)

        // Check if it's an auth error
        if (error.message && error.message.includes('Authentication')) {
          message.error({ content: 'გთხოვთ გაიაროთ ავტორიზაცია ჩატის გამოსაყენებლად', duration: 5 })
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('session-expired'))
          }, 2000)
        } else {
          message.error({ content: 'ჩატის სესიის შექმნა ვერ მოხერხდა. გთხოვთ სცადოთ თავიდან.', duration: 5 })
        }

        setIsLoading(false)
        return
      }
    }

    const optimisticUserMessage: ChatMessageData = {
      id: userMessageId,
      content: trimmedInput,
      isUser: true,
      role: 'user',
      timestamp: new Date().toISOString(),
      isComplete: true
    }
    const placeholderAiMessage: ChatMessageData = {
      id: aiMessageId,
      content: '',
      isUser: false,
      role: 'assistant',
      timestamp: new Date().toISOString(),
      isComplete: false,
      isStreaming: true
    }

    setMessages(prev => [...prev, optimisticUserMessage, placeholderAiMessage])
    setInputText('')
    setIsLoading(true)
    setShouldAutoScroll(true) // Enable auto-scroll for new messages

    let timeoutId: ReturnType<typeof setTimeout> | undefined
    const controller = new AbortController()

    try {
      const csrfToken = getCookie('csrftoken')

      // Validate CSRF token exists
      if (!csrfToken) {
        logger.error('❌ CSRF token not found')
        message.error('Security token missing. Please refresh the page.')
        setIsLoading(false)
        return
      }

      // Upload file first if attached
      let fileId: string | undefined
      if (uploadedFile) {
        try {
          const formData = new FormData()
          formData.append('file', uploadedFile)
          if (sessionId) {
            formData.append('session_id', sessionId)
          }

          logger.info('📎 Uploading file:', {
            filename: uploadedFile.name,
            size: uploadedFile.size,
            type: uploadedFile.type
          })

          const uploadResponse = await fetch(`${API_BASE_URL}/api/upload/`, {
            method: 'POST',
            headers: {
              'X-CSRFToken': csrfToken
            },
            credentials: 'include',
            body: formData
          })

          if (!uploadResponse.ok) {
            throw new Error('File upload failed')
          }

          const uploadData = await uploadResponse.json()
          fileId = uploadData.file.id
          logger.info('✅ File uploaded:', fileId)

          // Track file upload in Analytics
          trackFileUpload(uploadedFile.type, uploadedFile.size)

          // Clear the uploaded file from state
          setUploadedFile(null)
        } catch (uploadError) {
          logger.error('❌ File upload error:', uploadError)
          message.error('ფაილის ატვირთვა ვერ მოხერხდა')
          // Continue with message even if file upload fails
        }
      }

      // Debug logging
      logger.info('🔐 Chat request:', {
        sessionId,
        hasCSRF: !!csrfToken,
        csrfLength: csrfToken?.length || 0,
        endpoint: `${API_BASE_URL}/api/chat/`,
        hasFile: !!fileId
      })

      // Add timeout to fetch request (120 seconds - aligned with backend)
      timeoutId = setTimeout(() => controller.abort(), 120000)

      const requestBody: any = {
        sessionId: sessionId,
        message: trimmedInput,
        stream: true,  // Enable streaming responses
        model_tier: selectedModel,  // Send selected model tier
        country_code: selectedCountry  // Multi-country support
      }
      if (fileId) {
        requestBody.file_id = fileId
      }

      logger.info('📤 Sending chat request:', {
        hasStream: requestBody.stream,
        messageLength: trimmedInput.length,
        modelTier: requestBody.model_tier,
        sessionId: sessionId,
        countryCode: requestBody.country_code
      })

      // Track message sent
      trackChatMessage(sessionId || 'unknown', trimmedInput.length)
      const messageStartTime = Date.now()

      const response = await fetch(`${API_BASE_URL}/api/chat/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
          'Accept': 'text/event-stream, application/json'  // Accept streaming or JSON
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
        signal: controller.signal
      })

      // Log response details for debugging
      const responseContentType = response.headers.get('content-type')
      logger.info('📡 Chat response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        contentType: responseContentType
      })

      // Handle authentication errors (will trigger automatic logout)
      if (!response.ok) {
        // Get error details before handleApiError consumes the response
        let errorDetail = ''
        let errorData: any = null
        try {
          errorData = await response.clone().json()
          errorDetail = errorData.detail || errorData.error || errorData.message || ''
          logger.error('❌ API Error Details:', errorData)
        } catch (e) {
          logger.error('❌ Could not parse error response')
        }

        // Check for quota/limit related errors
        const isQuotaError = (
          response.status === 429 ||
          errorDetail.toLowerCase().includes('premium') ||
          errorDetail.toLowerCase().includes('quota') ||
          errorDetail.includes('შეკითხვა') ||
          errorDetail.includes('შეზღუდვა') ||
          errorDetail.includes('ლიმიტი')
        )

        if (isQuotaError) {
          logger.info('📊 Quota error detected, current model:', selectedModel)

          if (selectedModel === 'premium') {
            // Premium quota exhausted - switch to standard
            logger.info('📊 Premium quota exhausted - switching to standard model')

            // Update quota info to show 0 remaining
            setModelQuotaInfo(prev => prev ? {
              ...prev,
              remaining_questions: 0,
              has_remaining: false,
              questions_used: prev.daily_limit
            } : null)

            // Switch to standard model
            setSelectedModel('standard')

            // Show toast-style notification
            notification.info({
              message: translate('premium_limit_reached', 'Legal Pro ლიმიტი ამოიწურა'),
              description: translate(
                'switched_to_standard_auto',
                'თქვენი დღიური Legal Pro შეკითხვები ამოიწურა. გადართულია Legal Basic მოდელზე. გთხოვთ გაიმეოროთ შეკითხვა.'
              ),
              placement: 'topRight',
              duration: 6,
              style: {
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                marginTop: '60px',
                padding: '16px 20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none'
              },
              className: 'custom-notification-info',
              icon: <span style={{ fontSize: '24px' }}>⚡</span>
            })

            // Remove the pending AI message
            setMessages(prev => prev.filter(msg => msg.id !== aiMessageId))
            setIsLoading(false)
            return
          } else {
            // Standard model quota error - should not happen (Legal Basic is unlimited)
            // but handle gracefully if backend sends unexpected error
            logger.error('📊 Unexpected quota error on standard model')

            // Remove the pending AI message
            setMessages(prev => prev.filter(msg => msg.id !== aiMessageId))
            setIsLoading(false)

            // Show notification with upgrade button
            notification.warning({
              message: translate('unexpected_error', 'შეცდომა'),
              description: (
                <div>
                  <p style={{ margin: '0 0 12px 0' }}>
                    {translate('try_again_or_contact_support', 'გთხოვთ სცადოთ თავიდან ან დაგვიკავშირდით.')}
                  </p>
                  <Button
                    type='primary'
                    size='small'
                    onClick={() => navigate('/pricing')}
                    style={{
                      borderRadius: '8px',
                      fontWeight: 500
                    }}
                  >
                    {translate('upgrade_to_premium', 'გადასვლა პრემიუმზე')}
                  </Button>
                </div>
              ),
              placement: 'topRight',
              duration: 8,
              style: {
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                marginTop: '60px',
                padding: '16px 20px'
              },
              icon: <span style={{ fontSize: '24px' }}>⚠️</span>
            })
            return
          }
        }

        // Special handling for auth errors
        if (response.status === 403 || response.status === 401) {
          logger.error('🔒 Authentication error - CSRF or session issue')

          // Show specific error for authentication
          const authError = errorDetail || 'თქვენი სესია ამოიწურა. გთხოვთ გაიაროთ ავტორიზაცია თავიდან.'

          setMessages(prev =>
            prev.map(msg =>
              msg.id === aiMessageId
                ? { ...msg, content: `🔒 **ავტორიზაციის შეცდომა**\n\n${authError}\n\nგთხოვთ გაიაროთ ავთორიზაცია თავიდან.`, isComplete: true, isStreaming: false }
                : msg
            )
          )
          setIsLoading(false)

          // Trigger session expired event after 3 seconds to allow user to read message
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('session-expired'))
          }, 3000)

          return
        }

        await handleApiError(response)
        setIsLoading(false)
        return
      }

      // Check if response is streaming (SSE format)
      const contentType = response.headers.get('content-type')
      const isStreaming = contentType?.includes('text/event-stream') ||
                         contentType?.includes('stream') ||
                         contentType?.includes('application/x-ndjson')

      logger.info('🔍 Streaming check:', {
        contentType,
        isStreaming,
        hasBody: !!response.body
      })

      if (isStreaming && response.body) {
        // Handle streaming response
        logger.info('📡 Streaming response detected - using real-time display')

        // IMPORTANT: Set loading to false immediately so messages can be displayed during streaming
        setIsLoading(false)

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let accumulatedContent = ''
        let hasReceivedData = false

        // PERFORMANCE OPTIMIZATION: Throttle UI updates to reduce re-renders
        // Smooth 60fps streaming with requestAnimationFrame for buttery performance
        let lastUpdateTime = 0
        let pendingUpdate = false
        let rafId: number | null = null
        const UPDATE_THROTTLE_MS = 16 // 60fps (16.67ms) - smooth like native apps

        const throttledUpdateMessage = () => {
          const now = Date.now()

          if (now - lastUpdateTime >= UPDATE_THROTTLE_MS) {
            // Cancel any pending animation frame
            if (rafId !== null) {
              cancelAnimationFrame(rafId)
              rafId = null
            }

            // Update immediately using requestAnimationFrame for smooth rendering
            rafId = requestAnimationFrame(() => {
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === aiMessageId
                    ? { ...msg, content: accumulatedContent, isComplete: false, isStreaming: true }
                    : msg
                )
              )
              lastUpdateTime = Date.now()
              pendingUpdate = false
              rafId = null
            })
          } else if (!pendingUpdate) {
            // Schedule update for next frame
            pendingUpdate = true
            const delay = UPDATE_THROTTLE_MS - (now - lastUpdateTime)

            setTimeout(() => {
              if (rafId !== null) {
                cancelAnimationFrame(rafId)
              }

              rafId = requestAnimationFrame(() => {
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === aiMessageId
                      ? { ...msg, content: accumulatedContent, isComplete: false }
                      : msg
                  )
                )
                lastUpdateTime = Date.now()
                pendingUpdate = false
                rafId = null
              })
            }, delay)
          }
          // else: update already scheduled, skip
        }

        try {
          while (true) {
            const { done, value } = await reader.read()

            if (done) {
              logger.info('✅ Streaming complete, total length:', accumulatedContent.length)
              break
            }

            const chunk = decoder.decode(value, { stream: true })
            logger.log('📦 Raw chunk received:', chunk.substring(0, 100))

            // Parse SSE format: "data: {...}\n\n" or plain JSON lines
            const lines = chunk.split('\n')
            for (const line of lines) {
              const trimmedLine = line.trim()
              if (!trimmedLine || trimmedLine === '') continue

              try {
                let jsonStr = trimmedLine

                // Handle SSE format with "data: " prefix
                if (trimmedLine.startsWith('data: ')) {
                  jsonStr = trimmedLine.slice(6).trim()
                }

                // Skip [DONE] marker
                if (jsonStr === '[DONE]') {
                  logger.info('✅ Received [DONE] marker')
                  continue
                }

                // Try to parse as JSON
                const data = JSON.parse(jsonStr)

                // Handle different response formats
                const content = data.content || data.delta?.content || data.choices?.[0]?.delta?.content || ''

                // Handle model_info from backend (quota updates)
                if (data.model_info) {
                  logger.info('📊 Model info received:', data.model_info)
                  // Update quota info - use daily_limit from backend if available
                  const backendDailyLimit = data.model_info.daily_limit
                  setModelQuotaInfo(prev => prev ? {
                    ...prev,
                    daily_limit: backendDailyLimit || prev.daily_limit,
                    remaining_questions: data.model_info.remaining_premium_questions,
                    has_remaining: data.model_info.remaining_premium_questions > 0,
                    questions_used: (backendDailyLimit || prev.daily_limit || 5) - data.model_info.remaining_premium_questions
                  } : null)

                  // Auto-switch to standard if premium quota exceeded
                  if (data.model_info.premium_quota_exceeded) {
                    setSelectedModel('standard')
                    const isPremiumUser = user?.subscription?.is_paid === true
                    // Toast-style notification for quota exhausted with upgrade button for non-premium users
                    notification.info({
                      message: translate('premium_limit_reached', 'Legal Pro ლიმიტი ამოიწურა'),
                      description: (
                        <div>
                          <p style={{ margin: '0 0 8px 0', color: 'rgba(255,255,255,0.9)' }}>
                            {translate(
                              'switched_to_standard_desc',
                              'თქვენი დღიური Legal Pro შეკითხვები ამოიწურა. გადართულია Legal Basic მოდელზე, რომელიც შეუზღუდავია.'
                            )}
                          </p>
                          {!isPremiumUser && (
                            <Button
                              type='default'
                              size='small'
                              onClick={() => navigate('/pricing')}
                              style={{
                                marginTop: '8px',
                                borderRadius: '8px',
                                fontWeight: 500,
                                backgroundColor: 'rgba(255,255,255,0.15)',
                                borderColor: 'rgba(255,255,255,0.3)',
                                color: '#fff'
                              }}
                            >
                              {translate('upgrade_for_more', 'მეტი Legal Pro-სთვის')}
                            </Button>
                          )}
                        </div>
                      ),
                      placement: 'topRight',
                      duration: 8,
                      style: {
                        borderRadius: '16px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                        marginTop: '60px',
                        padding: '16px 20px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none'
                      },
                      className: 'custom-notification-info',
                      icon: <span style={{ fontSize: '24px' }}>⚡</span>
                    })
                  } else if (data.model_info.remaining_premium_questions === 1 && data.model_info.model_used === 'premium') {
                    // Warn user when only 1 premium question remains
                    notification.warning({
                      message: translate('last_premium_question', 'ბოლო Legal Pro შეკითხვა'),
                      description: translate(
                        'last_premium_desc',
                        'თქვენ დარჩა 1 Legal Pro შეკითხვა დღეს. კვოტა განახლდება შუაღამეს.'
                      ),
                      placement: 'topRight',
                      duration: 5,
                      style: {
                        borderRadius: '16px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                        marginTop: '60px',
                        padding: '16px 20px'
                      },
                      icon: <span style={{ fontSize: '24px' }}>✨</span>
                    })
                  }
                }

                if (content) {
                  hasReceivedData = true
                  accumulatedContent += content
                  logger.log('📝 Chunk received:', content.length, 'chars, total:', accumulatedContent.length)

                  // OPTIMIZED: Throttled update instead of updating on every chunk
                  throttledUpdateMessage()
                }
              } catch (e) {
                // Skip malformed lines
                if (trimmedLine.length > 0 && trimmedLine !== 'data: [DONE]') {
                  logger.debug('Skipping malformed line:', trimmedLine.substring(0, 50))
                }
              }
            }
          }

          // Check if we actually received data
          if (!hasReceivedData || accumulatedContent.trim().length === 0) {
            logger.error('❌ Streaming completed but no data received', {
              hasReceivedData,
              contentLength: accumulatedContent.length
            })
            setMessages(prev =>
              prev.map(msg =>
                msg.id === aiMessageId
                  ? {
                    ...msg,
                    content: '⚠️ **პასუხი არ მიღებულა**\n\nსერვერმა არ დააბრუნა პასუხი. გთხოვთ სცადოთ თავიდან.',
                    isComplete: true,
                    isStreaming: false
                  }
                  : msg
              )
            )
            return
          }

          // Mark as complete with received content
          setMessages(prev =>
            prev.map(msg =>
              msg.id === aiMessageId
                ? { ...msg, content: accumulatedContent, isComplete: true, isStreaming: false }
                : msg
            )
          )

          // Track response received
          const responseTime = Date.now() - messageStartTime
          trackChatResponse(sessionId || 'unknown', accumulatedContent.length, responseTime)

          // Check for document generation markers
          await processAIResponseForDocuments(accumulatedContent, aiMessageId)

        } catch (streamError) {
          logger.error('Streaming error:', streamError)
          throw streamError
        }
      } else {
        // Fallback to non-streaming (old behavior)
        logger.info('📦 Non-streaming response (fallback)')
        const data = await response.json()

        // Validate response has content
        if (!data || !data.content) {
          throw new Error('Invalid response from server')
        }

        logger.info('✅ Chat response received, length:', data.content?.length || 0)

        // Track response received
        const responseTime = Date.now() - messageStartTime
        trackChatResponse(sessionId || 'unknown', data.content.length, responseTime)

        applyTypewriterEffect(aiMessageId, data.content)
      }

      // If this was the first message, trigger chat history refresh after a delay
      // to show the newly generated title
      if (isFirstMessage) {
        setTimeout(() => {
          window.dispatchEvent(new Event('chat-title-updated'))
        }, 2000) // Wait 2 seconds to ensure title generation is complete
      }

    } catch (error: any) {
      logger.error('Chat API Error:', error)

      // Get user-friendly error message
      let errorMessage = 'სერვისი დროებით მიუწვდომელია. გთხოვთ სცადოთ მოგვიანებით.'

      if (error.name === 'AbortError') {
        errorMessage = 'მოთხოვნა დროში ამოიწურა. გთხოვთ სცადოთ უფრო მოკლე შეკითხვით.'
      } else if (error.status === 429) {
        errorMessage = error.message || 'ზედმეტად ბევრი მოთხოვნა. გთხოვთ დაელოდოთ.'
      } else if (error.message && error.message !== 'Invalid response from server') {
        errorMessage = error.message
      } else if (error.error) {
        errorMessage = error.error
      }

      // Show error notification using ChatGPT-style notifications (not raw message.error)
      if (error.status === 429 || error.statusCode === 429) {
        notification.warning({
          message: translate('too_many_requests', 'ზედმეტად ბევრი მოთხოვნა'),
          description: translate('please_wait', 'გთხოვთ დაელოდოთ რამდენიმე წამი და სცადოთ თავიდან'),
          placement: 'topRight',
          duration: 5,
          style: {
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            marginTop: '60px',
            padding: '16px 20px'
          }
        })
      } else if (error.statusCode && error.statusCode !== 500 && error.statusCode !== 502) {
        // Only show notification for non-server errors
        notification.error({
          message: translate('error_occurred', 'შეცდომა'),
          description: errorMessage,
          placement: 'topRight',
          duration: 5,
          style: {
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            marginTop: '60px',
            padding: '16px 20px'
          }
        })
      }

      // Update AI message with error - show a helpful message
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId
            ? { ...msg, content: `⚠️ ${errorMessage}\n\nგთხოვთ სცადოთ თავიდან ან დაუკავშირდით მხარდაჭერას.`, isComplete: true, isStreaming: false }
            : msg
        )
      )
      setIsLoading(false)
    } finally {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [inputText, isLoading, isAuthenticated, activeSessionId, messages.length, createNewSession, processAIResponseForDocuments, applyTypewriterEffect, selectedModel, selectedCountry, translate])

  // Suggested prompts for empty state (Grok style with SVG icons)
  const suggestedPrompts = useMemo(() => [
    {
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
      title: translate('labor_issue', 'შრომითი'),
      prompt: translate('labor_law_prompt', 'რა უფლებები მაქვს თანამშრომელს სამუშაოდან გათავისუფლებისას?')
    },
    {
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
      title: translate('property_issue', 'ქონებრივი'),
      prompt: translate('property_law_prompt', 'როგორ ხდება უძრავი ქონების ნასყიდობის ხელშეკრულების გაფორმება?')
    },
    {
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      title: translate('family_issue', 'საოჯახო'),
      prompt: translate('family_law_prompt', 'რა პროცედურებია საჭირო განქორწინებისთვის საქართველოში?')
    },
    {
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
      title: translate('contract_issue', 'ხელშეკრულებები'),
      prompt: translate('contract_law_prompt', 'რა ელემენტებს უნდა შეიცავდეს იურიდიულად ძალადაკარგული ხელშეკრულება?')
    }
  ], [translate])

  const handleSuggestedPromptClick = (prompt: string) => {
    setInputText(prompt)
    if (!isLoading && isAuthenticated) {
      handleSendMessage(prompt)
    } else if (!isAuthenticated) {
      inputRef.current?.focus()
    }
  }

  // Don't block rendering while auth is loading - page is public
  // Users can start chatting immediately, auth state will update when ready

  return (
    <div className='chat-container chat-page'>
      {/* Google Cloud badge - top left (only for unauthenticated users) */}
      {!isAuthenticated && (
        <div className='powered-by-badge'>
          <img
            src="https://www.gstatic.com/images/branding/product/2x/google_cloud_64dp.png"
            alt="Google Cloud"
            className='powered-by-badge-icon'
          />
          <span className='powered-by-badge-text'>Powered by Google Cloud</span>
        </div>
      )}

      {/* Auth buttons for unauthenticated users - top right */}
      {!isAuthenticated && (
        <div className='auth-buttons-container'>
          <button
            type='button'
            className='auth-signin-btn'
            onClick={() => navigate('/login')}
          >
            {translate('log_in', 'ავტორიზაცია')}
          </button>
          <button
            type='button'
            className='auth-signup-btn'
            onClick={() => navigate('/login')}
          >
            {translate('sign_up', 'რეგისტრაცია')}
          </button>
        </div>
      )}

      {/* Messages Area - ChatGPT Style */}
      <div
        ref={messagesContainerRef}
        className='chat-messages-wrapper custom-scrollbar'
      >
        {messages.length === 0 ? (
          /* Empty state - centered layout like ChatGPT */
          <div className={`chat-empty-state ${isMobile ? 'mobile' : ''} ${isAuthenticated ? 'has-header' : ''} ${isPrivateMode ? 'private-mode' : ''}`}>
            {/* Private mode - minimal UI */}
            {isPrivateMode ? (
              <>
                {/* Input Container only */}
                <div className='chat-input-container'>
                  <div className='chat-input-row'>
                    <FileUploadButton
                      onFileSelect={(file) => setUploadedFile(file)}
                      onFileRemove={() => setUploadedFile(null)}
                      selectedFile={null}
                      disabled={isLoading}
                    />

                    <input
                      type='text'
                      placeholder={translate('ask_anything', 'რა იურიდიული საკითხი გაინტერესებს?')}
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      disabled={isLoading}
                      className='chat-text-input'
                    />

                    <ModelSelector
                      selectedModel={selectedModel}
                      onModelChange={setSelectedModel}
                      quotaInfo={modelQuotaInfo}
                      disabled={isLoading}
                      onQuotaUpdate={setModelQuotaInfo}
                    />

                    <button
                      type="button"
                      onClick={() => {
                        if (inputText.trim() && !isLoading) {
                          handleSendMessage()
                        }
                      }}
                      disabled={isLoading}
                      className={`chat-send-btn ${isMobile ? 'mobile' : ''} ${inputText.trim() && !isLoading ? 'active' : ''}`}
                    >
                      <svg width='14' height='14' viewBox='0 0 24 24' fill='none'>
                        <path
                          d='M7 11L12 6L17 11M12 6V18'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Private mode notice */}
                <p className='chat-private-notice'>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', opacity: 0.7 }}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  {translate('private_mode_notice', 'ინკოგნიტო რეჟიმი - თქვენი მიმოწერა არ შეინახება')}
                </p>
              </>
            ) : (
              /* Normal mode - full UI */
              <>
                {/* Greeting - Claude style */}
                <div className={`chat-greeting ${isMobile ? 'mobile' : ''}`}>
                  <span className='chat-greeting-icon'>✸</span>
                  <span className='chat-greeting-text'>
                    {isAuthenticated && user?.first_name
                      ? `${translate('greeting_hello', 'გამარჯობა')}, ${user.first_name}`
                      : translate('greeting_welcome', 'გამარჯობა')}
                  </span>
                </div>

                {/* Input Container */}
                <div className='chat-input-container'>
                  <div className='chat-input-row'>
                    <FileUploadButton
                      onFileSelect={(file) => setUploadedFile(file)}
                      onFileRemove={() => setUploadedFile(null)}
                      selectedFile={null}
                      disabled={isLoading}
                    />

                    <input
                      type='text'
                      placeholder={translate('ask_anything', 'რა იურიდიული საკითხი გაინტერესებს?')}
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          if (isAuthenticated) {
                            handleSendMessage()
                          } else {
                            navigate('/login')
                          }
                        }
                      }}
                      disabled={isLoading}
                      className='chat-text-input'
                    />

                    <ModelSelector
                      selectedModel={selectedModel}
                      onModelChange={setSelectedModel}
                      quotaInfo={modelQuotaInfo}
                      disabled={isLoading}
                      onQuotaUpdate={setModelQuotaInfo}
                    />

                    <button
                      type="button"
                      onClick={() => {
                        if (!isAuthenticated) {
                          navigate('/login')
                        } else if (inputText.trim() && !isLoading) {
                          handleSendMessage()
                        }
                      }}
                      disabled={isLoading}
                      className={`chat-send-btn ${isMobile ? 'mobile' : ''} ${inputText.trim() && !isLoading ? 'active' : ''}`}
                    >
                      <svg width='14' height='14' viewBox='0 0 24 24' fill='none'>
                        <path
                          d='M7 11L12 6L17 11M12 6V18'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Quick actions */}
                <div className='chat-quick-actions'>
                  {suggestedPrompts.slice(0, isMobile ? 2 : 4).map((item, index) => (
                    <button
                      key={index}
                      className='suggested-prompt-btn'
                      onClick={() => handleSuggestedPromptClick(item.prompt)}
                    >
                      <span>{item.icon}</span>
                      <span>{item.title}</span>
                    </button>
                  ))}
                </div>

                {/* Disclaimer */}
                <p className='chat-disclaimer'>
                  {translate('terms_disclaimer', 'Doctoringo-თან მიმოწერით თქვენ ეთანხმებით ჩვენს')}{' '}
                  <a href="/static/documents/terms_of_service.pdf" target="_blank" className="chat-disclaimer-link-bold">
                    {translate('terms_short', 'პირობებს')}
                  </a>
                  {' '}{translate('and_conjunction', 'და')}{' '}
                  <a href="/static/documents/privacy_policy.pdf" target="_blank" className="chat-disclaimer-link-bold">
                    {translate('privacy_short', 'კონფიდენციალურობას')}
                  </a>.
                </p>
              </>
            )}
          </div>
        ) : (
          /* Messages list */
          <div className={`chat-messages-container chat-messages-list ${isMobile ? 'mobile' : ''}`}>
            {messages.map(msg => (
              <ChatMessage
                key={msg.id}
                message={msg}
              />
            ))}
            <div ref={messagesEndRef} style={{ height: '20px' }} />
          </div>
        )}

        {/* Scroll to Bottom Button */}
        {showScrollButton && (
          <div className='chat-scroll-btn-container'>
            <button
              type='button'
              className='scroll-to-bottom-btn'
              onClick={scrollToBottom}
            >
              <span style={{ fontSize: '14px' }}>↓</span>
            </button>
          </div>
        )}
      </div>

      {/* Input Area - Only show at bottom when there are messages */}
      {messages.length > 0 && (
        <div className={`chat-bottom-input ${isMobile ? 'mobile' : ''}`}>
          <div className='chat-bottom-input-wrapper'>
            {/* Input Container */}
            <div className={`chat-input-box ${isMobile ? 'mobile' : ''}`}>
              {/* Text Input Row */}
              <div className={`chat-input-inner-row ${isMobile ? 'mobile' : ''}`}>
                {/* Attach button */}
                <FileUploadButton
                  onFileSelect={(file) => setUploadedFile(file)}
                  onFileRemove={() => setUploadedFile(null)}
                  selectedFile={null}
                  disabled={isLoading}
                />

                {/* Text Input */}
                <TextArea
                  ref={inputRef}
                  id='chat-input-main'
                  name='chat-message'
                  placeholder={translate('type_message', 'დაწერეთ...')}
                  value={inputText}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputText(e.target.value)}
                  className={`custom-scrollbar chat-textarea ${isMobile ? 'mobile' : ''}`}
                  autoSize={{ minRows: 1, maxRows: isMobile ? 4 : 6 }}
                  onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage().then()
                    }
                  }}
                  disabled={isLoading}
                />

                {/* Model Selector */}
                <ModelSelector
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                  quotaInfo={modelQuotaInfo}
                  disabled={isLoading}
                  onQuotaUpdate={setModelQuotaInfo}
                  dropdownDirection="up"
                />

                {/* Send Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (inputText.trim() && !isLoading) {
                      handleSendMessage()
                    }
                  }}
                  disabled={!inputText.trim() || isLoading}
                  className={`chat-send-btn ${isMobile ? 'mobile' : ''} ${inputText.trim() && !isLoading ? 'active' : ''}`}
                >
                  {isLoading ? (
                    <div className='chat-send-spinner' />
                  ) : (
                    <svg
                      width='14'
                      height='14'
                      viewBox='0 0 24 24'
                      fill='none'
                      style={{ display: 'block' }}
                    >
                      <path
                        d='M7 11L12 6L17 11M12 6V18'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Attached file preview */}
            {uploadedFile && (
              <div className='chat-file-preview'>
                <FileUploadButton
                  onFileSelect={(file) => setUploadedFile(file)}
                  onFileRemove={() => setUploadedFile(null)}
                  selectedFile={uploadedFile}
                  disabled={isLoading}
                />
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}

export default IndexPage
