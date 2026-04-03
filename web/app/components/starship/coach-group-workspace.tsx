'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import AgentCard from './agent-card'
import ReviewPanel from './review-panel'
import useCoachGroupDetails from './use-coach-group-details'

type CoachGroupWorkspaceProps = {
  groupId: string
}

const CoachGroupWorkspace = ({ groupId }: CoachGroupWorkspaceProps) => {
  const { t } = useTranslation(['starship', 'common'])
  const {
    currentGroup,
    groupAgents,
    groupPendingVersions,
    loading,
    reload,
  } = useCoachGroupDetails(groupId)

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-text-tertiary">
        {t('loading', { ns: 'common' })}
        ...
      </div>
    )
  }

  if (!currentGroup) {
    return (
      <div className="space-y-6">
        <Link
          href="/starship/coach"
          className="inline-flex items-center gap-2 text-sm text-text-tertiary hover:text-text-primary"
        >
          <span className="i-ri-arrow-left-line h-4 w-4" />
          {t('coach.backToGroups')}
        </Link>

        <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-divider-subtle bg-background-default p-6 text-center">
          <div className="text-base font-medium text-text-primary">
            {t('coach.groupUnavailable')}
          </div>
          <div className="mt-2 max-w-xl text-sm leading-6 text-text-tertiary">
            {t('coach.groupUnavailableDescription')}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link
        href="/starship/coach"
        className="inline-flex items-center gap-2 text-sm text-text-tertiary hover:text-text-primary"
      >
        <span className="i-ri-arrow-left-line h-4 w-4" />
        {t('coach.backToGroups')}
      </Link>

      <section className="rounded-2xl border border-divider-subtle bg-background-default p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <div className="text-sm font-medium text-primary-600">
              {t('coach.currentGroup')}
            </div>
            <h1 className="text-2xl font-semibold text-text-primary">
              {currentGroup.name}
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-text-secondary">
              {currentGroup.description || t('coach.groupWorkspaceDescription')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-divider-subtle bg-background-default-subtle px-4 py-3">
              <div className="text-xs text-text-tertiary">{t('coach.stats.projects')}</div>
              <div className="mt-1 text-lg font-semibold text-text-primary">{groupAgents.length}</div>
            </div>
            <div className="rounded-xl border border-divider-subtle bg-background-default-subtle px-4 py-3">
              <div className="text-xs text-text-tertiary">{t('coach.stats.reviews')}</div>
              <div className="mt-1 text-lg font-semibold text-text-primary">{groupPendingVersions.length}</div>
            </div>
            <div className="rounded-xl border border-divider-subtle bg-background-default-subtle px-4 py-3">
              <div className="text-xs text-text-tertiary">{t('coach.stats.classroom')}</div>
              <div className="mt-1 text-lg font-semibold text-text-primary">{t('coach.stats.ready')}</div>
            </div>
            <div className="rounded-xl border border-divider-subtle bg-background-default-subtle px-4 py-3">
              <div className="text-xs text-text-tertiary">{t('coach.stats.main')}</div>
              <div className="mt-1 text-lg font-semibold text-text-primary">{t('coach.stats.coachOnly')}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-divider-subtle bg-background-default p-5">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            {t('coach.quickActionsTitle')}
          </h2>
          <p className="mt-1 text-sm leading-6 text-text-tertiary">
            {t('coach.quickActionsDescription')}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Link
            href={`/starship/coach/${groupId}/classroom`}
            className="rounded-xl border border-divider-subtle bg-background-default-subtle p-4 transition-all hover:border-primary-300 hover:shadow-sm"
          >
            <div className="text-sm font-semibold text-text-primary">
              {t('coach.openClassroomTitle')}
            </div>
            <div className="mt-2 text-sm leading-6 text-text-tertiary">
              {t('coach.openClassroomDescription')}
            </div>
          </Link>

          <Link
            href={`/starship/coach/${groupId}/reviews`}
            className="rounded-xl border border-divider-subtle bg-background-default-subtle p-4 transition-all hover:border-primary-300 hover:shadow-sm"
          >
            <div className="text-sm font-semibold text-text-primary">
              {t('coach.openReviewsTitle')}
            </div>
            <div className="mt-2 text-sm leading-6 text-text-tertiary">
              {t('coach.openReviewsDescription')}
            </div>
          </Link>

          <Link
            href={`/starship/create?groupId=${groupId}`}
            className="rounded-xl border border-divider-subtle bg-background-default-subtle p-4 transition-all hover:border-primary-300 hover:shadow-sm"
          >
            <div className="text-sm font-semibold text-text-primary">
              {t('coach.openCreateTitle')}
            </div>
            <div className="mt-2 text-sm leading-6 text-text-tertiary">
              {t('coach.openCreateDescription')}
            </div>
          </Link>

        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-divider-subtle bg-background-default p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                {t('coach.groupProjectsTitle')}
              </h2>
              <p className="mt-1 text-sm leading-6 text-text-tertiary">
                {t('coach.groupProjectsDescription')}
              </p>
            </div>
            {!!groupAgents.length && (
              <Link
                href={`/starship/coach/${groupId}/classroom`}
                className="rounded-lg border border-divider-regular px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-background-default-hover"
              >
                {t('coach.openClassroomCta')}
              </Link>
            )}
          </div>

          <div className="mt-5">
            {!groupAgents.length
              ? (
                  <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-divider-subtle bg-background-default-subtle px-4 text-center text-sm text-text-tertiary">
                    {t('coach.groupProjectsEmpty')}
                  </div>
                )
              : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {groupAgents.slice(0, 4).map(agent => (
                      <AgentCard key={agent.id} agent={agent} />
                    ))}
                  </div>
                )}
          </div>
        </section>

        <section className="rounded-2xl border border-divider-subtle bg-background-default p-5">
          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                {t('coach.classroomShellTitle')}
              </h2>
              <p className="mt-1 text-sm leading-6 text-text-tertiary">
                {t('coach.classroomShellDescription')}
              </p>
            </div>

            <div className="rounded-xl border border-dashed border-divider-subtle bg-background-default-subtle p-4">
              <div className="text-sm font-medium text-text-primary">
                {t('coach.mainRuleTitle')}
              </div>
              <div className="mt-2 text-sm leading-6 text-text-tertiary">
                {t('coach.mainRuleDescription')}
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-divider-subtle bg-background-default p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              {t('coach.groupReviewsTitle')}
            </h2>
            <p className="mt-1 text-sm leading-6 text-text-tertiary">
              {t('coach.groupReviewsDescription')}
            </p>
          </div>
          {!!groupPendingVersions.length && (
            <Link
              href={`/starship/coach/${groupId}/reviews`}
              className="rounded-lg border border-divider-regular px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-background-default-hover"
            >
              {t('coach.openReviewsCta')}
            </Link>
          )}
        </div>

        <div className="mt-5">
          {!groupPendingVersions.length
            ? (
                <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-divider-subtle bg-background-default-subtle px-4 text-center text-sm text-text-tertiary">
                  {t('coach.groupReviewsEmpty')}
                </div>
              )
            : (
                <div className="space-y-4">
                  {groupPendingVersions.slice(0, 2).map(version => (
                    <ReviewPanel key={version.id} version={version} onDone={reload} />
                  ))}
                </div>
              )}
        </div>
      </section>
    </div>
  )
}

export default CoachGroupWorkspace
