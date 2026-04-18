import React, { useEffect, useCallback, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { createRoot, Root } from 'react-dom/client'
import 'src/assets/css/modal.css'

// Grok-style minimalistic close icon
const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
)

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  footer?: ReactNode
  width?: number | string
  closable?: boolean
  maskClosable?: boolean
  centered?: boolean
  className?: string
}

interface ModalComponent extends React.FC<ModalProps> {
  confirm: typeof confirm
}

const Modal: ModalComponent = ({
  open,
  onClose,
  title,
  children,
  footer,
  width = 520,
  closable = true,
  maskClosable = true,
  centered = true,
  className,
}) => {
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && closable) {
      onClose()
    }
  }, [onClose, closable])

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [open, handleEscape])

  if (!open) return null

  const widthStyle = typeof width === 'number' ? `${width}px` : width

  const modalContent = (
    <div
      className="modal-overlay"
      onClick={maskClosable ? onClose : undefined}
    >
      {/* Backdrop */}
      <div className="modal-backdrop" />

      {/* Modal Container */}
      <div className={`modal-container ${centered ? '' : 'top'}`}>
        <div
          className={`modal-content ${className || ''}`}
          style={{ width: widthStyle }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          {(title || closable) && (
            <div className="modal-header">
              {title && (
                <h3 className="modal-title">
                  {title}
                </h3>
              )}
              {closable && (
                <button
                  onClick={onClose}
                  className="modal-close-btn"
                  aria-label="Close"
                >
                  <CloseIcon />
                </button>
              )}
            </div>
          )}

          {/* Body */}
          <div className="modal-body">
            {children}
          </div>

          {/* Footer */}
          {footer !== undefined && (
            <div className="modal-footer">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

// Confirm dialog
interface ConfirmConfig {
  title: ReactNode
  content: ReactNode
  okText?: string
  cancelText?: string
  okType?: 'primary' | 'danger'
  icon?: ReactNode
  okButtonProps?: { danger?: boolean; loading?: boolean }
  onOk?: () => void | Promise<void>
  onCancel?: () => void
}

let confirmRoot: Root | null = null
let confirmContainer: HTMLDivElement | null = null

const confirm = (config: ConfirmConfig) => {
  if (!confirmContainer) {
    confirmContainer = document.createElement('div')
    document.body.appendChild(confirmContainer)
  }

  const {
    title,
    content,
    okText = 'OK',
    cancelText = 'Cancel',
    okType = 'primary',
    okButtonProps,
    onOk,
    onCancel
  } = config

  // Use okButtonProps.danger if provided, otherwise fall back to okType === 'danger'
  const isDanger = okButtonProps?.danger || okType === 'danger'

  const close = () => {
    // Restore body scroll
    document.body.style.overflow = ''

    if (confirmRoot) {
      confirmRoot.unmount()
      confirmRoot = null
    }
    if (confirmContainer) {
      confirmContainer.innerHTML = ''
    }
  }

  // Hide body scroll when confirm opens
  document.body.style.overflow = 'hidden'

  const handleOk = async () => {
    if (onOk) {
      await onOk()
    }
    close()
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
    close()
  }

  const ConfirmDialog = () => (
    <div
      className="modal-overlay"
      onClick={handleCancel}
    >
      <div className="modal-backdrop" />
      <div className="modal-container">
        <div
          className="modal-content"
          style={{ width: '416px' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="modal-header">
            <h3 className="modal-title">
              {title}
            </h3>
            <button
              onClick={handleCancel}
              className="modal-close-btn"
              aria-label="Close"
            >
              <CloseIcon />
            </button>
          </div>
          <div className="modal-body">
            <p className="modal-confirm-content">{content}</p>
          </div>
          <div className="modal-footer">
            <button
              onClick={handleCancel}
              className="modal-btn modal-btn-cancel"
            >
              {cancelText}
            </button>
            <button
              onClick={handleOk}
              className={`modal-btn ${isDanger ? 'modal-btn-danger' : 'modal-btn-primary'}`}
            >
              {okText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  // Use React 18's createRoot
  confirmRoot = createRoot(confirmContainer)
  confirmRoot.render(<ConfirmDialog />)
}

// Attach confirm to Modal
Modal.confirm = confirm

export { Modal, confirm }
export default Modal
