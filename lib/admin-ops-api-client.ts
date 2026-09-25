import type {
  AdminClass,
  AdminClassDetailResponse,
  AdminClassUpdateBody,
  AdminInstructorClassCreateContextResponse,
  AdminCallbackRequest,
  AdminInquiry,
  AdminInstructor,
  AdminInstructorDashboardUsageResponse,
  AdminInstructorDeleteImpactResponse,
  AdminListResult,
  AdminStatsResponse,
  AdminStudent,
  AdminStudentDeleteImpactResponse,
} from '@/lib/admin-types'
import { fetchAdminApiDelete, fetchAdminApiGet, fetchAdminApiPost } from '@/lib/fetch-admin-api'
import { ADMIN_OPS_ROOT } from '@/lib/config'

export type ListQueryParams = {
  limit?: number
  cursor?: string | null
  email?: string
  name?: string
  phone?: string
  instructorType?: string
  instructorEmail?: string
  instructorPhone?: string
  className?: string
  classId?: string
  signupSource?: string
  signupLocation?: string
}

function buildQuery(params: ListQueryParams): string {
  const search = new URLSearchParams()
  if (params.limit) search.set('limit', String(params.limit))
  if (params.cursor) search.set('cursor', params.cursor)
  if (params.email) search.set('email', params.email)
  if (params.name) search.set('name', params.name)
  if (params.phone) search.set('phone', params.phone)
  if (params.instructorType) search.set('instructorType', params.instructorType)
  if (params.instructorEmail) search.set('instructorEmail', params.instructorEmail)
  if (params.instructorPhone) search.set('instructorPhone', params.instructorPhone)
  if (params.className) search.set('className', params.className)
  if (params.classId) search.set('classId', params.classId)
  if (params.signupSource) search.set('signupSource', params.signupSource)
  if (params.signupLocation) search.set('signupLocation', params.signupLocation)
  const query = search.toString()
  return query ? `?${query}` : ''
}

export async function fetchAdminStats(options?: { days?: number }): Promise<AdminStatsResponse> {
  const days = options?.days ?? 30
  const payload = await fetchAdminApiGet(`${ADMIN_OPS_ROOT}/stats?days=${days}`)
  return payload as unknown as AdminStatsResponse
}

export async function fetchAdminInstructors(
  params: ListQueryParams = {},
): Promise<AdminListResult<AdminInstructor>> {
  const payload = await fetchAdminApiGet(`${ADMIN_OPS_ROOT}/instructors${buildQuery(params)}`)
  return payload as unknown as AdminListResult<AdminInstructor>
}

export async function fetchAdminInstructorSignupCities(): Promise<{ success: true; cities: string[] }> {
  const payload = await fetchAdminApiGet(`${ADMIN_OPS_ROOT}/instructors/signup-cities`)
  return payload as unknown as { success: true; cities: string[] }
}

export async function fetchAdminInstructorDeleteImpact(
  instructorId: string,
): Promise<AdminInstructorDeleteImpactResponse> {
  const payload = await fetchAdminApiGet(
    `${ADMIN_OPS_ROOT}/instructors/${encodeURIComponent(instructorId)}/delete-impact`,
  )
  return payload as unknown as AdminInstructorDeleteImpactResponse
}

export async function fetchAdminInstructorDashboardUsage(
  instructorId: string,
  days: 7 | 30 | 90 = 30,
): Promise<AdminInstructorDashboardUsageResponse> {
  const payload = await fetchAdminApiGet(
    `${ADMIN_OPS_ROOT}/instructors/${encodeURIComponent(instructorId)}/dashboard-usage?days=${days}`,
  )
  return payload as unknown as AdminInstructorDashboardUsageResponse
}

export async function deleteAdminInstructor(
  instructorId: string,
): Promise<{ success: true; deletedId: string }> {
  const payload = await fetchAdminApiDelete(
    `${ADMIN_OPS_ROOT}/instructors/${encodeURIComponent(instructorId)}`,
  )
  return payload as unknown as { success: true; deletedId: string }
}

