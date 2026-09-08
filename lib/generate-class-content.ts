import { fetchAdminApiPost } from '@/lib/fetch-admin-api'
import { ADMIN_OPS_ROOT } from '@/lib/config'

export type GenerateClassContentInput = {
  category?: string
  categoryId?: string
  subcategoryId?: string
  classType?: string
  instructorType?: 'individual' | 'academy'
  freeformNotes?: string
}

export type GenerateClassContentResult =
  | {
      success: true
      titles: string[]
      description: string
      whatStudentsWillLearn: string[]
      suggestedTags: string[]
    }
  | { success: false; error: string }

function parseGenerateClassContentPayload(payload: Record<string, unknown>): GenerateClassContentResult {
  return {
    success: true,
    titles: Array.isArray(payload.titles) ? (payload.titles as string[]) : [],
    description: typeof payload.description === 'string' ? payload.description : '',
    whatStudentsWillLearn: Array.isArray(payload.whatStudentsWillLearn)
      ? (payload.whatStudentsWillLearn as string[])
      : [],
    suggestedTags: Array.isArray(payload.suggestedTags) ? (payload.suggestedTags as string[]) : [],
  }
}

export async function generateAdminClassContent(
  input: GenerateClassContentInput,
): Promise<GenerateClassContentResult> {
  try {
    const payload = await fetchAdminApiPost(`${ADMIN_OPS_ROOT}/classes/generate-content`, input)
    return parseGenerateClassContentPayload(payload as Record<string, unknown>)
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unable to generate class details. Please try again.',
    }
  }
}
