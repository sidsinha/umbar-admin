import AdminShell from '@/components/AdminShell'
import AuthGuard from '@/components/AuthGuard'
import InquiryList from '@/components/InquiryList'

export default function InquiriesPage() {
  return (
    <AuthGuard>
      <AdminShell>
        <InquiryList />
      </AdminShell>
    </AuthGuard>
  )
}
