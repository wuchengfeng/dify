'use client'

import type { StarshipAgent, StudentDashboard } from '@/service/starship'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchStudentDashboard, setStarshipMockRole } from '@/service/starship'

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

const ProjectRow = ({
  agent,
  actionLabel,
  detail,
}: {
  agent: StarshipAgent
  actionLabel: string
  detail: string
}) => {
  return (
    <Link
      href={`/starship/workspace/${agent.id}`}
      className="flex items-center justify-between gap-4 rounded-[22px] border border-white/8 bg-white/[0.03] px-5 py-4 transition-all hover:border-sky-400/30 hover:bg-white/[0.05]"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-[16px] text-xl"
            style={{ backgroundColor: agent.icon_background || '#1D4ED8' }}
          >
            {agent.icon || '🤖'}
          </div>
          <div className="min-w-0">
            <div className="truncate text-base font-semibold text-white">
              {agent.name}
            </div>
            <div className="mt-1 truncate text-sm text-slate-400">
              {detail}
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <div className="text-sm font-medium text-sky-200">{actionLabel}</div>
        <div className="mt-1 text-xs text-slate-500">
          {formatTime(agent.updated_at || agent.created_at)}
        </div>
      </div>
    </Link>
  )
}

const StudentDashboardPage = () => {
  const { t } = useTranslation(['starship', 'common'])
  const [dashboard, setDashboard] = useState<StudentDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setStarshipMockRole('student')
      .then(() => fetchStudentDashboard())
      .then(setDashboard)
      .catch((err) => {
        setError(err instanceof Error ? err.message : t('student.currentProjectsEmpty'))
      })
      .finally(() => setLoading(false))
  }, [t])

  if (loading) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-slate-400">
        {t('loading', { ns: 'common' })}
        ...
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-slate-400">
        {error || t('student.currentProjectsEmpty')}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <section className="px-1">
        <h1 className="text-3xl font-semibold text-white">
          {t('student.title')}
        </h1>
      </section>

      <section className="rounded-[28px] border border-white/8 bg-[#0c1729] p-6 shadow-[0_16px_40px_rgba(2,8,23,0.24)]">
        <div>
          <h2 className="text-lg font-semibold text-white">
            {t('student.currentProjectsTitle')}
          </h2>
        </div>

        <div className="mt-4 space-y-3">
          {!dashboard.current_projects.length
            ? (
                <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center text-sm text-slate-400">
                  {t('student.currentProjectsEmpty')}
                </div>
              )
            : dashboard.current_projects.map(agent => (
                <ProjectRow
                  key={agent.id}
                  agent={agent}
                  actionLabel={t('student.openCurrentProject')}
                  detail={dashboard.current_task
                    ? t('student.currentTaskLine', {
                        group: dashboard.current_group?.name || t('student.badge'),
                        task: dashboard.current_task.title,
                      })
                    : agent.description}
                />
              ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-sky-400/20 bg-[#10203a] p-6 shadow-[0_16px_40px_rgba(2,8,23,0.24)]">
        <div>
          <h2 className="text-lg font-semibold text-white">
            {t('student.publishProjectsTitle')}
          </h2>
        </div>

        <div className="mt-4 space-y-3">
          {!dashboard.publish_agents.length
            ? (
                <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center text-sm text-slate-400">
                  {t('student.publishProjectsEmpty')}
                </div>
              )
            : dashboard.publish_agents.map(agent => (
                <ProjectRow
                  key={agent.id}
                  agent={agent}
                  actionLabel={t('student.openPublishProject')}
                  detail={t('student.publishProjectSource', {
                    group: agent.group_name || t('student.publishProjectsTitle'),
                    task: agent.task_title || t('student.openPublishProject'),
                  })}
                />
              ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-white/8 bg-[#0c1729] p-6 shadow-[0_16px_40px_rgba(2,8,23,0.2)]">
        <div>
          <h2 className="text-lg font-semibold text-white">
            {t('student.historyProjectsTitle')}
          </h2>
        </div>

        <div className="mt-4 space-y-3">
          {!dashboard.history_agents.length
            ? (
                <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center text-sm text-slate-400">
                  {t('student.historyProjectsEmpty')}
                </div>
              )
            : dashboard.history_agents.map(agent => (
                <ProjectRow
                  key={agent.id}
                  agent={agent}
                  actionLabel={agent.project_kind === 'history' ? '查看课堂记录' : t('student.openHistoryProject')}
                  detail={t('student.historyProjectSource', {
                    group: agent.group_name || t('student.historyProjectsTitle'),
                    task: agent.task_title || t('student.openHistoryProject'),
                  })}
                />
              ))}
        </div>
      </section>
    </div>
  )
}

export default StudentDashboardPage
