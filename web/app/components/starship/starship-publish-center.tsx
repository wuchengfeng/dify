'use client'

import type { SharePosterTemplate, StarshipWorkspace } from '@/service/starship'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchStarshipWorkspace, publishStarshipWorkspace, saveStarshipWorkspace } from '@/service/starship'
import StarshipSharePosterCard from './starship-share-poster-card'

type StarshipPublishCenterProps = {
  appId: string
}

const PublishCard = ({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) => (
  <section className="rounded-[28px] border border-white/10 bg-[#0f1b30] p-5 shadow-[0_18px_50px_rgba(2,8,23,0.24)]">
    <div className="text-base font-semibold text-white">{title}</div>
    {description && <div className="mt-2 text-sm leading-6 text-slate-300">{description}</div>}
    <div className="mt-4">{children}</div>
  </section>
)

const looksLikeContactInfo = (value: string) => {
  const normalized = value.trim()
  if (!normalized)
    return false

  const lowerValue = normalized.toLowerCase()

  return /1[3-9]\d{9}/.test(normalized)
    || /\b(?:vx|wx|wechat)\b/.test(lowerValue)
    || /微信/.test(normalized)
    || /\d{7,}/.test(normalized)
}

const StarshipPublishCenter = ({ appId }: StarshipPublishCenterProps) => {
  const { t } = useTranslation(['starship', 'common'])
  const router = useRouter()
  const [workspace, setWorkspace] = useState<StarshipWorkspace | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [selectedPosterId, setSelectedPosterId] = useState<string | null>(null)
  const [form, setForm] = useState({
    share_author_name: '',
    share_intro: '',
    opening_line: '',
  })

  const flash = useCallback((message: string) => {
    setFeedback(message)
    window.setTimeout(() => setFeedback(''), 3000)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchStarshipWorkspace(appId)
      setWorkspace(result)
      setSelectedPosterId(prev => prev || result.share_posters[0]?.id || null)
      setForm({
        share_author_name: result.share_author_name,
        share_intro: result.share_intro,
        opening_line: result.opening_line,
      })
    }
    finally {
      setLoading(false)
    }
  }, [appId])

  useEffect(() => {
    void load()
  }, [load])

  const updateField = (field: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const selectedPoster = useMemo<SharePosterTemplate | null>(() => {
    if (!workspace)
      return null
    return workspace.share_posters.find(item => item.id === selectedPosterId) || workspace.share_posters[0] || null
  }, [selectedPosterId, workspace])

  const saveDraft = async () => {
    if (looksLikeContactInfo(form.share_author_name)) {
      flash(t('publishCenter.authorNameInvalid'))
      return false
    }

    await saveStarshipWorkspace(appId, {
      name: workspace?.agent.name || '',
      description: workspace?.agent.description || '',
      pre_prompt: workspace?.pre_prompt || '',
      share_author_name: form.share_author_name,
      share_intro: form.share_intro,
      opening_line: form.opening_line,
    })
    return true
  }

  const handlePreview = async (target: 'intro' | 'experience') => {
    setSubmitting(true)
    try {
      const saved = await saveDraft()
      if (!saved)
        return
      await load()
      if (workspace?.agent.is_public) {
        router.push(target === 'intro' ? `/starship/share/${appId}` : `/starship/experience/${appId}`)
      }
      else {
        router.push(target === 'intro' ? `/starship/publish/${appId}/intro-preview` : `/starship/publish/${appId}/experience-preview`)
      }
    }
    finally {
      setSubmitting(false)
    }
  }

  const handlePublish = async () => {
    setSubmitting(true)
    try {
      const saved = await saveDraft()
      if (!saved)
        return
      await publishStarshipWorkspace(appId, {
        share_author_name: form.share_author_name,
        share_intro: form.share_intro,
        opening_line: form.opening_line,
      })
      await load()
      flash(t('publishCenter.published'))
    }
    finally {
      setSubmitting(false)
    }
  }

  if (loading || !workspace) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-slate-400">
        {t('loading', { ns: 'common' })}
        ...
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4 pb-8">
      <section className="rounded-[30px] border border-white/10 bg-[#101a2d] px-5 py-5 shadow-[0_18px_50px_rgba(2,8,23,0.32)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/starship/workspace/${appId}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
              >
                <span className="i-ri-arrow-left-line h-4 w-4" />
                {t('publishCenter.backWorkspace')}
              </Link>
              <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-200">
                {workspace.agent.is_public ? t('publishCenter.statusPublished') : t('publishCenter.statusDraft')}
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-semibold text-white">{t('publishCenter.title')}</h1>
            <div className="mt-2 text-sm leading-6 text-slate-300">{t('publishCenter.description')}</div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handlePreview('intro')}
              disabled={submitting}
              className="rounded-full border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-100 hover:bg-white/5 disabled:opacity-60"
            >
              {workspace.agent.is_public ? t('share.openIntro') : t('share.previewIntro')}
            </button>
            <button
              type="button"
              onClick={() => void handlePreview('experience')}
              disabled={submitting}
              className="rounded-full border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-100 hover:bg-white/5 disabled:opacity-60"
            >
              {workspace.agent.is_public ? t('share.startExperience') : t('share.previewExperience')}
            </button>
            <button
              type="button"
              onClick={() => void handlePublish()}
              disabled={submitting}
              className="rounded-full bg-sky-400 px-4 py-2.5 text-sm font-medium text-slate-950 hover:bg-sky-300 disabled:opacity-60"
            >
              {workspace.agent.is_public ? t('publishCenter.update') : t('publishCenter.publish')}
            </button>
          </div>
        </div>
      </section>

      {feedback && (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          {feedback}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-4">
          <PublishCard title={t('publishCenter.metaTitle')} description={t('publishCenter.metaDescription')}>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  {t('publishCenter.authorName')}
                </label>
                <input
                  value={form.share_author_name}
                  onChange={e => updateField('share_author_name', e.target.value)}
                  className="w-full rounded-[22px] border border-white/10 bg-[#0b1424] px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-300"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  {t('publishCenter.shareIntro')}
                </label>
                <textarea
                  value={form.share_intro}
                  onChange={e => updateField('share_intro', e.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-[22px] border border-white/10 bg-[#0b1424] px-4 py-3 text-sm leading-6 text-slate-100 outline-none focus:border-sky-300"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  {t('publishCenter.openingLine')}
                </label>
                <textarea
                  value={form.opening_line}
                  onChange={e => updateField('opening_line', e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-[22px] border border-white/10 bg-[#0b1424] px-4 py-3 text-sm leading-6 text-slate-100 outline-none focus:border-sky-300"
                />
              </div>
            </div>
          </PublishCard>

          <PublishCard title={t('publishCenter.rulesTitle')}>
            <div className="space-y-3 text-sm leading-6 text-slate-300">
              <div className="rounded-[20px] border border-white/8 bg-white/[0.04] px-4 py-3">
                {t('publishCenter.ruleOne')}
              </div>
              <div className="rounded-[20px] border border-white/8 bg-white/[0.04] px-4 py-3">
                {t('publishCenter.ruleTwo')}
              </div>
              <div className="rounded-[20px] border border-white/8 bg-white/[0.04] px-4 py-3">
                {t('publishCenter.ruleThree')}
              </div>
            </div>
          </PublishCard>
        </div>

        <div className="space-y-4">
          <PublishCard title={t('publishCenter.posterTitle')} description={t('publishCenter.posterDescription')}>
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {workspace.share_posters.map((poster) => {
                  const selected = poster.id === selectedPoster?.id
                  return (
                    <button
                      key={poster.id}
                      type="button"
                      onClick={() => setSelectedPosterId(poster.id)}
                      className={`rounded-[22px] border p-4 text-left transition ${selected ? 'border-sky-300 bg-sky-400/10 text-white' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05]'}`}
                    >
                      <div
                        className="h-2 rounded-full"
                        style={{ background: `linear-gradient(90deg, ${poster.accent_from}, ${poster.accent_to})` }}
                      />
                      <div className="mt-3 text-sm font-semibold">{poster.title}</div>
                      <div className="mt-2 text-xs leading-5 text-slate-400">{poster.caption}</div>
                    </button>
                  )
                })}
              </div>

              {selectedPoster && (
                <StarshipSharePosterCard
                  poster={selectedPoster}
                  agentName={workspace.agent.name}
                  authorName={form.share_author_name}
                  shareIntro={form.share_intro}
                  icon={workspace.agent.icon || '🤖'}
                  sharePath={`/starship/share/${appId}`}
                  isPublished={workspace.agent.is_public}
                />
              )}
            </div>
          </PublishCard>
        </div>
      </div>
    </div>
  )
}

export default StarshipPublishCenter
