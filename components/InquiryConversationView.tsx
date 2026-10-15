'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'

import { fetchAdminInquiryConversation } from '@/lib/admin-ops-api-client'
import { umbarClassPublicUrl } from '@/lib/config'
import { cn, formatDate } from '@/utils'

function senderLabel(senderType: 'lead' | 'instructor' | 'student'): string {
  if (senderType === 'lead') return 'Lead'
  if (senderType === 'instructor') return 'Instructor'
  return 'Student'
}

export default function InquiryConversationView({ conversationId }: { conversationId: string }) {
  const detailQuery = useQuery({
    queryKey: ['admin-inquiry-conversation', conversationId],
    queryFn: () => fetchAdminInquiryConversation(conversationId),
  })

  if (detailQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading conversation…</p>
  }

  if (detailQuery.error) {
    return (
      <p className="text-sm text-destructive">
        {detailQuery.error instanceof Error
          ? detailQuery.error.message
          : 'Failed to load conversation.'}
      </p>
    )
  }

  const conversation = detailQuery.data?.conversation
  if (!conversation) {
    return <p className="text-sm text-destructive">Conversation not found.</p>
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/inquiries/"
          className="text-sm text-primary hover:underline"
        >
          ← Back to inquiries
        </Link>
        <h2 className="mt-3 text-2xl font-semibold text-foreground">Class enquiry</h2>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Lead</dt>
            <dd className="font-medium text-foreground">{conversation.leadName ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Phone</dt>
            <dd className="font-medium text-foreground">{conversation.phone ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Class</dt>
            <dd className="font-medium text-foreground">
              {conversation.classId ? (
                <a
                  href={umbarClassPublicUrl(conversation.classId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {conversation.className ?? conversation.classId}
                </a>
              ) : (
                (conversation.className ?? '—')
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Instructor</dt>
            <dd className="font-medium text-foreground">{conversation.instructorName ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Started</dt>
            <dd className="font-medium text-foreground">{formatDate(conversation.createdAt)}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-medium text-foreground">Messages</h3>
        </div>
        {conversation.messages.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">No messages in this thread.</p>
        ) : (
          <ul className="divide-y divide-border">
            {conversation.messages.map((message) => (
              <li key={message.id} className="px-4 py-4">
                <div className="mb-1 flex flex-wrap items-baseline gap-2">
                  <span className="font-medium text-foreground">{message.senderName}</span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      message.senderType === 'lead' && 'bg-muted text-muted-foreground',
                      message.senderType === 'instructor' && 'bg-primary/10 text-primary',
                      message.senderType === 'student' && 'bg-secondary text-secondary-foreground',
                    )}
                  >
                    {senderLabel(message.senderType)}
                  </span>
                  {message.createdAt ? (
                    <span className="text-xs text-muted-foreground">
                      {formatDate(message.createdAt)}
                    </span>
                  ) : null}
                </div>
                <p className="whitespace-pre-wrap text-sm text-foreground">{message.text}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
