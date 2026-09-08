import { useState } from 'react'

import type {
  GenerateClassContentInput,
  GenerateClassContentResult,
} from '@/lib/generate-class-content'

type GenerateSuccess = Extract<GenerateClassContentResult, { success: true }>

export function useClassAIGenerator(
  generate: (input: GenerateClassContentInput) => Promise<GenerateClassContentResult>,
) {
  const [freeformNotes, setFreeformNotes] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [hasGeneratedOnce, setHasGeneratedOnce] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [titles, setTitles] = useState<string[] | null>(null)
  const [selectedTitleIndex, setSelectedTitleIndex] = useState<number | null>(null)

  async function generateContent(
    input: GenerateClassContentInput,
    onSuccess: (result: GenerateSuccess) => void,
  ) {
    setError(null)
    setIsGenerating(true)
    const result = await generate(input)
    setIsGenerating(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    setHasGeneratedOnce(true)
    setTitles(result.titles)
    if (result.titles.length > 0) setSelectedTitleIndex(0)
    onSuccess(result)
  }

  return {
    freeformNotes,
    setFreeformNotes,
    isGenerating,
    hasGeneratedOnce,
    error,
    titles,
    setTitles,
    selectedTitleIndex,
    setSelectedTitleIndex,
    generateContent,
  }
}
