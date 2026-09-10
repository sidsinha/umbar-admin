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
  instructorType: 'individual' | 'academy'
  isActive: boolean
  activeClasses: number
  activeClassSubjects: string[]
  signupGeo: Record<string, unknown> | null
  signupSource: Record<string, unknown> | null
  dashboardPageViews30d: number
  lastDashboardVisitAt: string | null
  createdAt: string
  updatedAt: string
}

export type AdminInstructorDashboardUsage = {
  pageViews: number
  lastActiveDate: string | null
  screens: { screenName: string; pageTitle: string; count: number }[]
  navClicks: { navItem: string; count: number }[]
  actions: { action: string; label: string; count: number }[]
  dailyPageViews: { date: string; count: number }[]
}

export type AdminInstructorDashboardUsageResponse = {
  success: true
  instructor: {
    id: string
    name: string
    email: string | null
  }
  days: number
  usage: AdminInstructorDashboardUsage
}

export type AdminInstructorDeleteImpact = {
  classesTotal: number
  classesActive: number
  classesCompleted: number
  classesArchived: number
  enrollments: number
  attendanceRecords: number
  conversations: number
  ratings: number
}

export type AdminInstructorDeleteImpactResponse = {
  success: true
  instructor: {
    id: string
    name: string
    email: string | null
  }
  impact: AdminInstructorDeleteImpact
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
  gaPageViewCount: number
  createdFrom: 'website' | 'app' | 'admin' | null
  createdAt: string
  updatedAt: string
}

export type ClassDefaultFee = {
  basis: 'per_class' | 'per_month'
  amount: number
  currency: string
}

export type ClassLocation = {
  city?: string | null
  state?: string | null
  country?: string | null
  areaLabel?: string | null
  placeId?: string | null
  locationText?: string | null
  formattedAddress?: string | null
  locality?: string | null
  lat?: number | null
  lng?: number | null
}

export type AdminClassDetail = {
  id: string
  name: string
  description: string
  whatStudentsWillLearn: string
  classType: string
  location: ClassLocation | null
  videoLink: string | null
  classLogo: string | null
  hasTrialClass: boolean
  category: string | null
  categoryId: string | null
  subcategoryId: string | null
  tags: string[]
  status: string
  /** This specific class's individual/academy segment (distinct from the instructor's account type below). */
  instructorType: 'individual' | 'academy' | null
  defaultFee: ClassDefaultFee | null
  createdAt: string | null
  updatedAt: string | null
}

export type AdminClassDetailResponse = {
  success: true
  class: AdminClassDetail
  instructorName: string | null
  instructorEmail: string | null
  /** The instructor's account type — may be "both", in which case each class picks its own type. */
  instructorType: 'individual' | 'academy' | 'both'
  organizationName: string | null
}

export type AdminInstructorClassCreateContextResponse = {
  success: true
  instructorName: string | null
  instructorEmail: string | null
  instructorType: 'individual' | 'academy' | 'both'
  organizationName: string | null
  location: ClassLocation | null
}

export type AdminClassUpdateBody = {
  name: string
  description: string
  whatStudentsWillLearn: string
  classType: string
  location: ClassLocation | null
  videoLink: string | null
  classLogo?: string | null
  hasTrialClass: boolean
  category?: string
  categoryId?: string
  subcategoryId?: string
  tags: string[]
  status: string
  instructorType?: 'individual' | 'academy'
  organizationName?: string | null
  defaultFee?: ClassDefaultFee | null
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

export type AdminStudentDeleteImpact = {
  enrollmentsTotal: number
  enrollmentsActive: number
  trialSessions: number
  joinRequests: number
  cancellationRequests: number
  classInterests: number
  conversations: number
  attendanceRecords: number
  ratingsGiven: number
  pendingInvitations: number
}

export type AdminStudentDeleteImpactResponse = {
  success: true
  student: {
    id: string
    name: string
    email: string | null
  }
  impact: AdminStudentDeleteImpact
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
  dashboardUsage: {
    activeInstructors7d: number
    pageViews7d: number
    navClicks7d: number
    actions7d: number
    aiGenerateClicks7d: number
    screens: { screenName: string; pageTitle: string; count: number }[]
    navItems: { navItem: string; count: number }[]
    actionItems: { action: string; label: string; count: number }[]
    instructors: {
      instructorId: string
      name: string
      pageViews: number
      lastActiveDate: string | null
    }[]
    instructorIdentitiesAvailable: boolean
  }
}

export type AdminStatsResponse = {
  success: true
  stats: AdminStats
}
