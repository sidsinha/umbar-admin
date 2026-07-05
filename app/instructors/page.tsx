import AdminShell from '@/components/AdminShell'
import AuthGuard from '@/components/AuthGuard'
import InstructorList from '@/components/InstructorList'

export default function InstructorsPage() {
  return (
    <AuthGuard>
      <AdminShell>
        <InstructorList />
      </AdminShell>
    </AuthGuard>
  )
}
