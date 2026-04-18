/**
 * Custom hook for managing chat sessions
 * Extracted from IndexPage.tsx for better code organization
 */
import { useState, useCallback } from 'react'
import { getCookie } from 'src/utils/cookieHelper'
import { logger, perfLogger } from 'src/utils/logger'
import { trackNewChatSession } from 'src/utils/firebase'
import { API_BASE_URL } from 'src/lib/api'

export interface ChatSession {
  id: string
  title: string
  created_at: string
}

export function useChatSession() {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [isCreatingSession, setIsCreatingSession] = useState(false)

  const createNewSession = useCallback(async (): Promise<string | null> => {
    if (isCreatingSession) {
      logger.warn('Session creation already in progress')
      return null
    }

    setIsCreatingSession(true)

    try {
      return await perfLogger.measureAsync('Create Session', async () => {
        const csrfToken = getCookie('csrftoken')

        if (!csrfToken) {
          logger.error('CSRF token not found')
          throw new Error('Security token missing. Please refresh the page.')
        }

        logger.info('Creating new session')

        const response = await fetch(`${API_BASE_URL}/api/sessions/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
          },
          credentials: 'include',
          body: JSON.stringify({ title: 'New Chat' })
        })

        if (!response.ok) {
          throw new Error(`Failed to create session: ${response.status}`)
        }

        const session: ChatSession = await response.json()
        logger.info('Session created:', session.id)

        setActiveSessionId(session.id)
        trackNewChatSession()

        return session.id
      })
    } catch (error) {
      logger.error('Failed to create session:', error)
      throw error
    } finally {
      setIsCreatingSession(false)
    }
  }, [isCreatingSession])

  const loadSession = useCallback(async (sessionId: string): Promise<any[]> => {
    logger.info('Loading session:', sessionId)

    const csrfToken = getCookie('csrftoken')
    if (!csrfToken) {
      throw new Error('Security token missing')
    }

    const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken
      },
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`Failed to load session: ${response.status}`)
    }

    const sessionData = await response.json()
    setActiveSessionId(sessionId)

    return sessionData.messages || []
  }, [])

  const resetSession = useCallback(() => {
    setActiveSessionId(null)
  }, [])

  return {
    activeSessionId,
    setActiveSessionId,
    isCreatingSession,
    createNewSession,
    loadSession,
    resetSession
  }
}
