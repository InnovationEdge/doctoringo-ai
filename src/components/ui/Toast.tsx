import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import 'src/assets/css/toast.css'

// Grok-style minimalistic icons
const SuccessIcon = () => (
  <svg className="toast-icon success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const ErrorIcon = () => (
  <svg className="toast-icon error" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
)

const WarningIcon = () => (
  <svg className="toast-icon warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
  </svg>
)

const InfoIcon = () => (
  <svg className="toast-icon info" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
)

const LoadingIcon = () => (
  <svg className="toast-icon loading" viewBox="0 0 24 24" fill="none">
    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
)

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
)

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info' | 'loading'
  content: ReactNode
  duration?: number
}

interface ToastContextType {
  success: (content: ReactNode, duration?: number) => void
  error: (content: ReactNode, duration?: number) => void
  warning: (content: ReactNode, duration?: number) => void
  info: (content: ReactNode, duration?: number) => void
  loading: (content: ReactNode, key?: string) => void
  destroy: (key?: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Also export as 'message' for compatibility with antd API
export const useMessage = useToast

const icons = {
  success: <SuccessIcon />,
  error: <ErrorIcon />,
  warning: <WarningIcon />,
  info: <InfoIcon />,
  loading: <LoadingIcon />
}

const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
  return (
    <div className="toast-item">
      {icons[toast.type]}
      <span className="toast-content">{toast.content}</span>
      {toast.type !== 'loading' && (
        <button onClick={onClose} className="toast-close-btn" aria-label="Close">
          <CloseIcon />
        </button>
      )}
    </div>
  )
}

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const addToast = useCallback((type: Toast['type'], content: ReactNode, duration: number = 3000, key?: string) => {
    const id = key || `toast-${Date.now()}-${Math.random()}`

    // Remove existing toast with same key
    if (key) {
      setToasts(prev => prev.filter(t => t.id !== key))
    }

    const newToast: Toast = { id, type, content, duration }
    setToasts(prev => [...prev, newToast])

    if (type !== 'loading' && duration > 0) {
      setTimeout(() => removeToast(id), duration)
    }

    return id
  }, [removeToast])

  const success = useCallback((content: ReactNode, duration?: number) => {
    addToast('success', content, duration)
  }, [addToast])

  const error = useCallback((content: ReactNode, duration?: number) => {
    addToast('error', content, duration ?? 5000)
  }, [addToast])

  const warning = useCallback((content: ReactNode, duration?: number) => {
    addToast('warning', content, duration)
  }, [addToast])

  const info = useCallback((content: ReactNode, duration?: number) => {
    addToast('info', content, duration)
  }, [addToast])

  const loading = useCallback((content: ReactNode, key?: string) => {
    addToast('loading', content, 0, key)
  }, [addToast])

  const destroy = useCallback((key?: string) => {
    if (key) {
      setToasts(prev => prev.filter(t => t.id !== key))
    } else {
      setToasts([])
    }
  }, [])

  const contextValue: ToastContextType = {
    success,
    error,
    warning,
    info,
    loading,
    destroy
  }

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {typeof document !== 'undefined' && createPortal(
        <div className="toast-container">
          {toasts.map(toast => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}

// Standalone message API for compatibility with antd message
let globalToastFn: ToastContextType | null = null

export const setGlobalToast = (toastFn: ToastContextType) => {
  globalToastFn = toastFn
}

// Helper type for antd-style message config
type MessageConfig = { content: ReactNode; duration?: number; key?: string } | ReactNode

const extractContent = (config: MessageConfig): { content: ReactNode; duration?: number; key?: string } => {
  if (typeof config === 'object' && config !== null && 'content' in config) {
    return config as { content: ReactNode; duration?: number; key?: string }
  }
  return { content: config as ReactNode }
}

export const message = {
  success: (config: MessageConfig) => {
    const { content, duration } = extractContent(config)
    globalToastFn?.success(content, duration)
  },
  error: (config: MessageConfig) => {
    const { content, duration } = extractContent(config)
    globalToastFn?.error(content, duration)
  },
  warning: (config: MessageConfig) => {
    const { content, duration } = extractContent(config)
    globalToastFn?.warning(content, duration)
  },
  info: (config: MessageConfig) => {
    const { content, duration } = extractContent(config)
    globalToastFn?.info(content, duration)
  },
  loading: (config: MessageConfig) => {
    const { content, key } = extractContent(config)
    globalToastFn?.loading(content, key)
  },
  destroy: (key?: string) => globalToastFn?.destroy(key),
}

export default ToastProvider
