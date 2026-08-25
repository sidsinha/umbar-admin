'use client'

import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/utils'

type FormDialogProps = {
  open: boolean
  title: string
  children: React.ReactNode
  saveLabel?: string
  cancelLabel?: string
  saving?: boolean
  saveDisabled?: boolean
  onSave: () => void
  onCancel: () => void
  className?: string
}

export default function FormDialog({
  open,
  title,
  children,
  saveLabel = 'Save',
  cancelLabel = 'Cancel',
  saving = false,
  saveDisabled = false,
  onSave,
  onCancel,
  className,
}: FormDialogProps) {
  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !saving) onCancel()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, saving, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/40"
        disabled={saving}
        onClick={() => {
          if (!saving) onCancel()
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-dialog-title"
        className={cn(
          'relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-border bg-card shadow-lg',
          className,
        )}
      >
        <div className="border-b border-border px-5 py-4">
          <h3 id="form-dialog-title" className="text-lg font-semibold text-foreground">
            {title}
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 text-sm">{children}</div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            {cancelLabel}
          </Button>
          <Button onClick={onSave} disabled={saving || saveDisabled}>
            {saving ? 'Saving…' : saveLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
