'use client'

import type { PendingVersion } from '@/service/starship'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchPendingVersions } from '@/service/starship'
import ReviewPanel from './review-panel'

const CoachDashboard = () => {
  const { t } = useTranslation('starship')
  const [pending, setPending] = useState<PendingVersion[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    fetchPendingVersions()
      .then(res => setPending(res.items))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setLoading(true) // eslint-disable-line react-hooks-extra/no-direct-set-state-in-use-effect -- initial fetch
    load()
  }, [])

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-text-primary">
        {t('coach.title')}
      </h2>

      {loading && (
        <div className="flex h-32 items-center justify-center text-sm text-text-tertiary">Loading...</div>
      )}

      {!loading && !pending.length && (
        <div className="flex h-32 items-center justify-center text-sm text-text-tertiary">
          {t('coach.noPending')}
        </div>
      )}

      {!loading && pending.length > 0 && (
        <div className="space-y-4">
          {pending.map(v => (
            <ReviewPanel key={v.id} version={v} onDone={load} />
          ))}
        </div>
      )}
    </div>
  )
}

export default CoachDashboard
