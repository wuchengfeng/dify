'use client'

import type { ChangeEvent } from 'react'
import type {
  KnowledgeItem,
  StarshipAgent,
  StarshipWorkspace,
} from '@/service/starship'
import Link from 'next/link'
import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  fetchStarshipWorkspace,
  runStarshipWorkspaceTest,
  saveStarshipWorkspace,
} from '@/service/starship'
import useCoachGroupDetails from './use-coach-group-details'

type CoachGroupClassroomProps = {
  groupId: string
}

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const ALWAYS_ON_TOOLS = {
  web_search: true,
  image_recognition: true,
  read_aloud: true,
} as const

const formatTime = (timestamp?: number | null) => {
  if (!timestamp)
    return '—'

  return new Intl.DateTimeFormat(undefined, {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp * 1000))
}

const StudentPromptTile = ({
  agent,
  selected,
  onSelect,
}: {
  agent: StarshipAgent
  selected: boolean
  onSelect: () => void
}) => {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect()
        }
      }}
      className={`flex min-h-0 cursor-pointer flex-col rounded-[18px] border p-3 transition-all ${
        selected
          ? 'border-sky-400 bg-sky-400/10 shadow-[0_14px_30px_rgba(56,189,248,0.14)]'
          : 'border-white/10 bg-white/[0.04] hover:border-white/20'
      }`}
    >
      <div className="flex items-center gap-2">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] text-sm"
          style={{ backgroundColor: agent.icon_background || '#1D4ED8' }}
        >
          {agent.icon || '🤖'}
        </div>
        <div className="min-w-0 truncate text-sm font-semibold text-white">
          {agent.creator_name || agent.name}
        </div>
        <div className="shrink-0 text-[11px] text-slate-500">
          {formatTime(agent.updated_at || agent.created_at)}
        </div>
      </div>

      <div className="mt-3 min-h-0 flex-1 select-text overflow-auto whitespace-pre-wrap rounded-[16px] border border-white/8 bg-[#0b1424] px-3 py-3 text-sm leading-6 text-slate-100">
        {agent.pre_prompt || agent.description}
      </div>
    </div>
  )
}

