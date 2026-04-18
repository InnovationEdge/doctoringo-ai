import { useState, useEffect } from 'react'
import { Button, message, Spin, Modal } from 'src/components/ui'
import { documentsApi, Document } from 'src/api/documents'
import { useTheme } from 'src/providers/ThemeContext'

// Icons
const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

const DeleteIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
  </svg>
)

const FilePdfIcon = ({ color }: { color: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14,2 14,8 20,8" />
  </svg>
)

const FileWordIcon = ({ color }: { color: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14,2 14,8 20,8" />
  </svg>
)

const EmptyIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14,2 14,8 20,8" />
  </svg>
)

const DocumentsList = () => {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const { isDarkMode } = useTheme()

  useEffect(() => {
    fetchDocuments()

    // Listen for document generation events
    const handleDocumentGenerated = () => {
      fetchDocuments()
    }

    window.addEventListener('document-generated', handleDocumentGenerated)
    return () => window.removeEventListener('document-generated', handleDocumentGenerated)
  }, [])

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      const docs = await documentsApi.getDocuments()
      setDocuments(docs)
    } catch (error: any) {
      console.error('Failed to fetch documents:', error)
      // Set empty array on error to prevent crash
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (documentId: string, format: 'pdf' | 'docx', title: string) => {
    setDownloadingId(documentId)
    try {
      const blob = await documentsApi.downloadDocument(documentId)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${title}.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      message.success(`${title}.${format} გადმოწერილია`)
    } catch (error: any) {
      console.error('Failed to download document:', error)
      message.error(error.message || 'დოკუმენტის გადმოწერა ვერ მოხერხდა')
    } finally {
      setDownloadingId(null)
    }
  }

  const handleDelete = (documentId: string, title: string) => {
    Modal.confirm({
      title: 'დოკუმენტის წაშლა',
      content: `დარწმუნებული ხართ, რომ გსურთ "${title}"-ის წაშლა?`,
      okText: 'წაშლა',
      okType: 'danger',
      cancelText: 'გაუქმება',
      onOk: async () => {
        try {
          await documentsApi.deleteDocument(documentId)
          message.success('დოკუმენტი წაიშალა')
          fetchDocuments()
        } catch (error: any) {
          message.error(error.message || 'დოკუმენტის წაშლა ვერ მოხერხდა')
        }
      }
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 24) {
      return 'დღეს'
    } else if (diffInHours < 48) {
      return 'გუშინ'
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)} დღის წინ`
    } else {
      return date.toLocaleDateString('ka-GE', { month: 'short', day: 'numeric' })
    }
  }

  if (loading && documents.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Spin />
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div style={{
        padding: '40px 16px',
        textAlign: 'center',
        color: isDarkMode ? '#8e8e8e' : '#666666'
      }}>
        <EmptyIcon />
        <p style={{ marginTop: '12px', fontSize: '14px' }}>დოკუმენტები ჯერ არ არის</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '0 12px' }}>
      {documents.map((doc) => (
        <div
          key={doc.id}
          style={{
            padding: '12px 8px',
            borderRadius: '8px',
            marginBottom: '4px',
            cursor: 'pointer',
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fafafa',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#f0f0f0'}`
          }}
        >
          <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              {doc.format === 'pdf' ? (
                <span style={{ marginRight: '8px' }}>
                  <FilePdfIcon color="#ff4d4f" />
                </span>
              ) : (
                <span style={{ marginRight: '8px' }}>
                  <FileWordIcon color="#033C81" />
                </span>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 500,
                    fontSize: '14px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: isDarkMode ? '#ececec' : '#1a1a1a'
                  }}
                >
                  {doc.title}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.6, color: isDarkMode ? '#8e8e8e' : '#666666' }}>
                  {formatDate(doc.created_at)}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button
                variant='primary'
                size='small'
                icon={<DownloadIcon />}
                loading={downloadingId === doc.id}
                onClick={(e) => {
                  e.stopPropagation()
                  handleDownload(doc.id, doc.format, doc.title)
                }}
              />
              <Button
                variant='danger'
                size='small'
                icon={<DeleteIcon />}
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(doc.id, doc.title)
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default DocumentsList
