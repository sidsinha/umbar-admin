'use client'

import Image from 'next/image'

import {
  CLASS_LOGO_TOO_LARGE_MESSAGE,
  isClassLogoTooLarge,
  readFileAsDataUri,
} from '@/lib/class-logo'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

type ClassLogoFieldProps = {
  value: string | null
  onChange: (value: string | null) => void
  onError?: (message: string) => void
}

export default function ClassLogoField({ value, onChange, onError }: ClassLogoFieldProps) {
  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      onError?.('Please choose an image file.')
      return
    }

    try {
      const dataUri = await readFileAsDataUri(file)
      if (isClassLogoTooLarge(dataUri)) {
        onError?.(CLASS_LOGO_TOO_LARGE_MESSAGE)
        return
      }
      onChange(dataUri)
    } catch {
      onError?.('Failed to read image file.')
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="class-logo">Class logo</Label>
      <div className="flex items-start gap-4">
        {value ? (
          <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-border bg-muted">
            <Image src={value} alt="Class logo preview" fill className="object-cover" unoptimized />
          </div>
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-border bg-muted text-xs text-muted-foreground">
            No logo
          </div>
        )}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="class-logo"
            className="inline-flex h-8 cursor-pointer items-center justify-center rounded-md border border-border bg-background px-3 text-xs font-medium hover:bg-muted"
          >
            Choose image
          </label>
          <input
            id="class-logo"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleFileChange}
          />
          {value ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
              Remove logo
            </Button>
          ) : null}
          <p className="text-xs text-muted-foreground">JPEG, PNG, or WebP. Max ~3 MB.</p>
        </div>
      </div>
    </div>
  )
}
