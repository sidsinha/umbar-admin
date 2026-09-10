'use client'

import { useState } from 'react'

import { getTagCategory, getTagDisplayName, TAG_COLORS } from '@/components/classes/class-tags'
import type { ClassTagGroup } from '@/lib/marketplace-api-client'
import { cn } from '@/utils'

type ClassTagSelectorProps = {
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
  tagGroups: ClassTagGroup[]
  maxTags?: number
}

export default function ClassTagSelector({
  selectedTags,
  onTagsChange,
  tagGroups,
  maxTags = 10,
}: ClassTagSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const resolvedActiveCategory =
    activeCategory && tagGroups.some((g) => g.id === activeCategory)
      ? activeCategory
      : tagGroups[0]?.id || null
  const activeGroup = tagGroups.find((g) => g.id === resolvedActiveCategory) || null

  function handleTagToggle(tag: string, groupId: string) {
    const tagKey = `${groupId}:${tag}`
    if (selectedTags.includes(tagKey)) {
      onTagsChange(selectedTags.filter((item) => item !== tagKey))
      return
    }
    if (selectedTags.length >= maxTags) return
    onTagsChange([...selectedTags, tagKey])
  }

  function removeTag(tagKey: string) {
    onTagsChange(selectedTags.filter((item) => item !== tagKey))
  }

  return (
    <div className="space-y-4">
      {selectedTags.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Selected tags ({selectedTags.length}/{maxTags})
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tagKey) => {
              const category = getTagCategory(tagKey)
              return (
                <span
                  key={tagKey}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-white',
                    TAG_COLORS[category] || TAG_COLORS.custom,
                  )}
                >
                  {getTagDisplayName(tagKey)}
                  <button
                    type="button"
                    className="rounded-full px-1 hover:bg-black/10"
                    onClick={() => removeTag(tagKey)}
                    aria-label={`Remove ${getTagDisplayName(tagKey)}`}
                  >
                    ×
                  </button>
                </span>
              )
            })}
          </div>
        </div>
      ) : null}

      {tagGroups.length > 0 ? (
        <>
          <div className="flex flex-wrap gap-2 border-b border-border pb-2">
            {tagGroups.map((group) => (
              <button
                key={group.id}
                type="button"
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium',
                  resolvedActiveCategory === group.id
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80',
                )}
                onClick={() => setActiveCategory(group.id)}
              >
                {group.label}
              </button>
            ))}
          </div>

          <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
            {(activeGroup?.options || []).map((tag) => {
              const tagKey = `${activeGroup!.id}:${tag}`
              const isSelected = selectedTags.includes(tagKey)
              return (
                <button
                  key={tagKey}
                  type="button"
                  disabled={!isSelected && selectedTags.length >= maxTags}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/40',
                  )}
                  onClick={() => handleTagToggle(tag, activeGroup!.id)}
                >
                  {tag}
                </button>
              )
            })}
          </div>
        </>
      ) : null}
    </div>
  )
}
