'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import ReviewPanel from './review-panel'
import useCoachGroupDetails from './use-coach-group-details'

type CoachGroupReviewsProps = {
  groupId: string
}

const CoachGroupReviews = ({ groupId }: CoachGroupReviewsProps) => {
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
      <div className="flex flex-wrap items-center gap-3 text-sm text-text-tertiary">
        <Link href="/starship/coach" className="inline-flex items-center gap-2 hover:text-text-primary">
          <span className="i-ri-arrow-left-line h-4 w-4" />
          {t('coach.backToGroups')}
        </Link>
        <span>/</span>
        <Link href={`/starship/coach/${groupId}`} className="hover:text-text-primary">
          {currentGroup.name}
        </Link>
      </div>

      <section className="rounded-2xl border border-divider-subtle bg-background-default p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <div className="text-sm font-medium text-primary-600">
              {t('coach.reviewsPageBadge')}
            </div>
            <h1 className="text-2xl font-semibold text-text-primary">
              {t('coach.reviewsPageTitle')}
            </h1>
            <p className="max-w-4xl text-sm leading-6 text-text-secondary">
              {t('coach.reviewsPageDescription')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-divider-subtle bg-background-default-subtle px-4 py-3">
              <div className="text-xs text-text-tertiary">{t('coach.stats.projects')}</div>
              <div className="mt-1 text-lg font-semibold text-text-primary">{groupAgents.length}</div>
            </div>
            <div className="rounded-xl border border-divider-subtle bg-background-default-subtle px-4 py-3">
              <div className="text-xs text-text-tertiary">{t('coach.stats.reviews')}</div>
              <div className="mt-1 text-lg font-semibold text-text-primary">{groupPendingVersions.length}</div>
            </div>
          </div>
        </div>
      </section>

      {!groupPendingVersions.length
        ? (
            <section className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-divider-subtle bg-background-default p-6 text-center">
              <div className="text-base font-medium text-text-primary">
                {t('coach.groupReviewsEmpty')}
              </div>
              <div className="mt-2 max-w-xl text-sm leading-6 text-text-tertiary">
                {t('coach.reviewsPageEmptyDescription')}
              </div>
            </section>
          )
        : (
            <section className="space-y-4">
              {groupPendingVersions.map(version => (
                <ReviewPanel key={version.id} version={version} onDone={reload} />
              ))}
            </section>
          )}
    </div>
  )
}

export default CoachGroupReviews
