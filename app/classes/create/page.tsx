'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

import AdminShell from '@/components/AdminShell'
import AuthGuard from '@/components/AuthGuard'
import ClassEditForm from '@/components/classes/ClassEditForm'

function CreateClassContent() {
  const searchParams = useSearchParams()
  const instructorId = searchParams.get('instructorId')?.trim() ?? ''

  if (!instructorId) {
    return <p className="text-destructive">Missing instructor id.</p>
  }

  return <ClassEditForm instructorId={instructorId} />
}

export default function CreateClassPage() {
  return (
    <AuthGuard>
      <AdminShell>
        <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
          <CreateClassContent />
        </Suspense>
      </AdminShell>
    </AuthGuard>
  )
}
