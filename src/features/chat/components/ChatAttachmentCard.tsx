// ============================================================
// Chat Attachment Card
// Premium file attachment display with icon, progress, preview
// ============================================================

import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  FileText, Image as ImageIcon, Table, Code, Archive, X,
  Download, Eye, FileSpreadsheet, FileCode, Loader2,
  CheckCircle2, AlertCircle, Presentation,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useModalA11y } from '@/hooks/useModalA11y'
import type { ChatAttachment, PendingFile } from '../types'
import { FILE_TYPE_CONFIG } from '../types'
import { getAssetUrl } from '../services/chat.service'

// ============================================================
// Uploaded Attachment Card (shown in messages)
// ============================================================

interface ChatAttachmentCardProps {
  attachment: ChatAttachment
  variant?: 'default' | 'compact'
  onPreview?: (url: string) => void
}

export const ChatAttachmentCard = React.memo(function ChatAttachmentCard({
  attachment,
  variant = 'default',
  onPreview,
}: ChatAttachmentCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const isImage = attachment.type.startsWith('image/')
  const config = getFileConfig(attachment.type)
  const url = getAssetUrl(attachment.url)

  // Image preview — render as a real <button> so it's keyboard-accessible.
  if (isImage) {
    return (
      <motion.button
        type="button"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative group/image cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onPreview?.(url)}
        aria-label={`Preview image: ${attachment.name}`}
      >
        <img
          src={url}
          alt={attachment.name}
          loading="lazy"
          className={cn(
            'rounded-lg object-cover border border-border/50 transition-transform',
            variant === 'compact' ? 'max-h-32 w-auto' : 'max-h-48 w-auto'
          )}
        />
        <div className={cn(
          'absolute inset-0 rounded-lg bg-black/40 flex items-center justify-center transition-opacity',
          isHovered ? 'opacity-100' : 'opacity-0 group-hover/image:opacity-100 group-focus-visible/image:opacity-100'
        )}>
          <Eye className="h-5 w-5 text-white" />
        </div>
      </motion.button>
    )
  }

  // File card
  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'group/file flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30',
        'px-3.5 py-2.5 transition-all hover:bg-muted/60 hover:border-border hover:shadow-sm',
        variant === 'compact' && 'px-3 py-2',
        'max-w-xs'
      )}
    >
      {/* Icon */}
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${config.color}15` }}
      >
        <config.icon className="h-4.5 w-4.5" style={{ color: config.color }} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate text-foreground">
          {attachment.name}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {config.label}
          {attachment.size && ` · ${formatFileSize(attachment.size)}`}
        </p>
      </div>

      {/* Download icon */}
      <Download className="h-4 w-4 text-muted-foreground opacity-0 group-hover/file:opacity-100 transition-opacity shrink-0" />
    </motion.a>
  )
})

// ============================================================
// Pending File Chip (shown in composer before upload)
// ============================================================

interface PendingFileChipProps {
  file: PendingFile
  onRemove: (id: string) => void
}

export const PendingFileChip = React.memo(function PendingFileChip({
  file,
  onRemove,
}: PendingFileChipProps) {
  const isImage = file.file.type.startsWith('image/')
  const config = getFileConfig(file.file.type)
  const hasError = !!file.error
  const isUploading = file.progress !== undefined && file.progress < 100 && !hasError

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        'group/chip relative flex items-center gap-2.5 rounded-xl border bg-card p-2.5 pr-3',
        'transition-all hover:border-primary/30 hover:shadow-sm',
        hasError && 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20',
        isUploading && 'border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/10',
      )}
    >
      {/* Preview or Icon */}
      {isImage && file.preview ? (
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
          <img src={file.preview} alt={file.file.name} className="h-full w-full object-cover" />
          {isUploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 className="h-4 w-4 text-white animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: hasError ? '#fee2e220' : `${config.color}15` }}
        >
          {hasError ? (
            <AlertCircle className="h-4.5 w-4.5 text-red-500" />
          ) : isUploading ? (
            <Loader2 className="h-4.5 w-4.5 animate-spin" style={{ color: config.color }} />
          ) : (
            <config.icon className="h-4.5 w-4.5" style={{ color: config.color }} />
          )}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-medium truncate',
          hasError && 'text-red-600 dark:text-red-400'
        )}>
          {file.file.name}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">
            {hasError ? (
              <span className="text-red-500">{file.error}</span>
            ) : isUploading ? (
              <span>Uploading {file.progress}%</span>
            ) : file.uploaded ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                Ready
              </span>
            ) : (
              <span>{formatFileSize(file.file.size)}</span>
            )}
          </span>
        </div>

        {/* Progress bar */}
        {isUploading && (
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${file.progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
      </div>

      {/* Remove button */}
      <button
        onClick={() => onRemove(file.id)}
        className="shrink-0 rounded-md p-1 text-muted-foreground opacity-0 group-hover/chip:opacity-100
          hover:bg-destructive/10 hover:text-destructive transition-all"
        aria-label={`Remove ${file.file.name}`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  )
})

// ============================================================
// Image Preview Modal
// ============================================================

interface ImagePreviewModalProps {
  imageUrl: string | null
  onClose: () => void
}

export const ImagePreviewModal = React.memo(function ImagePreviewModal({
  imageUrl,
  onClose,
}: ImagePreviewModalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isOpen = !!imageUrl

  useModalA11y({
    open: isOpen,
    onClose,
    containerRef,
    labelId: 'image-preview-title',
  })

  if (!imageUrl) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-preview-title"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="relative max-h-[90vh] max-w-[90vw] focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="image-preview-title" className="sr-only">Image preview</h2>
        <img
          src={imageUrl}
          alt="Image preview"
          className="max-h-[85vh] max-w-[85vw] rounded-xl object-contain shadow-2xl"
        />
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-3 -right-3 flex h-9 w-9 items-center justify-center rounded-full
            bg-background border border-border shadow-lg text-foreground
            hover:bg-muted transition-colors
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Close preview"
        >
          <X className="h-4 w-4" />
        </button>
      </motion.div>
    </motion.div>
  )
})

// ============================================================
// Helpers
// ============================================================

function getFileConfig(type: string): { icon: typeof FileText; color: string; label: string } {
  // Check exact match
  if (FILE_TYPE_CONFIG[type]) {
    const c = FILE_TYPE_CONFIG[type]
    return { ...c, icon: getIconComponent(c.icon) }
  }

  // Check prefix match (for image/*, etc.)
  for (const [key, value] of Object.entries(FILE_TYPE_CONFIG)) {
    if (key.endsWith('/') && type.startsWith(key)) {
      return { ...value, icon: getIconComponent(value.icon) }
    }
  }

  // Default
  return { icon: FileText, color: '#6b7280', label: 'File' }
}

function getIconComponent(iconName: string): typeof FileText {
  const iconMap: Record<string, typeof FileText> = {
    FileText,
    Image: ImageIcon,
    Table,
    Code,
    Archive,
    FileSpreadsheet,
    FileCode,
    // Previously missing — PowerPoint files fell back to FileText silently.
    Presentation,
  }
  return iconMap[iconName] || FileText
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}