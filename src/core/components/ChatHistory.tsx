import React, { useState, useEffect, useCallback, memo } from 'react'
import { Button, Input, Modal, message, Dropdown, Spin } from 'src/components/ui'
import { useAuth } from 'src/providers/AuthProvider'
import { useTranslation } from 'src/providers/TranslationProvider'
import { useTheme } from 'src/providers/ThemeContext'
import RenderEmpty from 'core/components/RenderEmpty'
import { getCookie } from 'src/utils/cookieHelper'
import { logger } from 'src/utils/logger'
import { API_BASE_URL } from 'src/lib/api'

// Icons
const DeleteIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const MoreIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
  </svg>
)

interface ChatSession {
  id: string
  title: string
  created_at: string
  last_message_preview?: string
}

interface ChatHistoryProps {
  collapsed: boolean
  onSessionSelect: (sessionId: string) => void
  activeSessionId: string | null
  searchQuery?: string
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ collapsed, onSessionSelect, activeSessionId, searchQuery }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(false)
  const [editingSession, setEditingSession] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const { isAuthenticated } = useAuth()
  const { translate } = useTranslation()
  const { isDarkMode } = useTheme()

  // Platform-native colors (macOS-inspired)
  const hoverColor = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
  const activeColor = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
  const textColor = isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.75)'

  useEffect(() => {
    if (isAuthenticated) {
      void fetchSessions(searchQuery)
    } else {
      setSessions([])
    }
  }, [isAuthenticated, searchQuery])

  // Listen for logout events and title updates to refresh
  useEffect(() => {
    const handleAuthChange = () => {
      if (isAuthenticated) {
        void fetchSessions()
      } else {
        setSessions([])
      }
    }

    const handleTitleUpdate = () => {
      // Refresh sessions when a new title is generated
      if (isAuthenticated) {
        setTimeout(() => void fetchSessions(), 1000) // Small delay to ensure title is saved
      }
    }

    window.addEventListener('auth-changed', handleAuthChange)
    window.addEventListener('chat-title-updated', handleTitleUpdate)
    return () => {
      window.removeEventListener('auth-changed', handleAuthChange)
      window.removeEventListener('chat-title-updated', handleTitleUpdate)
    }
  }, [isAuthenticated])

  const fetchSessions = async (query?: string) => {
    if (!isAuthenticated) {
      logger.log('❌ Not authenticated, skipping session fetch')
      return
    }

    setLoading(true)
    try {
      const url = query
        ? `${API_BASE_URL}/api/sessions/?q=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/api/sessions/`

      logger.log('📥 Fetching sessions from:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      logger.log('📡 Sessions response:', {
        status: response.status,
        ok: response.ok
      })

      if (response.ok) {
        const data = await response.json()
        logger.log('✅ Sessions loaded:', data.length, 'chats')
        setSessions(data)
      } else {
        logger.error('❌ Failed to fetch sessions:', response.status, response.statusText)
      }
    } catch (error) {
      logger.error('❌ Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }


  const handleDeleteSession = useCallback(async (sessionId: string) => {
    Modal.confirm({
      title: translate('delete_chat', 'ჩატის წაშლა'),
      content: translate('delete_chat_confirmation', 'დარწმუნებული ხართ, რომ გსურთ ამ ჩატის წაშლა? ამ მოქმედების გაუქმება შეუძლებელია'),
      okText: translate('delete', 'წაშლა'),
      cancelText: translate('cancel', 'გაუქმება'),
      okType: 'danger',
      onOk: async () => {
        const csrfToken = getCookie('csrftoken')

        // Validate CSRF token exists
        if (!csrfToken) {
          logger.error('❌ CSRF token not found')
          message.error(translate('security_error', 'Security token missing. Please refresh the page.'))
          return
        }

        // Optimistic update: remove from UI immediately
        const previousSessions = [...sessions]
        setSessions(prev => prev.filter(s => s.id !== sessionId))

        try {
          const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/`, {
            method: 'DELETE',
            headers: {
              'X-CSRFToken': csrfToken
            },
            credentials: 'include'
          })

          if (response.ok) {
            message.success(translate('chat_deleted', 'ჩატი წარმատებით წაიშალა'))
            logger.info('✅ Chat deleted successfully:', sessionId)

            // If the deleted session was active, trigger a new session
            if (activeSessionId === sessionId) {
              window.dispatchEvent(new Event('reset-chat'))
            }
          } else {
            throw new Error('Failed to delete')
          }
        } catch (error) {
          logger.error('❌ Chat deletion failed:', error)
          // Rollback: restore the session to the list
          setSessions(previousSessions)
          message.error(translate('delete_error', 'ჩატის წაშლა ვერ მოხერხდა'))
        }
      }
    })
  }, [translate, activeSessionId, sessions])


  const handleEditTitle = useCallback(async (sessionId: string, newTitle: string) => {
    if (!newTitle.trim()) return

    try {
      const csrfToken = getCookie('csrftoken')
      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken || ''
        },
        credentials: 'include',
        body: JSON.stringify({ title: newTitle.trim() })
      })

      if (response.ok) {
        const updatedSession = await response.json()
        setSessions(sessions.map(s => s.id === sessionId ? updatedSession : s))
        message.success(translate('title_updated', 'ჩატის სათაური განახლებულია'))
      } else {
        throw new Error('Failed to update')
      }
    } catch (error) {
      message.error(translate('update_error', 'ჩატის სათაურის განახლება ვერ მოხერხდა'))
    } finally {
      setEditingSession(null)
      setEditTitle('')
    }
  }, [translate])

  const getMenuItems = useCallback((session: ChatSession) => [
    {
      key: 'edit',
      label: translate('edit_title', 'სათაურის რედაქტირება'),
      icon: <EditIcon />,
      onClick: (e: { domEvent: React.MouseEvent }) => {
        e.domEvent.stopPropagation()
        setEditingSession(session.id)
        setEditTitle(session.title)
      }
    },
    {
      key: 'delete',
      label: translate('delete', 'წაშლა'),
      icon: <DeleteIcon />,
      danger: true,
      onClick: (e: { domEvent: React.MouseEvent }) => {
        e.domEvent.stopPropagation()
        handleDeleteSession(session.id)
      }
    }
  ], [translate, handleDeleteSession])

  if (collapsed) {
    return null
  }

  return (
    <div className='chat-history-container' style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      <div style={{ flex: 1, overflow: 'auto', paddingRight: '4px', minHeight: 0 }} className='custom-scrollbar'>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <Spin />
          </div>
        ) : sessions.length === 0 ? (
          <RenderEmpty />
        ) : (
          <div className='chat-history-list'>
            {sessions.map((session) => (
              <div
                key={session.id}
                role="button"
                tabIndex={0}
                className={`chat-item-${session.id}`}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  margin: '0 8px 4px 8px',
                  cursor: 'pointer',
                  backgroundColor: session.id === activeSessionId ? activeColor : 'transparent',
                  border: 'none',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (session.id !== activeSessionId) {
                    e.currentTarget.style.backgroundColor = hoverColor
                  }
                  const menuBtn = e.currentTarget.querySelector('.chat-menu-btn') as HTMLElement
                  if (menuBtn) menuBtn.style.opacity = '1'
                }}
                onMouseLeave={(e) => {
                  if (session.id !== activeSessionId) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                  const menuBtn = e.currentTarget.querySelector('.chat-menu-btn') as HTMLElement
                  if (menuBtn) menuBtn.style.opacity = '0'
                }}
                onClick={() => {
                  onSessionSelect(session.id)
                  window.dispatchEvent(new CustomEvent('select-session', {
                    detail: { sessionId: session.id }
                  }))
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSessionSelect(session.id)
                  }
                }}
              >
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {editingSession === session.id ? (
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleEditTitle(session.id, editTitle)
                          }
                        }}
                        onBlur={() => handleEditTitle(session.id, editTitle)}
                        autoFocus
                        size='small'
                      />
                    ) : (
                      <div
                        style={{
                          fontWeight: 400,
                          fontSize: '14px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          lineHeight: '1.5',
                          color: textColor
                        }}
                      >
                        {session.title || translate('new_chat', 'ახალი ჩატი')}
                      </div>
                    )}
                  </div>

                  <Dropdown
                    menu={{ items: getMenuItems(session) }}
                    trigger={['click']}
                    placement='bottomRight'
                  >
                    <Button
                      variant='text'
                      icon={<MoreIcon />}
                      size='small'
                      className='chat-menu-btn'
                      style={{
                        opacity: 0,
                        transition: 'opacity 0.15s ease',
                        minWidth: '24px',
                        height: '24px',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Dropdown>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(ChatHistory)