export async function setAdminInstructorType(
  instructorId: string,
  instructorType: 'individual' | 'academy',
): Promise<{ success: true; instructor: { id: string; instructorType: 'individual' | 'academy' } }> {
  const payload = await fetchAdminApiPost(
    `${ADMIN_OPS_ROOT}/instructors/${encodeURIComponent(instructorId)}/instructor-type`,
    { instructorType },
  )
  return payload as unknown as {
    success: true
    instructor: { id: string; instructorType: 'individual' | 'academy' }
  }
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

export async function fetchAdminInstructorClassCreateContext(
  instructorId: string,
): Promise<AdminInstructorClassCreateContextResponse> {
  const payload = await fetchAdminApiGet(
    `${ADMIN_OPS_ROOT}/instructors/${encodeURIComponent(instructorId)}/class-create-context`,
  )
  return payload as unknown as AdminInstructorClassCreateContextResponse
}

export async function createAdminClass(
  instructorId: string,
  body: AdminClassUpdateBody,
): Promise<{ success: true; class: { id: string } }> {
  const payload = await fetchAdminApiPost(
    `${ADMIN_OPS_ROOT}/instructors/${encodeURIComponent(instructorId)}/classes/create`,
    body as unknown as Record<string, unknown>,
  )
  return payload as unknown as { success: true; class: { id: string } }
}

export async function fetchAdminClass(classId: string): Promise<AdminClassDetailResponse> {
  const payload = await fetchAdminApiGet(
    `${ADMIN_OPS_ROOT}/classes/${encodeURIComponent(classId)}`,
  )
  return payload as unknown as AdminClassDetailResponse
}

export async function updateAdminClass(
  classId: string,
  body: AdminClassUpdateBody,
): Promise<{ success: true; class: AdminClassDetailResponse['class']; organizationName?: string | null }> {
  const payload = await fetchAdminApiPost(
    `${ADMIN_OPS_ROOT}/classes/${encodeURIComponent(classId)}/update`,
    body as unknown as Record<string, unknown>,
  )
  return payload as unknown as {
    success: true
    class: AdminClassDetailResponse['class']
    organizationName?: string | null
  }
}
export async function fetchAdminStudents(
  params: ListQueryParams = {},
): Promise<AdminListResult<AdminStudent>> {
  const payload = await fetchAdminApiGet(`${ADMIN_OPS_ROOT}/students${buildQuery(params)}`)
  return payload as unknown as AdminListResult<AdminStudent>
}

export async function fetchAdminStudentDeleteImpact(
  studentId: string,
): Promise<AdminStudentDeleteImpactResponse> {
  const payload = await fetchAdminApiGet(
    `${ADMIN_OPS_ROOT}/students/${encodeURIComponent(studentId)}/delete-impact`,
  )
  return payload as unknown as AdminStudentDeleteImpactResponse
}

export async function deleteAdminStudent(
  studentId: string,
): Promise<{ success: true; deletedId: string }> {
  const payload = await fetchAdminApiDelete(
    `${ADMIN_OPS_ROOT}/students/${encodeURIComponent(studentId)}`,
  )
  return payload as unknown as { success: true; deletedId: string }
}

export async function fetchAdminInquiries(
  params: ListQueryParams = {},
): Promise<AdminListResult<AdminInquiry>> {
  const payload = await fetchAdminApiGet(`${ADMIN_OPS_ROOT}/inquiries${buildQuery(params)}`)
  return payload as unknown as AdminListResult<AdminInquiry>
}

export async function fetchAdminCallbackRequests(
  params: ListQueryParams = {},
): Promise<AdminListResult<AdminCallbackRequest>> {
  const payload = await fetchAdminApiGet(`${ADMIN_OPS_ROOT}/callback-requests${buildQuery(params)}`)
  return payload as unknown as AdminListResult<AdminCallbackRequest>
}
