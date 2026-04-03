'use client'

import type { StarshipGroup } from '@/service/starship'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchMyGroups, setStarshipMockRole } from '@/service/starship'

const formatTime = (timestamp?: number) => {
  if (!timestamp)
    return '—'

  return new Intl.DateTimeFormat(undefined, {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp * 1000))
}

const GroupListSection = ({
  title,
  description,
  groups,
  emptyText,
  ctaLabel,
}: {
  title: string
  description: string
  groups: StarshipGroup[]
  emptyText: string
  ctaLabel: string
}) => {
  const { t } = useTranslation('starship')

  if (!groups.length) {
    return (
      <section className="rounded-[32px] border border-white/8 bg-[#0c1729] p-6 shadow-[0_20px_60px_rgba(2,8,23,0.3)]">
        <div>
          <h2 className="text-xl font-semibold text-white">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-sm leading-6 text-slate-400">
              {description}
            </p>
          )}
        </div>

        <div className="mt-5 rounded-[28px] border border-dashed border-white/10 bg-white/[0.02] px-4 py-10 text-center text-sm text-slate-400">
          {emptyText}
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-[32px] border border-white/8 bg-[#0c1729] p-6 shadow-[0_20px_60px_rgba(2,8,23,0.3)]">
      <div>
        <h2 className="text-xl font-semibold text-white">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm leading-6 text-slate-400">
            {description}
          </p>
        )}
      </div>

      <div className="mt-5 space-y-4">
        {groups.map(group => (
          <Link
            key={group.id}
            href={`/starship/coach/${group.id}`}
            className="flex flex-col gap-4 rounded-[28px] border border-white/8 bg-white/[0.04] p-5 transition-all hover:border-sky-400/30 hover:bg-white/[0.06]"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-lg font-semibold text-white">
                    {group.name}
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    group.status === 'history'
                      ? 'bg-slate-500/15 text-slate-300'
                      : 'bg-emerald-500/15 text-emerald-200'
                  }`}
                  >
                    {group.task_title || '—'}
                  </span>
                </div>
                <div className="max-w-3xl text-sm leading-6 text-slate-300">
                  {group.description}
                </div>
              </div>

              <span className="rounded-full bg-sky-400 px-4 py-2 text-sm font-medium text-slate-950">
                {ctaLabel}
              </span>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-slate-400">
              <div>{t('coach.studentCount', { count: group.student_count || 0 })}</div>
              <div>{formatTime(group.updated_at || group.created_at)}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

const CoachDashboard = () => {
  const { t } = useTranslation(['starship', 'common'])
  const [groups, setGroups] = useState<StarshipGroup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setStarshipMockRole('coach')
      .then(() => fetchMyGroups())
      .then(res => setGroups(res.items))
      .catch(() => setGroups([]))
      .finally(() => setLoading(false))
  }, [])

  const currentGroups = useMemo(
    () => groups.filter(group => group.status !== 'history'),
    [groups],
  )

  const historyGroups = useMemo(
    () => groups.filter(group => group.status === 'history'),
    [groups],
  )

  if (loading) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-slate-400">
        {t('loading', { ns: 'common' })}
        ...
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <section className="px-1">
        <h1 className="text-3xl font-semibold text-white">
          {t('coach.homeTitle')}
        </h1>
      </section>

      {!groups.length
        ? (
            <section className="rounded-[32px] border border-dashed border-white/10 bg-[#0c1729] px-4 py-16 text-center text-sm text-slate-400">
              {t('coach.noGroupsDescription')}
            </section>
          )
        : (
            <>
              <GroupListSection
                title={t('coach.currentClassesTitle')}
                description={t('coach.currentClassesDescription')}
                groups={currentGroups}
                emptyText={t('coach.currentClassesEmpty')}
                ctaLabel={t('coach.enterGroup')}
              />

              <GroupListSection
                title={t('coach.historyProjectsTitle')}
                description={t('coach.historyProjectsDescription')}
                groups={historyGroups}
                emptyText={t('coach.historyProjectsEmpty')}
                ctaLabel={t('coach.openHistoryProject')}
              />
            </>
          )}
    </div>
  )
}

export default CoachDashboard
