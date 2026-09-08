'use client'

import { Loader2, PenLine, RotateCcw, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/utils'

export function ClassAIAssistant({
  freeformNotes,
  onFreeformNotesChange,
  isGenerating,
  hasGeneratedOnce,
  error,
  titles,
  selectedTitleIndex,
  onSelectTitle,
  disabled,
  generateDisabled,
  onGenerate,
  suggestionTitlePrefix,
  getFullTitleForTail,
  titleMaxLength,
}: {
  freeformNotes: string
  onFreeformNotesChange: (value: string) => void
  isGenerating: boolean
  hasGeneratedOnce: boolean
  error: string | null
  titles: string[] | null
  selectedTitleIndex: number | null
  onSelectTitle: (index: number, title: string) => void
  disabled?: boolean
  generateDisabled?: boolean
  onGenerate: () => void
  suggestionTitlePrefix?: string
  getFullTitleForTail?: (tail: string) => string
  titleMaxLength?: number
}) {
  return (
    <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
      <div className="space-y-1.5">
        <Label htmlFor="ai-freeform-notes">Tell us about this class (optional)</Label>
        <p className="text-xs text-muted-foreground">
          Generate a matching class title, description, and what students will learn.
        </p>
        <Textarea
          id="ai-freeform-notes"
          value={freeformNotes}
          disabled={disabled}
          onChange={(event) => onFreeformNotesChange(event.target.value.slice(0, 500))}
          placeholder="Anything else we should know when generating content?"
          rows={2}
          maxLength={500}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || isGenerating || generateDisabled}
          onClick={onGenerate}
          className="h-7 gap-1 border-primary px-2 text-xs text-primary hover:bg-primary/10 hover:text-primary"
        >
          {isGenerating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : hasGeneratedOnce ? (
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
          )}
          {hasGeneratedOnce ? 'Regenerate with AI' : 'Generate with AI'}
        </Button>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {titles && titles.length > 0 ? (
        <div className="space-y-2 border-t border-primary/20 pt-2">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <PenLine className="h-4 w-4 text-primary" aria-hidden />
            Suggested titles
          </p>
          {titles.map((title, index) => {
            const isSelected = index === selectedTitleIndex
            const displayTitle = getFullTitleForTail
              ? getFullTitleForTail(title)
              : suggestionTitlePrefix
                ? `${suggestionTitlePrefix.trimEnd()}${title.trim() ? ` ${title.trim()}` : ''}`
                : title
            const isTooLong =
              typeof titleMaxLength === 'number' && displayTitle.trim().length > titleMaxLength
            return (
              <label
                key={index}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-sm transition-colors',
                  isSelected
                    ? 'border-primary bg-primary/5 font-medium text-primary'
                    : 'border-border bg-background hover:bg-muted/50',
                  isTooLong && 'border-destructive/40',
                )}
              >
                <input
                  type="radio"
                  name="ai-title"
                  className="shrink-0"
                  checked={isSelected}
                  onChange={() => onSelectTitle(index, title)}
                />
                <span className="flex-1">{displayTitle}</span>
                {isTooLong ? (
                  <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-destructive">
                    Too long
                  </span>
                ) : index === 0 ? (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Recommended
                  </span>
                ) : null}
              </label>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
