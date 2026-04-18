import React, { memo, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useTranslation } from 'src/providers/TranslationProvider'
import { useNavigate } from 'react-router-dom'
import 'src/assets/css/markdown.css'

// Grok-style minimalistic icons
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12l7 7 7-7" />
  </svg>
)

const FileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <path d="M14 2v6h6" />
  </svg>
)

interface MarkdownRendererProps {
  content: string
}

/**
 * Memoized Markdown renderer component
 * Prevents recreation of markdown parsers on every render
 * Optimized for performance in chat messages
 */
const MarkdownRenderer: React.FC<MarkdownRendererProps> = memo(({ content }) => {
  const { translate } = useTranslation()
  const navigate = useNavigate()

  // Memoize markdown components to prevent recreation
  const components = useMemo(() => ({
    p({ children, ...props }: any) {
      return <p className="md-paragraph" {...props}>{children}</p>
    },
    h1({ children, ...props }: any) {
      return <h1 className="md-h1" {...props}>{children}</h1>
    },
    h2({ children, ...props }: any) {
      return <h2 className="md-h2" {...props}>{children}</h2>
    },
    h3({ children, ...props }: any) {
      return <h3 className="md-h3" {...props}>{children}</h3>
    },
    ul({ children, ...props }: any) {
      return <ul className="md-ul" {...props}>{children}</ul>
    },
    ol({ children, ...props }: any) {
      return <ol className="md-ol" {...props}>{children}</ol>
    },
    li({ children, ...props }: any) {
      return <li className="md-li" {...props}>{children}</li>
    },
    blockquote({ children, ...props }: any) {
      return <blockquote className="md-blockquote" {...props}>{children}</blockquote>
    },
    pre({ children, ...props }: any) {
      return <pre className="md-pre" {...props}>{children}</pre>
    },
    code({ className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '')
      return match
        ? <code className="md-code" {...props}>{children}</code>
        : <code className="md-code-inline" {...props}> {children} </code>
    },
    strong({ children, ...props }: any) {
      return <strong className="md-strong" {...props}>{children}</strong>
    },
    a({ href, children, ...props }: any) {
      // Handle empty or undefined href - just render as text
      if (!href || href === '#' || href === '') {
        return <span className="md-link-placeholder">{children}</span>
      }

      // Check if it's a download link (contains .pdf or .docx)
      const isDownloadLink = href.includes('.pdf') || href.includes('.docx')
      if (isDownloadLink) {
        const isPdf = href.includes('.pdf')
        const fileName = String(children) || (isPdf ? 'Document.pdf' : 'Document.docx')
        return (
          <div className="md-download-card">
            <div className="md-download-header">
              <div className="md-download-check">
                <CheckIcon />
              </div>
              <span className="md-download-ready">
                {translate('ready', 'მზადაა')}
              </span>
            </div>
            <div className="md-download-desc">
              {translate('download_your_document_in_format', 'ჩამოტვირთეთ თქვენი დოკუმენტი შემდეგ ფორმატში')} {isPdf ? 'PDF' : 'DOCX'}:
            </div>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="md-download-btn"
            >
              <FileIcon />
              <DownloadIcon />
              {fileName}
            </a>
          </div>
        )
      }

      // Check if it's an internal navigation link (starts with / but not //)
      const isInternalLink = href.startsWith('/') && !href.startsWith('//')
      if (isInternalLink) {
        return (
          <a
            href={href}
            onClick={(e) => {
              e.preventDefault()
              navigate(href)
            }}
            className="md-link-internal"
            {...props}
          >
            {children}
          </a>
        )
      }

      // Enhanced styling for legal reference links (matsne.gov.ge)
      const isLegalLink = href.includes('matsne.gov.ge')
      if (isLegalLink) {
        // Extract article number from the link text
        const childText = String(children || '')
        const articleMatch = childText.match(/(?:მუხლი|article|Art\.?)\s*(\d+)/i)

        // Build URL with article anchor for direct scrolling
        let finalHref = href
        if (articleMatch) {
          const articleNum = articleMatch[1]
          const baseUrl = href.split('#')[0]
          finalHref = `${baseUrl}#muxli${articleNum}`
        }

        return (
          <a
            href={finalHref}
            target="_blank"
            rel="noopener noreferrer"
            title={articleMatch ? `სწრაფი გადასვლა მუხლი ${articleMatch[1]}-ზე` : undefined}
            className="md-link-legal"
            {...props}
          >
            {children}
          </a>
        )
      }

      // Regular external link
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="md-link"
          {...props}
        >
          {children}
        </a>
      )
    },
    table({ children, ...props }: any) {
      return (
        <div className="md-table-wrapper">
          <table className="md-table" {...props}>
            {children}
          </table>
        </div>
      )
    },
    thead({ children, ...props }: any) {
      return <thead className="md-thead" {...props}>{children}</thead>
    },
    tbody({ children, ...props }: any) {
      return <tbody {...props}>{children}</tbody>
    },
    tr({ children, ...props }: any) {
      return <tr className="md-tr" {...props}>{children}</tr>
    },
    th({ children, ...props }: any) {
      return <th className="md-th" {...props}>{children}</th>
    },
    td({ children, ...props }: any) {
      return <td className="md-td" {...props}>{children}</td>
    },
    hr({ ...props }: any) {
      return <hr className="md-hr" {...props} />
    }
  }), [translate, navigate])

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={components}
    >
      {content}
    </ReactMarkdown>
  )
})

MarkdownRenderer.displayName = 'MarkdownRenderer'

export default MarkdownRenderer
