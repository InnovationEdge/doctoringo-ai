import React, { useState, useEffect } from 'react'
import { useAuth } from 'src/providers/AuthProvider'
import { useTranslation } from 'src/providers/TranslationProvider'
import { useTheme } from 'src/providers/ThemeContext'
import { getCookie } from 'src/utils/cookieHelper'
import { logger } from 'src/utils/logger'
import { Input, Button, Dropdown, Spin, Modal, message } from 'src/components/ui'
import { API_BASE_URL } from 'src/lib/api'

interface ChatSession {
  id: string
  title: string
  created_at: string
  last_message_preview?: string
  message_count?: number
}

interface ChatHistoryProps {
  collapsed: boolean
  onSessionSelect: (sessionId: string) => void
  activeSessionId: string | null
  searchQuery?: string
}

// ChatGPT-style icons - clean, minimal, 1.5px stroke
const DeleteIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
)

const EditIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

const MoreIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="19" r="1" />
  </svg>
)

const MessageIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)

const ChatHistoryWithGroups: React.FC<ChatHistoryProps> = ({ collapsed, onSessionSelect, activeSessionId, searchQuery }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(false)
  const [editingSession, setEditingSession] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const { isAuthenticated } = useAuth()
  const { translate } = useTranslation()
  const { isDarkMode } = useTheme()

  // ChatGPT-style colors - matching SiderContent.tsx
  const colors = {
    hover: isDarkMode ? '#212121' : '#ececec',
    active: isDarkMode ? '#2f2f2f' : '#e5e5e5',
    text: isDarkMode ? '#ececec' : '#0d0d0d',
    textSecondary: isDarkMode ? '#9b9b9b' : '#666666',
    icon: isDarkMode ? '#b4b4b4' : '#666666',
    danger: '#ef4444'
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchSessions(searchQuery).then()
    } else {
      setSessions([])
    }
  }, [isAuthenticated, searchQuery])

  useEffect(() => {
    const handleAuthChange = () => {
      if (isAuthenticated) {
        fetchSessions().then()
      } else {
        setSessions([])
      }
    }

    const handleTitleUpdate = () => {
      if (isAuthenticated) {
        setTimeout(() => fetchSessions(), 1000)
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
      return
    }

    setLoading(true)
    try {
      const url = query
        ? `${API_BASE_URL}/api/sessions/?q=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/api/sessions/`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setSessions(data)
      }
    } catch (error) {
      logger.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    Modal.confirm({
      title: translate('delete_chat', 'ჩატის წაშლა'),
      content: translate('delete_chat_confirmation', 'დარწმუნებული ხართ, რომ გსურთ ამ ჩატის წაშლა? ამ მოქმედების გაუქმება შეუძლებელია'),
      okText: translate('delete', 'წაშლა'),
      cancelText: translate('cancel', 'გაუქმება'),
      okType: 'danger',
      onOk: async () => {
        const csrfToken = getCookie('csrftoken')

        if (!csrfToken) {
          message.error(translate('security_error', 'Security token missing. Please refresh the page.'))
          return
        }

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
            message.success(translate('chat_deleted', 'ჩატი წარმატებით წაიშალა'))

            if (activeSessionId === sessionId) {
              window.dispatchEvent(new Event('reset-chat'))
            }
          } else {
            throw new Error('Failed to delete')
          }
        } catch (error) {
          setSessions(previousSessions)
          message.error(translate('delete_error', 'ჩატის წაშლა ვერ მოხერხდა'))
        }
      }
    })
  }

  const handleEditTitle = async (sessionId: string, newTitle: string) => {
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
  }

  const getMenuItems = (session: ChatSession) => [
    {
      key: 'edit',
      label: translate('edit_title', 'სათაურის რედაქტირება'),
      icon: <EditIcon color={colors.icon} />,
      onClick: (e: { domEvent: React.MouseEvent }) => {
        e.domEvent.stopPropagation()
        setEditingSession(session.id)
        setEditTitle(session.title)
      }
    },
    {
      key: 'delete',
      label: translate('delete', 'წაშლა'),
      icon: <DeleteIcon color={colors.danger} />,
      danger: true,
      onClick: (e: { domEvent: React.MouseEvent }) => {
        e.domEvent.stopPropagation()
        handleDeleteSession(session.id)
      }
    }
  ]

  // Group sessions by time period
  const groupSessionsByTime = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const groups = {
      today: [] as ChatSession[],
      yesterday: [] as ChatSession[],
      previous7Days: [] as ChatSession[],
      older: [] as ChatSession[]
    }

    // Filter out empty chats (no messages or just "New Chat" title with no content)
    const sessionsWithContent = sessions.filter(session => {
      // If message_count is available, use it
      if (session.message_count !== undefined) {
        return session.message_count > 0
      }
      // Fallback: filter by title (exclude empty titles and "New Chat" without preview)
      const hasTitle = session.title && session.title.trim() !== '' && session.title !== 'New Chat'
      const hasPreview = session.last_message_preview && session.last_message_preview.trim() !== ''
      return hasTitle || hasPreview
    })

    sessionsWithContent.forEach(session => {
      const sessionDate = new Date(session.created_at)
      const sessionDay = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate())

      if (sessionDay.getTime() === today.getTime()) {
        groups.today.push(session)
      } else if (sessionDay.getTime() === yesterday.getTime()) {
        groups.yesterday.push(session)
      } else if (sessionDay >= sevenDaysAgo) {
        groups.previous7Days.push(session)
      } else {
        groups.older.push(session)
      }
    })

    return groups
  }

  const handleSessionClick = (sessionId: string) => {
    onSessionSelect(sessionId)
    window.dispatchEvent(new CustomEvent('select-session', {
      detail: { sessionId }
    }))
  }

  const renderSessionItem = (session: ChatSession) => (
    <div
      key={session.id}
      role="button"
      tabIndex={0}
      onClick={() => handleSessionClick(session.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleSessionClick(session.id)
        }
      }}
      style={{
        padding: '8px 12px',
        borderRadius: '8px',
        margin: '0 4px 1px 4px',
        cursor: 'pointer',
        backgroundColor: session.id === activeSessionId ? colors.active : 'transparent',
        border: 'none',
        transition: 'background-color 0.15s ease',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        if (session.id !== activeSessionId) {
          e.currentTarget.style.backgroundColor = colors.hover
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
    >
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
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
            <div>
              <div
                style={{
                  fontWeight: 500,
                  fontSize: '14px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  lineHeight: '1.4',
                  color: colors.text
                }}
              >
                {session.title || translate('new_chat', 'ახალი ჩატი')}
              </div>
              {session.last_message_preview && (
                <div
                  style={{
                    fontSize: '12px',
                    color: colors.textSecondary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginTop: '2px',
                    lineHeight: '1.3'
                  }}
                >
                  {session.last_message_preview}
                </div>
              )}
            </div>
          )}
        </div>

        <Dropdown
          menu={{ items: getMenuItems(session) }}
          trigger={['click']}
          placement='bottomRight'
        >
          <Button
            type='text'
            icon={<MoreIcon color={colors.icon} />}
            size='small'
            className='chat-menu-btn'
            style={{
              opacity: 0,
              transition: 'opacity 0.2s ease',
              minWidth: '28px',
              height: '28px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px'
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      </div>
    </div>
  )

  const renderGroup = (groupKey: string, groupSessions: ChatSession[], groupLabel: string) => {
    if (groupSessions.length === 0) return null

    return (
      <div key={groupKey} style={{ marginBottom: '8px' }}>
        <div style={{
          padding: '8px 12px 4px 12px',
          color: colors.textSecondary,
          fontSize: '12px',
          fontWeight: 500
        }}>
          {groupLabel}
        </div>
        <div>
          {groupSessions.map(session => renderSessionItem(session))}
        </div>
      </div>
    )
  }

  if (collapsed) {
    return null
  }

  const groupedSessions = groupSessionsByTime()
  // Only count sessions that have content (filter out empty chats)
  const sessionsWithContentForCount = sessions.filter(session => {
    if (session.message_count !== undefined) {
      return session.message_count > 0
    }
    const hasTitle = session.title && session.title.trim() !== '' && session.title !== 'New Chat'
    const hasPreview = session.last_message_preview && session.last_message_preview.trim() !== ''
    return hasTitle || hasPreview
  })
  const hasAnySessions = sessionsWithContentForCount.length > 0

  return (
    <div className='chat-history-container' style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      <div style={{ flex: 1, overflow: 'auto', paddingRight: '4px', minHeight: 0 }} className='custom-scrollbar'>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <Spin size="small" />
          </div>
        ) : !hasAnySessions ? (
          <div style={{
            padding: '24px 16px',
            textAlign: 'center',
            color: colors.textSecondary
          }}>
            <div style={{ opacity: 0.5, marginBottom: '8px' }}>
              <MessageIcon color={colors.textSecondary} />
            </div>
            <div style={{ fontSize: '13px' }}>
              {isAuthenticated
                ? translate('no_chats_yet', 'ჯერ არ გაქვთ ჩატები')
                : translate('login_to_see_history', 'ისტორიის სანახავად გაიარეთ ავტორიზაცია')
              }
            </div>
          </div>
        ) : (
          <>
            {renderGroup('today', groupedSessions.today, translate('today', 'დღეს'))}
            {renderGroup('yesterday', groupedSessions.yesterday, translate('yesterday', 'გუშინ'))}
            {renderGroup('previous7Days', groupedSessions.previous7Days, translate('previous_7_days', 'ბოლო 7 დღე'))}
            {renderGroup('older', groupedSessions.older, translate('older', 'უფრო ძველი'))}
          </>
        )}
      </div>
    </div>
  )
}

export default ChatHistoryWithGroups
