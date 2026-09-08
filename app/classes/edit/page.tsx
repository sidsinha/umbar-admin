'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

import AdminShell from '@/components/AdminShell'
import AuthGuard from '@/components/AuthGuard'
import ClassEditForm from '@/components/classes/ClassEditForm'

function EditClassContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')?.trim() ?? ''

  if (!id) {
    return <p className="text-destructive">Missing class id.</p>
  }

  return <ClassEditForm classId={id} />
}

export default function EditClassPage() {
  return (
    <AuthGuard>
      <AdminShell>
        <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
          <EditClassContent />
        </Suspense>
      </AdminShell>
    </AuthGuard>
  )
}
