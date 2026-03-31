'use client'

import type { PendingVersion } from '@/service/starship'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { reviewVersion } from '@/service/starship'

type Props = {
  version: PendingVersion
  onDone: () => void
}

const ReviewPanel = ({ version, onDone }: Props) => {
  const { t } = useTranslation('starship')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleReview = async (action: 'approve' | 'reject') => {
    setSubmitting(true)
    try {
      await reviewVersion(version.id, action, comment)
      onDone()
    }
    finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-divider-subtle bg-background-default p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-text-primary">{version.app_name || '—'}</div>
          <div className="text-xs text-text-tertiary">
            {t('coach.student')}
            :
            {version.submitted_by_name || '—'}
            {' · '}
            {t('coach.version')}
            {' '}
            {version.version_number}
          </div>
        </div>
        {version.submitted_at && (
          <div className="shrink-0 text-xs text-text-quaternary">
            {new Date(version.submitted_at * 1000).toLocaleString()}
          </div>
        )}
      </div>

      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder={t('coach.commentPlaceholder')}
        rows={3}
        className="w-full resize-none rounded-lg border border-divider-regular bg-background-default px-3 py-2 text-sm outline-none focus:border-primary-400"
      />

      <div className="flex gap-2">
        <button
          onClick={() => handleReview('approve')}
          disabled={submitting}
          className="flex-1 rounded-lg bg-util-colors-green-green-600 px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {t('coach.approve')}
        </button>
        <button
          onClick={() => handleReview('reject')}
          disabled={submitting}
          className="flex-1 rounded-lg bg-util-colors-red-red-500 px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {t('coach.reject')}
        </button>
      </div>
    </div>
  )
}

export default ReviewPanel
