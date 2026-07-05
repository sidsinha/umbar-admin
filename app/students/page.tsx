import AdminShell from '@/components/AdminShell'
import AuthGuard from '@/components/AuthGuard'
import StudentList from '@/components/StudentList'

export default function StudentsPage() {
  return (
    <AuthGuard>
      <AdminShell>
        <StudentList />
      </AdminShell>
    </AuthGuard>
  )
}
