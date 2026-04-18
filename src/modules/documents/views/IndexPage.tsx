import { useState, useEffect, useCallback } from 'react'
import { Modal, message } from 'src/components/ui'
import { useNavigate } from 'react-router-dom'
import { documentsApi, Document } from 'src/api/documents'
import useMobile from 'src/hooks/useMobile'
import { useTranslation } from 'src/providers/TranslationProvider'
import LoadingSpinner from 'src/core/components/LoadingSpinner'
import 'src/assets/css/documents.css'

// Grok-style Icons
const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

const DeleteIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
  </svg>
)

const FileWordIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M8 13l1.5 5 1.5-5 1.5 5 1.5-5" />
  </svg>
)

const FilePdfIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M10 12H9v5h1v-2h1a1.5 1.5 0 000-3h-1z" />
  </svg>
)

const ExclamationCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#faad14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

// Helper functions
const formatFileSize = (bytes?: number) => {
  if (!bytes) return 'N/A'
  const kb = bytes / 1024
  const mb = kb / 1024
  if (mb >= 1) return `${mb.toFixed(1)} MB`
  return `${kb.toFixed(0)} KB`
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ka-GE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const DocumentsPage = () => {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const isMobile = useMobile()
  const { translate } = useTranslation()

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    try {
      const docs = await documentsApi.getDocuments()
      setDocuments(docs)
    } catch (error: any) {
      console.error('Failed to fetch documents:', error)
      setDocuments([])
      if (error.statusCode !== 404 && error.statusCode !== 500) {
        message.error(error.message || translate('failed_to_load_documents', 'დოკუმენტების ჩატვირთვა ვერ მოხერხდა'))
      }
    } finally {
      setLoading(false)
    }
  }, [translate])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const handleDownload = useCallback(async (documentId: string, format: 'pdf' | 'docx', title: string) => {
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
      message.success(translate('document_downloaded', `${title}.${format} გადმოწერილია`))
    } catch (error: any) {
      console.error('Failed to download document:', error)
      message.error(error.message || translate('failed_to_download_document', 'დოკუმენტის გადმოწერა ვერ მოხერხდა'))
    } finally {
      setDownloadingId(null)
    }
  }, [translate])

  const handleDelete = useCallback((documentId: string, title: string) => {
    Modal.confirm({
      title: translate('delete_document', 'დოკუმენტის წაშლა'),
      icon: <ExclamationCircleIcon />,
      content: translate('delete_document_confirm_message', `დარწმუნებული ხართ, რომ გსურთ "${title}"-ის წაშლა?`),
      okText: translate('delete', 'წაშლა'),
      cancelText: translate('cancel', 'გაუქმება'),
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await documentsApi.deleteDocument(documentId)
          message.success(translate('document_deleted_successfully', 'დოკუმენტი წარმატებით წაიშალა'))
          fetchDocuments()
        } catch (error: any) {
          console.error('Failed to delete document:', error)
          message.error(error.message || translate('failed_to_delete_document', 'დოკუმენტის წაშლა ვერ მოხერხდა'))
        }
      }
    })
  }, [translate, fetchDocuments])

  return (
    <div className={`documents-page ${isMobile ? 'mobile' : ''}`}>
      <div className="documents-container">
        {/* Back Button - Separate Row */}
        <button
          type="button"
          className="documents-back-btn"
          onClick={() => navigate('/')}
        >
          <ArrowLeftIcon />
          <span>{translate('back', 'უკან')}</span>
        </button>

        {/* Title and Action - Same Row */}
        <div className="documents-title-row">
          <h1 className="documents-title">
            {translate('documents', 'დოკუმენტები')}
          </h1>
          <button
            type="button"
            className="documents-generate-btn"
            onClick={() => navigate('/documents/generate')}
          >
            <PlusIcon />
            <span>{translate('generate_document', 'დოკუმენტის გენერირება')}</span>
          </button>
        </div>

        {loading && documents.length === 0 ? (
          <div className="documents-loading">
            <LoadingSpinner size='large' />
          </div>
        ) : documents.length === 0 ? (
          <div className="documents-empty">
            <div className="documents-empty-illustration">
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                <rect x="30" y="15" width="60" height="80" rx="4" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
                <path d="M70 15V35H90" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
                <line x1="45" y1="50" x2="75" y2="50" stroke="currentColor" strokeWidth="2" opacity="0.2"/>
                <line x1="45" y1="60" x2="70" y2="60" stroke="currentColor" strokeWidth="2" opacity="0.2"/>
                <line x1="45" y1="70" x2="65" y2="70" stroke="currentColor" strokeWidth="2" opacity="0.2"/>
                <circle cx="60" cy="85" r="20" stroke="currentColor" strokeWidth="2" opacity="0.15"/>
                <path d="M52 85L58 91L70 79" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
              </svg>
            </div>
            <h2 className="documents-empty-title">
              {translate('no_documents_yet', 'ჯერ არ არის დოკუმენტები')}
            </h2>
            <p className="documents-empty-subtitle">
              {translate('create_documents_hint', 'შექმენით დოკუმენტები AI-სთან საუბრის დროს')}
            </p>
          </div>
        ) : (
          <div className="documents-list">
            {documents.map((doc) => (
              <div key={doc.id} className="documents-card">
                <div className="documents-card-left">
                  <div className={`documents-card-icon ${doc.format}`}>
                    {doc.format === 'pdf' ? <FilePdfIcon /> : <FileWordIcon />}
                  </div>
                  <div className="documents-card-info">
                    <span className="documents-card-title">{doc.title}</span>
                    <span className="documents-card-meta">
                      {doc.format.toUpperCase()} • {formatFileSize(doc.file_size)} • {formatDate(doc.created_at)}
                    </span>
                  </div>
                </div>
                <div className="documents-card-actions">
                  <button
                    type="button"
                    className="documents-action-btn download"
                    disabled={downloadingId === doc.id}
                    onClick={() => handleDownload(doc.id, doc.format, doc.title)}
                  >
                    <DownloadIcon />
                    {!isMobile && <span>{translate('download', 'გადმოწერა')}</span>}
                  </button>
                  <button
                    type="button"
                    className="documents-action-btn delete"
                    onClick={() => handleDelete(doc.id, doc.title)}
                    aria-label={translate('delete', 'წაშლა')}
                  >
                    <DeleteIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default DocumentsPage
