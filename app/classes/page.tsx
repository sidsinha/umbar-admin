import AdminShell from '@/components/AdminShell'
import AuthGuard from '@/components/AuthGuard'
import ClassList from '@/components/ClassList'

export default function ClassesPage() {
  return (
    <AuthGuard>
      <AdminShell>
        <ClassList />
      </AdminShell>
    </AuthGuard>
  )
}