const CoachGroupClassroom = ({ groupId }: CoachGroupClassroomProps) => {
  const { t } = useTranslation(['starship', 'common'])
  const { currentGroup, groupAgents, loading, reload } = useCoachGroupDetails(groupId, {
    pollIntervalMs: 3000,
  })
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [coachWorkspace, setCoachWorkspace] = useState<StarshipWorkspace | null>(null)
  const [loadingCoachWorkspace, setLoadingCoachWorkspace] = useState(false)
  const [coachPromptDraft, setCoachPromptDraft] = useState<{ agentId: string | null, value: string }>({
    agentId: null,
    value: '',
  })
  const [coachKnowledgeItems, setCoachKnowledgeItems] = useState<KnowledgeItem[]>([])
  const [savingCoachPrompt, setSavingCoachPrompt] = useState(false)
  const [testInput, setTestInput] = useState('')
  const [testing, setTesting] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [notice, setNotice] = useState('')

  const coachAgent = useMemo(
    () => groupAgents.find(agent => agent.owner_role === 'coach') || null,
    [groupAgents],
  )

  const studentAgents = useMemo(
    () => groupAgents.filter(agent => agent.owner_role === 'student').slice(0, 6),
    [groupAgents],
  )

  const selectedTestAgent = useMemo(
    () => groupAgents.find(agent => agent.id === selectedAgentId)
      || studentAgents[0]
      || coachAgent
      || null,
    [coachAgent, groupAgents, selectedAgentId, studentAgents],
  )

  const coachPrompt = coachPromptDraft.agentId === coachAgent?.id
    ? coachPromptDraft.value
    : (coachWorkspace?.pre_prompt || coachAgent?.pre_prompt || '')

  const loadCoachWorkspace = useEffectEvent(async (agentId: string | null) => {
    if (!agentId) {
      setCoachWorkspace(null)
      return
    }

    setLoadingCoachWorkspace(true)
    try {
      const result = await fetchStarshipWorkspace(agentId)
      setCoachWorkspace(result)
      setCoachPromptDraft({
        agentId: result.agent.id,
        value: result.pre_prompt,
      })
      setCoachKnowledgeItems(result.knowledge_items)
    }
    finally {
      setLoadingCoachWorkspace(false)
    }
  })

  useEffect(() => {
    void loadCoachWorkspace(coachAgent?.id || null)
  }, [coachAgent?.id])

  const flash = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3000)
  }

  const handleCoachKnowledgeUpload = (event: ChangeEvent<HTMLInputElement>) => {
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

    setCoachKnowledgeItems(prev => [...uploaded, ...prev])
    event.target.value = ''
  }

  const handleRemoveKnowledge = (itemId: string) => {
    setCoachKnowledgeItems(prev => prev.filter(item => item.id !== itemId))
  }

  const handleCoachPromptChange = (value: string) => {
    if (!coachAgent)
      return

    setCoachPromptDraft({
      agentId: coachAgent.id,
      value,
    })
  }

  const handleSaveCoachPrompt = async () => {
    if (!coachAgent)
      return

    setSavingCoachPrompt(true)
    try {
      await saveStarshipWorkspace(coachAgent.id, {
        name: coachAgent.name,
        description: coachAgent.description,
        pre_prompt: coachPrompt,
        share_author_name: coachWorkspace?.share_author_name || coachAgent.share_author_name || coachAgent.creator_name || '',
        share_intro: coachWorkspace?.share_intro || coachAgent.share_intro || coachAgent.description,
        tool_settings: ALWAYS_ON_TOOLS,
        knowledge_items: coachKnowledgeItems,
      })
      const latestCoachWorkspace = await fetchStarshipWorkspace(coachAgent.id)
      setCoachWorkspace(latestCoachWorkspace)
      setCoachPromptDraft({
        agentId: latestCoachWorkspace.agent.id,
        value: latestCoachWorkspace.pre_prompt,
      })
      setCoachKnowledgeItems(latestCoachWorkspace.knowledge_items)
      reload()
      flash(t('coach.classroomMainSaved'))
    }
    finally {
      setSavingCoachPrompt(false)
    }
  }

  const handleRunTest = async () => {
    if (!selectedTestAgent || !testInput.trim())
      return

    setTesting(true)
    try {
      const input = testInput.trim()
      const result = await runStarshipWorkspaceTest(selectedTestAgent.id, { input })

      setMessages(prev => [
        ...prev,
        { id: `${selectedTestAgent.id}-user-${Date.now()}`, role: 'user', content: input },
        { id: `${selectedTestAgent.id}-assistant-${Date.now()}`, role: 'assistant', content: result.output },
      ])
      setTestInput('')
      reload()
      flash(t('coach.classroomTestSaved'))
    }
    finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-slate-400">
        {t('loading', { ns: 'common' })}
        ...
      </div>
    )
  }

  if (!currentGroup) {
    return (
      <div className="flex h-full items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-[#0c1729] p-6 text-center text-slate-300">
        <div>
          <div className="text-base font-medium text-white">
            {t('coach.groupUnavailable')}
          </div>
          <div className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
            {t('coach.groupUnavailableDescription')}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-88px)] min-h-0 flex-col gap-2 overflow-hidden">
      <section className="shrink-0 px-1">
        <div className="flex items-center gap-3 overflow-hidden">
          <Link
            href="/starship/coach"
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
          >
            <span className="i-ri-arrow-left-line h-4 w-4" />
            {t('coach.backToGroups')}
          </Link>
          <span className="shrink-0 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-200">
            {currentGroup.name}
          </span>
          <h1 className="truncate text-lg font-semibold text-white">
            {currentGroup.task_title || t('coach.classroomPageTitle')}
          </h1>
        </div>
      </section>

      {notice && (
        <div className="shrink-0 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-100">
          {notice}
        </div>
      )}

      {!studentAgents.length
        ? (
            <section className="flex min-h-0 flex-1 items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-[#0c1729] p-6 text-center text-slate-300">
              <div>
                <div className="text-base font-medium text-white">
                  {t('coach.classroomEmpty')}
                </div>
                <div className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                  {t('coach.classroomEmptyDescription')}
                </div>
              </div>
            </section>
          )
        : (
            <div className="grid min-h-0 flex-1 gap-3 overflow-hidden xl:grid-cols-[minmax(0,3fr)_minmax(0,4fr)_minmax(0,3fr)]">
              <div className="grid min-h-0 gap-3 [grid-template-rows:repeat(3,minmax(0,1fr))]">
                {studentAgents.slice(0, 3).map(agent => (
                  <StudentPromptTile
                    key={agent.id}
                    agent={agent}
                    selected={selectedTestAgent?.id === agent.id}
                    onSelect={() => {
                      setSelectedAgentId(agent.id)
                      setMessages([])
                      setTestInput('')
                    }}
                  />
                ))}
              </div>

              <div className="grid min-h-0 gap-3 [grid-template-rows:minmax(0,1.12fr)_minmax(0,0.88fr)]">
                <section className="grid min-h-0 gap-3 rounded-[20px] border border-white/10 bg-[#0c1729] p-4 shadow-[0_16px_40px_rgba(2,8,23,0.2)] [grid-template-rows:minmax(0,1fr)_170px]">
                  <div className="rounded-[20px] border border-sky-400/20 bg-[#12203a] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-sky-200">
                          {coachAgent?.name || t('coach.mainRuleTitle')}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleSaveCoachPrompt}
                        disabled={savingCoachPrompt || loadingCoachWorkspace}
                        className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/5 disabled:opacity-60"
                      >
                        {savingCoachPrompt ? t('workspace.coachSaving') : t('coach.classroomSaveMain')}
                      </button>
                    </div>

                    <textarea
                      onClick={() => coachAgent && setSelectedAgentId(coachAgent.id)}
                      value={coachPrompt}
                      onChange={e => handleCoachPromptChange(e.target.value)}
                      rows={9}
                      className="mt-3 h-[calc(100%-44px)] w-full resize-none rounded-[18px] border border-sky-400/20 bg-[#0b1424] px-4 py-4 text-sm leading-7 text-slate-100 outline-none focus:border-sky-300"
                    />
                  </div>

                  <div className="grid min-h-0">
                    <section className="rounded-[18px] border border-white/8 bg-white/[0.03] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs font-medium text-sky-200">
                          {t('workspace.knowledgeTitle')}
                        </div>
                        <label className="cursor-pointer rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5">
                          {t('workspace.uploadKnowledge')}
                          <input type="file" multiple className="hidden" onChange={handleCoachKnowledgeUpload} />
                        </label>
                      </div>

                      <div className="mt-2 h-[104px] space-y-2 overflow-auto pr-1">
                        {!coachKnowledgeItems.length
                          ? (
                              <div className="rounded-[16px] border border-dashed border-white/10 bg-white/[0.02] px-4 py-4 text-sm text-slate-400">
                                {t('workspace.noKnowledge')}
                              </div>
                            )
                          : coachKnowledgeItems.map(item => (
                              <div key={item.id} className="flex items-center justify-between gap-3 rounded-[16px] border border-white/8 bg-white/[0.04] px-3 py-2">
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-medium text-white">
                                    {item.name}
                                  </div>
                                  <div className="mt-1 text-xs text-slate-500">
                                    {item.size_label}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveKnowledge(item.id)}
                                  className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 hover:bg-white/5"
                                >
                                  {t('workspace.removeKnowledge')}
                                </button>
                              </div>
                            ))}
                      </div>
                    </section>
                  </div>
                </section>

                <section className="flex min-h-0 flex-col rounded-[20px] border border-white/10 bg-[#0f1b30] p-4 shadow-[0_16px_40px_rgba(2,8,23,0.2)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-sky-200">
                        {selectedTestAgent ? t('coach.classroomTestingSubtitle', { name: selectedTestAgent.creator_name || selectedTestAgent.name }) : t('coach.classroomSelectionHint')}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-auto rounded-[18px] border border-white/8 bg-[#0b1424] p-4">
                    {!messages.length
                      ? (
                          <div className="text-sm leading-6 text-slate-400">
                            {t('coach.classroomTestEmpty')}
                          </div>
                        )
                      : messages.map(message => (
                          <div
                            key={message.id}
                            className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                              message.role === 'assistant'
                                ? 'bg-sky-500/15 text-sky-50'
                                : 'ml-auto bg-white/8 text-slate-100'
                            }`}
                          >
                            {message.content}
                          </div>
                        ))}
                  </div>

                  <div className="mt-3 flex gap-3">
                    <input
                      value={testInput}
                      onChange={e => setTestInput(e.target.value)}
                      placeholder={t('coach.classroomTestPlaceholder')}
                      className="w-full rounded-full border border-white/10 bg-[#0b1424] px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-300"
                    />
                    <button
                      type="button"
                      onClick={handleRunTest}
                      disabled={testing || !testInput.trim() || !selectedTestAgent}
                      className="rounded-full bg-sky-400 px-5 py-3 text-sm font-medium text-slate-950 hover:bg-sky-300 disabled:opacity-60"
                    >
                      {testing ? t('workspace.testing') : t('workspace.runTest')}
                    </button>
                  </div>
                </section>
              </div>

              <div className="grid min-h-0 gap-3 [grid-template-rows:repeat(3,minmax(0,1fr))]">
                {studentAgents.slice(3, 6).map(agent => (
                  <StudentPromptTile
                    key={agent.id}
                    agent={agent}
                    selected={selectedTestAgent?.id === agent.id}
                    onSelect={() => {
                      setSelectedAgentId(agent.id)
                      setMessages([])
                      setTestInput('')
                    }}
                  />
                ))}
              </div>
            </div>
          )}
    </div>
  )
}

export default CoachGroupClassroom
