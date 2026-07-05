export type AdminListPagination = {
  nextCursor: string | null
  hasMore: boolean
}

export type AdminListResult<T> = {
  success: true
  items: T[]
  pagination: AdminListPagination
  totalCount: number
}

export type AdminInstructor = {
  id: string
  firstName: string
  lastName: string | null
  email: string | null
  phoneNumber: string | null
  gender: string | null
  isActive: boolean
  activeClasses: number
  createdAt: string
  updatedAt: string
}

export type AdminClass = {
  id: string
  name: string
  instructorName: string | null
  instructorEmail: string | null
  category: string | null
  location: Record<string, unknown> | null
  status: string
  currentEnrollments: number
  createdAt: string
  updatedAt: string
}

export type AdminStudent = {
  id: string
  firstName: string
  lastName: string | null
  email: string | null
  phoneNumber: string | null
  gender: string | null
  isActive: boolean
  currentEnrollments: number
  createdAt: string
  updatedAt: string
}

export type AdminInquiry = {
  id: string
  leadName: string | null
  className: string | null
  classId: string | null
  phone: string | null
  messagePreview: string | null
  createdAt: string
}

export type AdminStats = {
  instructors: { total: number; active: number; inactive: number }
  classes: { total: number; active: number; completed: number; archived: number }
  students: { total: number; active: number; inactive: number }
  inquiries: { total: number; last7Days: number }
}

export type AdminStatsResponse = {
  success: true
  stats: AdminStats
}
