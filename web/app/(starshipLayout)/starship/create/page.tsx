'use client'

import type { ChangeEvent } from 'react'
import type { KnowledgeItem } from '@/service/starship'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import useCoachGroupDetails from '@/app/components/starship/use-coach-group-details'
import {
  deleteStarshipTask,
  fetchStarshipWorkspace,
  publishStarshipTaskMain,
  publishStarshipTaskToStudents,
  upsertStarshipTaskForGroup,
} from '@/service/starship'

const emptyForm = {
  name: '',
  description: '',
  teacher_note: '',
  pre_prompt: '',
}

const CreateTaskPage = () => {
  const { t } = useTranslation(['starship', 'common'])
  const router = useRouter()
  const searchParams = useSearchParams()
  const groupId = searchParams.get('groupId') || ''
  const { currentGroup, groupAgents, loading, reload } = useCoachGroupDetails(groupId)
  const [form, setForm] = useState(emptyForm)
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([])
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [mainPublishing, setMainPublishing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const coachAgent = useMemo(
    () => groupAgents.find(agent => agent.owner_role === 'coach') || null,
    [groupAgents],
  )

  const canEditTask = Boolean(currentGroup && !currentGroup.task_main_published)
  const canDeleteTask = Boolean(currentGroup?.task_id && !currentGroup.task_published_to_students && !currentGroup.task_main_published)
  const canPublishTask = Boolean(currentGroup?.task_id && !currentGroup.task_published_to_students && !currentGroup.task_main_published)
  const canMainPublish = Boolean(currentGroup?.task_id && currentGroup.task_published_to_students && !currentGroup.task_main_published)

  const loadTaskDraft = useCallback(async () => {
    if (!currentGroup) {
      setForm(emptyForm)
      setKnowledgeItems([])
      return
    }

    if (!coachAgent) {
      setForm({
        name: currentGroup.task_title || `${currentGroup.name}任务`,
        description: currentGroup.description || '',
        teacher_note: '',
        pre_prompt: '',
      })
      setKnowledgeItems([])
      return
    }

    try {
      const workspace = await fetchStarshipWorkspace(coachAgent.id)
      setForm({
        name: workspace.agent.name,
        description: workspace.agent.description,
        teacher_note: workspace.task?.teacher_note || '',
        pre_prompt: workspace.pre_prompt,
      })
      setKnowledgeItems(workspace.knowledge_items)
    }
    catch {
      setForm({
        name: currentGroup.task_title || `${currentGroup.name}任务`,
        description: currentGroup.description || '',
        teacher_note: '',
        pre_prompt: '',
      })
      setKnowledgeItems([])
    }
  }, [coachAgent, currentGroup])

  useEffect(() => {
    void loadTaskDraft()
  }, [loadTaskDraft])

  const flash = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3000)
  }

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

  const removeKnowledge = (itemId: string) => {
    setKnowledgeItems(prev => prev.filter(item => item.id !== itemId))
  }

  const handleSave = async () => {
    if (!groupId || !form.name.trim())
      return

    setSaving(true)
    try {
      await upsertStarshipTaskForGroup(groupId, {
        name: form.name.trim(),
        description: form.description.trim(),
        teacher_note: form.teacher_note.trim(),
        pre_prompt: form.pre_prompt.trim(),
        knowledge_items: knowledgeItems,
      })
      await reload()
      flash('班级任务已经保存。')
    }
    catch (error) {
      flash(error instanceof Error ? error.message : '班级任务保存失败，请再试一次。')
    }
    finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!currentGroup?.task_id)
      return

    setPublishing(true)
    try {
      await upsertStarshipTaskForGroup(groupId, {
        name: form.name.trim(),
        description: form.description.trim(),
        teacher_note: form.teacher_note.trim(),
        pre_prompt: form.pre_prompt.trim(),
        knowledge_items: knowledgeItems,
      })
      await publishStarshipTaskToStudents(currentGroup.task_id)
      await reload()
      flash('任务已经发布，孩子们现在可以开始写自己的智能体了。')
      router.replace(`/starship/coach/${groupId}/classroom`)
    }
    catch (error) {
      flash(error instanceof Error ? error.message : '任务发布失败，请再试一次。')
    }
    finally {
      setPublishing(false)
    }
  }

  const handleMainPublish = async () => {
    if (!currentGroup?.task_id)
      return

    setMainPublishing(true)
    try {
      await upsertStarshipTaskForGroup(groupId, {
        name: form.name.trim(),
        description: form.description.trim(),
        teacher_note: form.teacher_note.trim(),
        pre_prompt: form.pre_prompt.trim(),
        knowledge_items: knowledgeItems,
      })
      await publishStarshipTaskMain(currentGroup.task_id)
      await reload()
      flash('主版本已经发布，这个班级项目已经结束，孩子们现在可以生成自己的继续作品。')
      router.replace(`/starship/coach/${groupId}`)
    }
    catch (error) {
      flash(error instanceof Error ? error.message : '主版本发布失败，请再试一次。')
    }
    finally {
      setMainPublishing(false)
    }
  }

  const handleDelete = async () => {
    if (!currentGroup?.task_id)
      return

    setDeleting(true)
    try {
      await deleteStarshipTask(currentGroup.task_id)
      await reload()
      flash('这个班级任务已经删除。')
      router.replace(`/starship/coach/${groupId}`)
    }
    catch (error) {
      flash(error instanceof Error ? error.message : '任务删除失败，请再试一次。')
    }
    finally {
      setDeleting(false)
    }
  }

  if (!groupId) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-slate-400">
        请先从教练中心进入班级，再管理这个班级的任务。
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-slate-400">
        {t('loading', { ns: 'common' })}
        ...
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-8">
      <section className="rounded-[28px] border border-white/10 bg-[#101a2d] px-5 py-5 shadow-[0_18px_50px_rgba(2,8,23,0.34)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={groupId ? `/starship/coach/${groupId}` : '/starship/coach'}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
              >
                <span className="i-ri-arrow-left-line h-4 w-4" />
                返回班级
              </Link>
              {currentGroup && (
                <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-200">
                  {currentGroup.name}
                </span>
              )}
            </div>
            <h1 className="mt-3 text-2xl font-semibold text-white">
              班级任务管理
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              先把这个班的任务说明、老师提醒和主版本提示词定下来。发布之后，孩子们才会在自己的个人中心看到并开始写。
            </p>
          </div>

          <div className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
            {currentGroup?.task_main_published
              ? '当前状态：主版本已发布'
              : currentGroup?.task_published_to_students
                ? '当前状态：孩子们已经开始创作'
                : currentGroup?.task_id
                  ? '当前状态：任务已创建，等待发布'
                  : '当前状态：还没有班级任务'}
          </div>
        </div>
      </section>

      {notice && (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          {notice}
        </div>
      )}

      <section className="rounded-[28px] border border-white/10 bg-[#0c1729] p-6 shadow-[0_18px_50px_rgba(2,8,23,0.24)]">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                班级任务名称
              </label>
              <input
                value={form.name}
                onChange={e => updateField('name', e.target.value)}
                disabled={!canEditTask}
                className="w-full rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-300 disabled:opacity-60"
                placeholder="比如：用 AI 帮社区里的老人解决一个真实问题"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                这个任务要做什么
              </label>
              <textarea
                value={form.description}
                onChange={e => updateField('description', e.target.value)}
                disabled={!canEditTask}
                rows={5}
                className="w-full resize-none rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-slate-100 outline-none focus:border-sky-300 disabled:opacity-60"
                placeholder="用最简单的话告诉孩子：这个智能体要帮谁解决什么问题。"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                给孩子的老师提醒
              </label>
              <textarea
                value={form.teacher_note}
                onChange={e => updateField('teacher_note', e.target.value)}
                disabled={!canEditTask}
                rows={4}
                className="w-full resize-none rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-slate-100 outline-none focus:border-sky-300 disabled:opacity-60"
                placeholder="比如：先把你想帮助的人写清楚，再决定这个智能体第一句应该怎么说。"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                教练主版本提示词
              </label>
              <textarea
                value={form.pre_prompt}
                onChange={e => updateField('pre_prompt', e.target.value)}
                disabled={!canEditTask}
                rows={10}
                className="w-full resize-y rounded-[20px] border border-white/10 bg-[#0b1424] px-4 py-4 text-sm leading-7 text-slate-100 outline-none focus:border-sky-300 disabled:opacity-60"
                placeholder="这是教练给这个班准备的主版本提示词。后面孩子会在这个任务基础上开始写自己的版本。"
              />
            </div>
          </div>

          <aside className="space-y-4">
            <section className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
              <div className="text-sm font-medium text-sky-200">
                任务材料
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                可以先给这个班准备一些资料。孩子开始创作后，会沿着这条任务线继续做。
              </p>

              <label className="mt-4 inline-flex cursor-pointer items-center rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/5">
                上传材料
                <input type="file" multiple className="hidden" onChange={handleKnowledgeUpload} disabled={!canEditTask} />
              </label>

              <div className="mt-4 space-y-3">
                {!knowledgeItems.length
                  ? (
                      <div className="rounded-[20px] border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-sm text-slate-400">
                        现在还没有班级材料。
                      </div>
                    )
                  : knowledgeItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between gap-3 rounded-[18px] border border-white/8 bg-white/[0.04] px-4 py-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-white">{item.name}</div>
                          <div className="mt-1 text-xs text-slate-500">{item.size_label}</div>
                        </div>
                        {canEditTask && (
                          <button
                            type="button"
                            onClick={() => item.id && removeKnowledge(item.id)}
                            className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 hover:bg-white/5"
                          >
                            删除
                          </button>
                        )}
                      </div>
                    ))}
              </div>
            </section>

            <section className="rounded-[24px] border border-white/10 bg-[#0f1b30] p-5">
              <div className="text-sm font-medium text-sky-200">
                这条流程怎么走
              </div>
              <div className="mt-3 space-y-3 text-sm leading-6 text-slate-300">
                <div>1. 先保存任务草稿。</div>
                <div>2. 再发布给孩子，孩子们才会在个人中心看到并开始写。</div>
                <div>3. 教练去课堂看板里实时看孩子们的创作和测试情况。</div>
                <div>4. 最后由教练发布主版本，项目结束后，孩子们再生成自己的继续作品。</div>
              </div>

              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!canEditTask || saving || !form.name.trim()}
                  className="w-full rounded-full bg-white px-4 py-3 text-sm font-medium text-slate-950 hover:bg-slate-100 disabled:opacity-60"
                >
                  {saving ? '保存中...' : '保存任务草稿'}
                </button>

                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={!canPublishTask || publishing || saving || !form.name.trim()}
                  className="w-full rounded-full bg-sky-400 px-4 py-3 text-sm font-medium text-slate-950 hover:bg-sky-300 disabled:opacity-60"
                >
                  {publishing ? '发布中...' : '发布给孩子开始做'}
                </button>

                <button
                  type="button"
                  onClick={handleMainPublish}
                  disabled={!canMainPublish || mainPublishing}
                  className="w-full rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-100 hover:bg-emerald-400/15 disabled:opacity-60"
                >
                  {mainPublishing ? '主版本发布中...' : '发布主版本并结束项目'}
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={!canDeleteTask || deleting}
                  className="w-full rounded-full border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm font-medium text-rose-100 hover:bg-rose-400/15 disabled:opacity-60"
                >
                  {deleting ? '删除中...' : '删除这个班级任务'}
                </button>

                {currentGroup?.task_published_to_students && !currentGroup.task_main_published && (
                  <Link
                    href={`/starship/coach/${groupId}/classroom`}
                    className="inline-flex w-full items-center justify-center rounded-full border border-white/10 px-4 py-3 text-sm font-medium text-slate-200 hover:bg-white/5"
                  >
                    打开课堂看板
                  </Link>
                )}
              </div>
            </section>
          </aside>
        </div>
      </section>
    </div>
  )
}

export default CreateTaskPage
