import React, { useRef } from 'react'
import { Button, Tooltip, message } from 'src/components/ui'
import { useTranslation } from 'src/providers/TranslationProvider'
import 'src/assets/css/file-upload.css'

// Grok-style minimalistic icons
const PaperClipIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
  </svg>
)

const FileIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--file-icon-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <path d="M14 2v6h6" />
  </svg>
)

const CloseCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--file-remove-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M15 9l-6 6M9 9l6 6" />
  </svg>
)

interface FileUploadButtonProps {
  onFileSelect: (file: File) => void
  onFileRemove?: () => void
  selectedFile?: File | null
  disabled?: boolean
  acceptedFileTypes?: string
  maxFileSize?: number // in MB
}

const FileUploadButton: React.FC<FileUploadButtonProps> = ({
  onFileSelect,
  onFileRemove,
  selectedFile,
  disabled = false,
  acceptedFileTypes = '.pdf,.doc,.docx,.txt,.png,.jpg,.jpeg',
  maxFileSize = 10
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { translate } = useTranslation()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > maxFileSize) {
      message.error(`${translate('file_too_large', 'ფაილი ძალიან დიდია')}. ${translate('max_size', 'მაქსიმალური ზომა')}: ${maxFileSize}MB`)
      return
    }

    // Validate file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!acceptedFileTypes.includes(fileExtension || '')) {
      message.error(translate('invalid_file_type', 'ფაილის ფორმატი არასწორია'))
      return
    }

    onFileSelect(file)
    message.success(`${translate('file_attached', 'ფაილი დაერთო')}: ${file.name}`)

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onFileRemove?.()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="file-upload-container">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFileTypes}
        onChange={handleFileChange}
        className="file-upload-input"
        disabled={disabled}
      />

      {selectedFile ? (
        <div className="file-upload-badge">
          <FileIcon />
          <span className="file-upload-badge-name">
            {selectedFile.name}
          </span>
          <button
            type="button"
            onClick={handleRemove}
            className="file-upload-remove-btn"
            aria-label={translate('remove_file', 'Remove file')}
          >
            <CloseCircleIcon />
          </button>
        </div>
      ) : (
        <Tooltip title={translate('attach_file', 'ფაილის დამატება')}>
          <Button
            variant="text"
            icon={<PaperClipIcon />}
            onClick={handleButtonClick}
            disabled={disabled}
            className="file-upload-btn"
          />
        </Tooltip>
      )}
    </div>
  )
}

export default FileUploadButton
