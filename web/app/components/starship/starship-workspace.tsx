'use client'

import type { ChangeEvent, ReactNode } from 'react'
import type { KnowledgeItem, StarshipWorkspace } from '@/service/starship'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  fetchStarshipWorkspace,
  forkStarshipWorkspace,
  runStarshipWorkspaceTest,
  saveStarshipWorkspace,
} from '@/service/starship'
import useBrowserVoiceInput from './use-browser-voice-input'

type StarshipWorkspaceProps = {
  appId: string
}

const ALWAYS_ON_TOOLS = {
  web_search: true,
  image_recognition: true,
  read_aloud: true,
} as const

const QUICK_TEST_SUGGESTION_KEYS = [
  'workspace.quickTestOne',
  'workspace.quickTestTwo',
  'workspace.quickTestThree',
] as const

type WorkspaceCardProps = {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

const WorkspaceCard = ({ title, description, action, children, className = '' }: WorkspaceCardProps) => (
  <section className={`rounded-[24px] border border-white/10 bg-[#0f1b30] p-5 shadow-[0_18px_50px_rgba(2,8,23,0.24)] ${className}`.trim()}>
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-sm font-medium text-sky-200">
          {title}
        </div>
        {description && (
          <div className="mt-1 text-sm leading-6 text-slate-300">
            {description}
          </div>
        )}
      </div>
      {action}
    </div>
    <div className="mt-4">
      {children}
    </div>
  </section>
)

const StarshipWorkspacePage = ({ appId }: StarshipWorkspaceProps) => {
  const { t } = useTranslation(['starship', 'common'])
  const [workspace, setWorkspace] = useState<StarshipWorkspace | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [testing, setTesting] = useState(false)
  const [savingCoachDraft, setSavingCoachDraft] = useState(false)
  const [forking, setForking] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [form, setForm] = useState({
    name: '',
    description: '',
    pre_prompt: '',
    share_author_name: '',
    share_intro: '',
    opening_line: '',
    test_input: '',
  })
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([])

  const flash = useCallback((message: string) => {
    setFeedback(message)
    window.setTimeout(() => setFeedback(''), 3000)
  }, [])

  const appendTextToField = useCallback((field: 'pre_prompt' | 'test_input', text: string) => {
    const normalized = text.trim()
    if (!normalized)
      return

    setForm((prev) => {
      const current = prev[field].trim()
      return {
        ...prev,
        [field]: field === 'test_input'
          ? (current ? `${current} ${normalized}` : normalized)
          : (current ? `${current}\n${normalized}` : normalized),
      }
    })
  }, [])

  const {
    interimText,
    isListening,
    isSupported: isVoiceSupported,
    startListening,
    stopListening,
  } = useBrowserVoiceInput({
    onFinalText: text => appendTextToField('test_input', text),
    onError: (error) => {
      if (error === 'not_supported')
        flash(t('workspace.voiceUnsupported'))
      else if (error === 'not_allowed')
        flash(t('workspace.voiceDenied'))
      else
        flash(t('workspace.voiceFailed'))
    },
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchStarshipWorkspace(appId)
      setWorkspace(result)
      setForm({
        name: result.agent.name,
        description: result.agent.description,
        pre_prompt: result.pre_prompt,
        share_author_name: result.share_author_name,
        share_intro: result.share_intro,
        opening_line: result.opening_line,
        test_input: '',
      })
      setKnowledgeItems(result.knowledge_items)
    }
    catch (err) {
      setError(err instanceof Error ? err.message : t('workspace.noTaskDescription'))
      setWorkspace(null)
    }
    finally {
      setLoading(false)
    }
  }, [appId, t])

  useEffect(() => {
    void load()
  }, [load])

  const homeHref = workspace?.session.role === 'coach'
    ? (workspace.group ? `/starship/coach/${workspace.group.id}` : '/starship/coach')
    : '/starship/student'

  const updateField = (field: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleKnowledgeUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (!files.length)
      return

    const uploaded = files.map(file => ({
      id: `${file.name}-${file.size}-${Date.now()}`,
      name: file.name,
      size_label: file.size >= 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.max(1, Math.round(file.size / 1024))} KB`,
    }))

    setKnowledgeItems(prev => [...uploaded, ...prev])
    event.target.value = ''
  }

  const handleRemoveKnowledge = (itemId: string) => {
    setKnowledgeItems(prev => prev.filter(item => item.id !== itemId))
  }

  const handleTest = async () => {
    if (!form.test_input.trim())
      return

    const shouldKeepHistoryReadOnly = workspace?.session.role === 'student' && workspace?.project_kind === 'history'

    setTesting(true)
    try {
      const result = await runStarshipWorkspaceTest(appId, {
        input: form.test_input.trim(),
        draft: shouldKeepHistoryReadOnly
          ? undefined
          : {
              name: form.name,
              description: form.description,
              pre_prompt: form.pre_prompt,
              share_author_name: form.share_author_name,
              share_intro: form.share_intro,
              opening_line: form.opening_line,
              tool_settings: ALWAYS_ON_TOOLS,
              knowledge_items: knowledgeItems,
            },
        persist_snapshot: workspace?.session.role === 'student' && !shouldKeepHistoryReadOnly,
      })

      await load()
      updateField('test_input', '')
      flash(result.snapshot_created ? t('workspace.autoVersionSaved') : t('workspace.testSaved'))
    }
    finally {
      setTesting(false)
    }
  }

  const handleCoachSave = async () => {
    if (workspace?.session.role !== 'coach')
      return

    setSavingCoachDraft(true)
    try {
      await saveStarshipWorkspace(appId, {
        name: form.name,
        description: form.description,
        pre_prompt: form.pre_prompt,
        share_author_name: form.share_author_name,
        share_intro: form.share_intro,
        opening_line: form.opening_line,
        tool_settings: ALWAYS_ON_TOOLS,
        knowledge_items: knowledgeItems,
      })
      await load()
      flash(t('workspace.coachSaved'))
    }
    finally {
      setSavingCoachDraft(false)
    }
  }

  const handleFork = async () => {
    setForking(true)
    try {
      const result = await forkStarshipWorkspace(appId)
      flash('已经帮你生成自己的继续版，马上带你进入。')
      window.location.href = `/starship/workspace/${result.id}`
    }
    catch (err) {
      flash(err instanceof Error ? err.message : '继续版本创建失败，请稍后再试。')
    }
    finally {
      setForking(false)
    }
  }

  const handleVoiceInput = () => {
    if (!isVoiceSupported) {
      flash(t('workspace.voiceUnsupported'))
      return
    }

    if (isListening) {
      stopListening()
      return
    }

    startListening()
  }

  if (loading) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-slate-400">
        {t('loading', { ns: 'common' })}
        ...
      </div>
    )
  }

  if (!workspace) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-slate-400">
        {error || t('workspace.noTaskDescription')}
      </div>
    )
  }

  const sourceLine = workspace.group
    ? t('workspace.sourceLine', {
        group: workspace.group.name,
        task: workspace.task?.title || t('workspace.historyBadge'),
      })
    : t('workspace.noTaskDescription')

  const isStudentPublishProject = workspace.session.role === 'student' && workspace.project_kind === 'publish'
  const isStudentHistoryProject = workspace.session.role === 'student' && workspace.project_kind === 'history'
  const readOnlyStudentHistory = isStudentHistoryProject
  const showStudentPublish = workspace.session.role === 'student' && isStudentPublishProject
  const showCoachMeta = workspace.session.role === 'coach'
  const testSuggestionLabels = QUICK_TEST_SUGGESTION_KEYS.map(key => t(key))
  const badgeLabel = isStudentPublishProject
    ? t('workspace.publishProjectBadge')
    : workspace.is_history_project
      ? t('workspace.historyBadge')
      : t('workspace.currentBadge')
  const sidebarClassName = workspace.session.role === 'student'
    ? 'order-1 space-y-4 xl:order-2'
    : 'order-1 space-y-4 xl:sticky xl:top-4 xl:order-2'
  const publishCenterPath = `/starship/publish/${appId}`

  return (
    <div className="space-y-4 pb-8">
      <section className="rounded-[26px] border border-white/10 bg-[#101a2d] px-5 py-4 shadow-[0_18px_50px_rgba(2,8,23,0.34)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={homeHref}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
              >
                <span className="i-ri-arrow-left-line h-4 w-4" />
                {t('workspace.backHome')}
              </Link>
              <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-200">
                {badgeLabel}
              </span>
              {workspace.group && (
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-300">
                  {sourceLine}
                </span>
              )}
            </div>
            <h1 className="mt-3 text-2xl font-semibold text-white">
              {form.name}
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            {showCoachMeta && (
              <button
                type="button"
                onClick={handleCoachSave}
                disabled={savingCoachDraft}
                className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 hover:bg-slate-100 disabled:opacity-60"
              >
                {savingCoachDraft ? t('workspace.coachSaving') : t('workspace.coachSave')}
              </button>
            )}
          </div>
        </div>
      </section>

      {feedback && (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          {feedback}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] xl:items-start">
        <aside className={sidebarClassName}>
          <WorkspaceCard
            title={t('workspace.testTitle')}
            description={workspace.session.role === 'student' ? t('workspace.testAutoVersionHint') : t('workspace.testDescription')}
          >
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {workspace.session.role === 'student' && testSuggestionLabels.map(label => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => updateField('test_input', label)}
                    className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-xs font-medium text-sky-100 hover:bg-sky-400/20"
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="rounded-[24px] border border-white/8 bg-[#0b1424] p-4">
                <div className="h-[260px] space-y-3 overflow-y-auto pr-1">
                  {workspace.test_history.length === 0
                    ? (
                        <div className="text-sm leading-6 text-slate-400">
                          {t('workspace.noTests')}
                        </div>
                      )
                    : workspace.test_history.slice(0, 6).map(record => (
                        <div key={record.id} className="space-y-2">
                          <div className="ml-auto max-w-[88%] rounded-2xl bg-white/8 px-4 py-3 text-sm leading-6 text-slate-100">
                            {record.input}
                          </div>
                          <div className="max-w-[92%] rounded-2xl bg-sky-500/15 px-4 py-3 text-sm leading-6 text-sky-50">
                            {record.output}
                          </div>
                        </div>
                      ))}
                </div>
              </div>

              <div className="space-y-3">
                <textarea
                  value={form.test_input}
                  onChange={e => updateField('test_input', e.target.value)}
                  placeholder={t('workspace.testPlaceholder')}
                  rows={4}
                  className="w-full resize-none rounded-[24px] border border-white/10 bg-[#0b1424] px-4 py-4 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-300"
                />

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleVoiceInput}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition ${isListening ? 'border-emerald-400/40 bg-emerald-400/15 text-emerald-100' : 'border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]'}`}
                  >
                    <span className={`h-4 w-4 ${isListening ? 'i-ri-stop-circle-line' : 'i-ri-mic-line'}`} />
                    {isListening ? t('workspace.voiceStop') : t('workspace.voiceStart')}
                  </button>

                  <button
                    type="button"
                    onClick={handleTest}
                    disabled={testing || !form.test_input.trim()}
                    className="rounded-full bg-sky-400 px-5 py-2.5 text-sm font-medium text-slate-950 hover:bg-sky-300 disabled:opacity-60"
                  >
                    {testing ? t('workspace.testing') : t('workspace.runTest')}
                  </button>
                </div>

                <div className="min-h-[24px] text-sm text-slate-300">
                  {isListening
                    ? (interimText || t('workspace.voiceListening'))
                    : t('workspace.voiceHint')}
                </div>
              </div>
            </div>
          </WorkspaceCard>

          <WorkspaceCard title={t('workspace.projectInfoTitle')}>
            <div className="space-y-3">
              <div className="rounded-[20px] border border-white/8 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-slate-300">
                {sourceLine}
              </div>
              <Link
                href={`/starship/versions/${appId}`}
                className="inline-flex items-center gap-2 text-sm text-sky-200 hover:text-sky-100"
              >
                <span className="i-ri-time-line h-4 w-4" />
                {t('workspace.openVersions')}
              </Link>
            </div>
          </WorkspaceCard>

          {showCoachMeta && (
            <WorkspaceCard
              title={t('workspace.coachBadge')}
              action={(
                <button
                  type="button"
                  onClick={handleCoachSave}
                  disabled={savingCoachDraft}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-white/5 disabled:opacity-60"
                >
                  {savingCoachDraft ? t('workspace.coachSaving') : t('workspace.coachSave')}
                </button>
              )}
            >
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    {t('create.step1.name')}
                  </label>
                  <input
                    value={form.name}
                    onChange={e => updateField('name', e.target.value)}
                    className="w-full rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-300"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    {t('create.step1.description')}
                  </label>
                  <textarea
                    value={form.description}
                    onChange={e => updateField('description', e.target.value)}
                    rows={4}
                    className="w-full resize-none rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-slate-100 outline-none focus:border-sky-300"
                  />
                </div>
              </div>
            </WorkspaceCard>
          )}

          {workspace.session.role === 'student' && (
            showStudentPublish
              ? (
                  <WorkspaceCard
                    title={t('workspace.shareCenterTitle')}
                    description={isStudentPublishProject ? t('workspace.shareCenterDescription') : t('workspace.historyShareCenterDescription')}
                  >
                    <div className="space-y-4">
                      <div className="rounded-[20px] border border-white/8 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-slate-300">
                        {workspace.agent.is_public ? t('workspace.shareCenterPublishedHint') : t('workspace.shareCenterDraftHint')}
                      </div>
                      <Link
                        href={publishCenterPath}
                        className="inline-flex w-full items-center justify-center rounded-full bg-sky-400 px-4 py-3 text-sm font-medium text-slate-950 hover:bg-sky-300"
                      >
                        {t('workspace.openShareCenter')}
                      </Link>
                    </div>
                  </WorkspaceCard>
                )
              : (
                  <WorkspaceCard
                    title={(workspace.publish_agent || isStudentHistoryProject) ? t('workspace.classroomFinishedTitle') : t('workspace.currentProjectTitle')}
                    description={(workspace.publish_agent || isStudentHistoryProject) ? t('workspace.classroomFinishedDescription') : t('workspace.currentProjectDescription')}
                  >
                    <div className="space-y-3">
                      <div className="rounded-[20px] border border-white/8 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-slate-300">
                        {workspace.publish_agent
                          ? t('workspace.classroomFinishedHint')
                          : '老师主版本已经发布。课堂里的这份会保留成记录；如果你还想继续完善，请 fork 一份自己的继续版。'}
                      </div>

                      {workspace.publish_agent
                        ? (
                            <Link
                              href={`/starship/workspace/${workspace.publish_agent.id}`}
                              className="inline-flex w-full items-center justify-center rounded-full bg-sky-400 px-4 py-3 text-sm font-medium text-slate-950 hover:bg-sky-300"
                            >
                              {t('workspace.openPublishProject')}
                            </Link>
                          )
                        : (
                            <button
                              type="button"
                              onClick={handleFork}
                              disabled={forking}
                              className="w-full rounded-full bg-sky-400 px-4 py-3 text-sm font-medium text-slate-950 hover:bg-sky-300 disabled:opacity-60"
                            >
                              {forking ? t('student.forking') : 'fork 一份我自己的继续版'}
                            </button>
                          )}
                    </div>
                  </WorkspaceCard>
                )
          )}

        </aside>

        <div className="order-2 space-y-4 xl:order-1">
          <WorkspaceCard
            title={t('workspace.promptTitle')}
            description={workspace.session.role === 'student' ? t('workspace.autoSaveHint') : t('workspace.coachEditHint')}
            className="border-sky-400/20 bg-[#12203a]"
          >
            <textarea
              value={form.pre_prompt}
              onChange={e => updateField('pre_prompt', e.target.value)}
              readOnly={readOnlyStudentHistory}
              rows={18}
              className={`min-h-[460px] w-full resize-y rounded-[24px] border border-sky-400/20 bg-[#0b1424] px-4 py-4 text-sm leading-7 text-slate-100 outline-none focus:border-sky-300 ${readOnlyStudentHistory ? 'opacity-80' : ''}`}
            />
          </WorkspaceCard>

          <WorkspaceCard
            title={t('workspace.knowledgeTitle')}
            description={t('workspace.knowledgeDescription')}
            action={(
              <label className={`rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 ${readOnlyStudentHistory ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-white/5'}`}>
                {t('workspace.uploadKnowledge')}
                <input type="file" multiple className="hidden" onChange={handleKnowledgeUpload} disabled={readOnlyStudentHistory} />
              </label>
            )}
          >
            <div className="space-y-3">
              {!knowledgeItems.length
                ? (
                    <div className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-sm text-slate-400">
                      {t('workspace.noKnowledge')}
                    </div>
                  )
                : knowledgeItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-[20px] border border-white/8 bg-white/[0.04] px-4 py-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-white">{item.name}</div>
                        <div className="mt-1 text-xs text-slate-500">{item.size_label}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveKnowledge(item.id)}
                        disabled={readOnlyStudentHistory}
                        className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 hover:bg-white/5"
                      >
                        {t('workspace.removeKnowledge')}
                      </button>
                    </div>
                  ))}
            </div>
          </WorkspaceCard>
        </div>
      </div>
    </div>
  )
}

export default StarshipWorkspacePage
