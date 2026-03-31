'use client'

import type { AgentVersion } from '@/service/starship'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchAgentVersions, submitAgentVersion } from '@/service/starship'

type Props = {
  appId: string
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'text-text-tertiary bg-background-section',
  submitted: 'text-util-colors-blue-blue-500 bg-blue-50',
  approved: 'text-util-colors-green-green-600 bg-green-50',
  rejected: 'text-util-colors-red-red-500 bg-red-50',
}

const VersionTimeline = ({ appId }: Props) => {
  const { t } = useTranslation('starship')
  const [versions, setVersions] = useState<AgentVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState('')

  const load = () => {
    fetchAgentVersions(appId)
      .then(res => setVersions(res.items))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setLoading(true) // eslint-disable-line react-hooks-extra/no-direct-set-state-in-use-effect -- initial fetch
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId])

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await submitAgentVersion(appId)
      setMsg(t('myAgents.submitSuccess'))
      load()
      setTimeout(() => setMsg(''), 4000)
    }
    finally {
      setSubmitting(false)
    }
  }

  if (loading)
    return <div className="flex h-32 items-center justify-center text-sm text-text-tertiary">Loading...</div>

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-text-primary">{t('versions.title')}</h3>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-xl bg-primary-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {submitting ? '...' : t('versions.submit')}
        </button>
      </div>

      {msg && (
        <div className="mb-3 rounded-xl bg-green-50 px-4 py-2 text-sm text-green-700">{msg}</div>
      )}

      {!versions.length
        ? <div className="flex h-32 items-center justify-center text-sm text-text-tertiary">{t('versions.noData')}</div>
        : (
            <div className="space-y-3">
              {versions.map(v => (
                <div key={v.id} className="rounded-xl border border-divider-subtle bg-background-default p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-text-primary">
                      {t('versions.version')}
                      {v.version_number}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[v.status] ?? ''}`}>
                      {t(`versions.status.${v.status}`)}
                    </span>
                  </div>

                  {v.submitted_at && (
                    <div className="mt-1 text-xs text-text-tertiary">
                      {t('versions.submittedAt')}
                      :
                      {new Date(v.submitted_at * 1000).toLocaleString()}
                    </div>
                  )}

                  {v.review_comment && (
                    <div className="mt-2 rounded-lg bg-background-section px-3 py-2 text-sm text-text-secondary">
                      <span className="font-medium text-text-tertiary">
                        {t('versions.coachComment')}
                        :
                        {' '}
                      </span>
                      {v.review_comment}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
    </div>
  )
}

export default VersionTimeline
