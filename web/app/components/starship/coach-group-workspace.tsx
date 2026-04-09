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

  const hasTask = Boolean(currentGroup.task_id)
  const taskStatusLine = currentGroup.task_main_published
    ? '主版本已经发布，这个班的项目已经结束。'
    : currentGroup.task_published_to_students
      ? '任务已经发给孩子，现在可以去看他们的进度。'
      : hasTask
        ? '任务已经建好，还没发给孩子。'
        : '还没有任务，先点“新建任务”。'

  const classroomReadyText = currentGroup.task_main_published
    ? '已结束'
    : currentGroup.task_published_to_students
      ? '进行中'
      : hasTask
        ? '待发布'
        : '未开始'
  const mainReadyText = currentGroup.task_main_published
    ? '已发布'
    : '未发布'
  const taskActionLabel = currentGroup.task_main_published
    ? '查看任务'
    : hasTask
      ? '管理任务'
      : '新建任务'

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
              <div className="mt-1 text-lg font-semibold text-text-primary">{classroomReadyText}</div>
            </div>
            <div className="rounded-xl border border-divider-subtle bg-background-default-subtle px-4 py-3">
              <div className="text-xs text-text-tertiary">{t('coach.stats.main')}</div>
              <div className="mt-1 text-lg font-semibold text-text-primary">{mainReadyText}</div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-divider-subtle bg-background-default-subtle px-4 py-4 text-sm leading-6 text-text-secondary">
          {taskStatusLine}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/starship/create?groupId=${groupId}`}
            className="inline-flex items-center justify-center rounded-xl bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
          >
            {taskActionLabel}
          </Link>
          <Link
            href={`/starship/coach/${groupId}/classroom`}
            className="inline-flex items-center justify-center rounded-xl border border-divider-subtle px-5 py-3 text-sm font-medium text-text-primary transition hover:bg-background-default-subtle"
          >
            看孩子进度
          </Link>
          <Link
            href={`/starship/coach/${groupId}/reviews`}
            className="inline-flex items-center justify-center rounded-xl border border-divider-subtle px-5 py-3 text-sm font-medium text-text-primary transition hover:bg-background-default-subtle"
          >
            看审核
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-divider-subtle bg-background-default p-5">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            现在就做
          </h2>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Link
            href={`/starship/create?groupId=${groupId}`}
            className="rounded-xl border border-divider-subtle bg-background-default-subtle p-4 transition-all hover:border-primary-300 hover:shadow-sm"
          >
            <div className="text-sm font-semibold text-text-primary">
              班级任务
            </div>
            <div className="mt-2 text-sm leading-6 text-text-tertiary">
              新建、修改、发布这个班的任务。
            </div>
          </Link>

          <Link
            href={`/starship/coach/${groupId}/classroom`}
            className="rounded-xl border border-divider-subtle bg-background-default-subtle p-4 transition-all hover:border-primary-300 hover:shadow-sm"
          >
            <div className="text-sm font-semibold text-text-primary">
              课堂进度
            </div>
            <div className="mt-2 text-sm leading-6 text-text-tertiary">
              看孩子现在做到哪一步，也可以现场测试。
            </div>
          </Link>

          <Link
            href={`/starship/coach/${groupId}/reviews`}
            className="rounded-xl border border-divider-subtle bg-background-default-subtle p-4 transition-all hover:border-primary-300 hover:shadow-sm"
          >
            <div className="text-sm font-semibold text-text-primary">
              小组审核
            </div>
            <div className="mt-2 text-sm leading-6 text-text-tertiary">
              只看这个班交上来的版本。
            </div>
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-divider-subtle bg-background-default p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                这个班现在的项目
              </h2>
              <p className="mt-1 text-sm leading-6 text-text-tertiary">
                任务发布以后，这里会开始出现孩子们正在做的项目。
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
                    先建任务并发布，孩子的项目才会出现在这里。
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
                孩子当前进度
              </h2>
              <p className="mt-1 text-sm leading-6 text-text-tertiary">
                任务发出去以后，这里会显示这个班孩子的实时进度。
              </p>
            </div>

            <div className="rounded-xl border border-dashed border-divider-subtle bg-background-default-subtle p-4">
              <div className="text-sm font-medium text-text-primary">
                项目结束规则
              </div>
              <div className="mt-2 text-sm leading-6 text-text-tertiary">
                只有教练发布主版本后，这个项目才算结束，孩子才能 fork 自己的继续版。
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-divider-subtle bg-background-default p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              这个班的审核
            </h2>
            <p className="mt-1 text-sm leading-6 text-text-tertiary">
              看这个班提交上来的版本，不会混进别的班。
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
