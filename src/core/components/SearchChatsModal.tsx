import { useState, useEffect } from 'react'
import { useTranslation } from 'src/providers/TranslationProvider'
import { Modal, Input, Spin } from 'src/components/ui'
import 'src/assets/css/search-chats.css'
import { API_BASE_URL } from 'src/lib/api'

// Grok-style minimalistic icons
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
)

const MessageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)

interface SearchChatsModalProps {
  visible: boolean
  onClose: () => void
  onSessionSelect: (sessionId: string) => void
}

interface ChatSession {
  id: string
  title: string
  last_message: string
  updated_at: string
  message_count?: number
  last_message_preview?: string
}

const SearchChatsModal = ({ visible, onClose, onSessionSelect }: SearchChatsModalProps) => {
  const { translate } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [allSessions, setAllSessions] = useState<ChatSession[]>([])
  const [filteredSessions, setFilteredSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (visible && allSessions.length === 0) {
      fetchSessions()
    }
  }, [visible])

  const fetchSessions = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })

      if (!response.ok) throw new Error('Failed to fetch sessions')

      const sessions = await response.json()
      // Filter out empty sessions (no messages)
      const nonEmptySessions = (sessions || []).filter((session: ChatSession) => {
        if (session.message_count !== undefined) {
          return session.message_count > 0
        }
        // Fallback: check if has content
        const hasTitle = session.title && session.title.trim() !== '' && session.title !== 'New Chat'
        const hasPreview = session.last_message_preview || session.last_message
        return hasTitle || hasPreview
      })
      setAllSessions(nonEmptySessions)
      setFilteredSessions(nonEmptySessions)
    } catch (error) {
      console.error('Error fetching chat sessions:', error)
      setAllSessions([])
      setFilteredSessions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSessions(allSessions)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = allSessions.filter(session =>
      session.title.toLowerCase().includes(query) ||
      session.last_message.toLowerCase().includes(query)
    )
    setFilteredSessions(filtered)
  }, [searchQuery, allSessions])

  const handleSessionClick = (sessionId: string) => {
    onSessionSelect(sessionId)
    onClose()
    setSearchQuery('')
  }

  const handleClose = () => {
    onClose()
    setSearchQuery('')
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''

    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''

    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return translate('today', 'დღეს')
    if (diffDays === 1) return translate('yesterday', 'გუშინ')
    if (diffDays < 7) return `${diffDays} ${translate('days_ago', 'დღის წინ')}`
    return date.toLocaleDateString('ka-GE')
  }

  return (
    <Modal
      open={visible}
      onClose={handleClose}
      title={
        <div className="search-modal-title">
          <SearchIcon />
          <span>{translate('search_chats', 'ჩატების ძებნა')}</span>
        </div>
      }
      width={560}
    >
      {/* Search Input */}
      <div className="search-input-wrapper">
        <Input
          size='large'
          placeholder={translate('search_placeholder', 'მოძებნეთ ჩატები...')}
          inputPrefix={<SearchIcon />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
        />
      </div>

      {/* Results */}
      <div className="search-results">
        {loading ? (
          <div className="search-loading">
            <Spin size='large' />
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="search-empty">
            <div className="search-empty-icon">📭</div>
            <div className="search-empty-text">
              {searchQuery
                ? translate('no_results', 'შედეგები ვერ მოიძებნა')
                : translate('no_chats', 'ჩატები არ არის')
              }
            </div>
          </div>
        ) : (
          <div className="search-results-list">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                className="search-chat-item"
                onClick={() => handleSessionClick(session.id)}
              >
                <div className="search-chat-header">
                  <span className="search-chat-icon">
                    <MessageIcon />
                  </span>
                  <span className="search-chat-title">
                    {session.title || translate('untitled_chat', 'უსათაურო ჩატი')}
                  </span>
                  <span className="search-chat-date">
                    {formatDate(session.updated_at)}
                  </span>
                </div>
                {session.last_message && (
                  <div className="search-chat-preview">
                    {session.last_message}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}

export default SearchChatsModal
