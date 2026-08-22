import type {
  AdminClass,
  AdminInquiry,
  AdminInstructor,
  AdminInstructorDeleteImpactResponse,
  AdminListResult,
  AdminStatsResponse,
  AdminStudent,
} from '@/lib/admin-types'
import { fetchAdminApiDelete, fetchAdminApiGet, fetchAdminApiPost } from '@/lib/fetch-admin-api'
import { ADMIN_OPS_ROOT } from '@/lib/config'

export type ListQueryParams = {
  limit?: number
  cursor?: string | null
  email?: string
  instructorEmail?: string
  classId?: string
}

function buildQuery(params: ListQueryParams): string {
  const search = new URLSearchParams()
  if (params.limit) search.set('limit', String(params.limit))
  if (params.cursor) search.set('cursor', params.cursor)
  if (params.email) search.set('email', params.email)
  if (params.instructorEmail) search.set('instructorEmail', params.instructorEmail)
  if (params.classId) search.set('classId', params.classId)
  const query = search.toString()
  return query ? `?${query}` : ''
}

export async function fetchAdminStats(): Promise<AdminStatsResponse> {
  const payload = await fetchAdminApiGet(`${ADMIN_OPS_ROOT}/stats`)
  return payload as unknown as AdminStatsResponse
}

export async function fetchAdminInstructors(
  params: ListQueryParams = {},
): Promise<AdminListResult<AdminInstructor>> {
  const payload = await fetchAdminApiGet(`${ADMIN_OPS_ROOT}/instructors${buildQuery(params)}`)
  return payload as unknown as AdminListResult<AdminInstructor>
}

export async function fetchAdminInstructorDeleteImpact(
  instructorId: string,
): Promise<AdminInstructorDeleteImpactResponse> {
  const payload = await fetchAdminApiGet(
    `${ADMIN_OPS_ROOT}/instructors/${encodeURIComponent(instructorId)}/delete-impact`,
  )
  return payload as unknown as AdminInstructorDeleteImpactResponse
}

export async function deleteAdminInstructor(
  instructorId: string,
): Promise<{ success: true; deletedId: string }> {
  const payload = await fetchAdminApiDelete(
    `${ADMIN_OPS_ROOT}/instructors/${encodeURIComponent(instructorId)}`,
  )
  return payload as unknown as { success: true; deletedId: string }
}

export async function fetchAdminClasses(
  params: ListQueryParams = {},
): Promise<AdminListResult<AdminClass>> {
  const payload = await fetchAdminApiGet(`${ADMIN_OPS_ROOT}/classes${buildQuery(params)}`)
  return payload as unknown as AdminListResult<AdminClass>
}

export async function setAdminClassMarketplaceVisibility(
  classId: string,
  enabled: boolean,
): Promise<{ success: true; class: { id: string; status: string } }> {
  const payload = await fetchAdminApiPost(
    `${ADMIN_OPS_ROOT}/classes/${encodeURIComponent(classId)}/marketplace-visibility`,
    { enabled },
  )
  return payload as unknown as { success: true; class: { id: string; status: string } }
}

export async function fetchAdminStudents(
  params: ListQueryParams = {},
): Promise<AdminListResult<AdminStudent>> {
  const payload = await fetchAdminApiGet(`${ADMIN_OPS_ROOT}/students${buildQuery(params)}`)
  return payload as unknown as AdminListResult<AdminStudent>
}

export async function fetchAdminInquiries(
  params: ListQueryParams = {},
): Promise<AdminListResult<AdminInquiry>> {
  const payload = await fetchAdminApiGet(`${ADMIN_OPS_ROOT}/inquiries${buildQuery(params)}`)
  return payload as unknown as AdminListResult<AdminInquiry>
}
