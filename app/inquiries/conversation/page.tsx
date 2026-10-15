'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

import AdminShell from '@/components/AdminShell'
import AuthGuard from '@/components/AuthGuard'
import InquiryConversationView from '@/components/InquiryConversationView'

function ConversationContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')?.trim() ?? ''

  if (!id) {
    return <p className="text-destructive">Missing conversation id.</p>
  }

  return <InquiryConversationView conversationId={id} />
}

export default function InquiryConversationPage() {
  return (
    <AuthGuard>
      <AdminShell>
        <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
          <ConversationContent />
        </Suspense>
      </AdminShell>
    </AuthGuard>
  )
}
