'use client'

import type { PublicStarshipAgent } from '@/service/starship'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchPreviewStarshipAgent, fetchPublicStarshipAgent, runStarshipExperience } from '@/service/starship'

type StarshipExperienceProps = {
  appId: string
  mode?: 'public' | 'preview'
}

type ExperienceMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
}

const QUICK_KEYS = [
  'share.quickAskOne',
  'share.quickAskTwo',
  'share.quickAskThree',
] as const

const StarshipExperience = ({ appId, mode = 'public' }: StarshipExperienceProps) => {
  const { t } = useTranslation(['starship', 'common'])
  const [data, setData] = useState<PublicStarshipAgent | null>(null)
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ExperienceMessage[]>([])
  const [running, setRunning] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)

  const makeMessage = (role: ExperienceMessage['role'], text: string): ExperienceMessage => ({
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    text,
  })

  useEffect(() => {
    const loader = mode === 'preview' ? fetchPreviewStarshipAgent : fetchPublicStarshipAgent

    loader(appId)
      .then((result) => {
        setData(result)
        setMessages(result.opening_line ? [makeMessage('assistant', result.opening_line)] : [])
        setLoadFailed(false)
      })
      .catch(() => {
        setData(null)
        setLoadFailed(true)
      })
      .finally(() => setLoading(false))
  }, [appId, mode])

  const handleRun = async () => {
    const content = input.trim()
    if (!content)
      return

    setRunning(true)
    try {
      const result = await runStarshipExperience(appId, content)
      setMessages(prev => [...prev, makeMessage('user', content), makeMessage('assistant', result.output)])
      setInput('')
    }
    finally {
      setRunning(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-sm text-slate-500">
        {t('loading', { ns: 'common' })}
        ...
      </div>
    )
  }

  if (!data || loadFailed) {
    return (
      <div className="mx-auto max-w-md rounded-[32px] border border-white/70 bg-white/90 px-6 py-8 text-center shadow-[0_28px_70px_rgba(15,23,42,0.1)] backdrop-blur">
        <div className="text-sm font-medium text-slate-400">{t('share.previewBadge')}</div>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">{t('share.unavailableTitle')}</h1>
        <div className="mt-3 text-sm leading-7 text-slate-600">{t('share.unavailableDescription')}</div>
        <Link
          href={mode === 'preview' ? `/starship/publish/${appId}` : '/starship/square'}
          className="mt-6 inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800"
        >
          {t('share.backHome')}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="overflow-hidden rounded-[36px] border border-white/70 bg-[linear-gradient(180deg,#fff9f3_0%,#ffffff_100%)] shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
        <div
          className="px-5 pb-5 pt-6"
          style={{ background: `radial-gradient(circle at top, ${data.share_posters[0]?.accent_from || '#38BDF8'}33, transparent 42%), linear-gradient(180deg, #fffaf5 0%, #ffffff 100%)` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-[20px] text-3xl shadow-[0_14px_34px_rgba(15,23,42,0.1)]"
              style={{ backgroundColor: data.agent.icon_background || '#FFEAD5' }}
            >
              {data.agent.icon}
            </div>
            <div className="min-w-0">
              <div className="truncate text-xl font-semibold text-slate-950">{data.agent.name}</div>
              <div className="mt-1 truncate text-sm text-slate-500">
                {data.agent.share_author_name || data.agent.creator_name || t('share.defaultAuthor')}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-slate-200 bg-white/85 px-4 py-4">
            <div className="text-sm leading-7 text-slate-600">{data.share_intro}</div>
          </div>
        </div>

        <div className="bg-[#f7fafc] px-4 pb-4 pt-3">
          <div className="space-y-3 rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
            <div className="flex flex-wrap gap-2">
              {QUICK_KEYS.map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setInput(t(key))}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                >
                  {t(key)}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={message.role === 'assistant'
                    ? 'max-w-[88%] rounded-[22px] bg-slate-100 px-4 py-3 text-sm leading-7 text-slate-800'
                    : 'ml-auto max-w-[88%] rounded-[22px] bg-slate-950 px-4 py-3 text-sm leading-7 text-white'}
                >
                  {message.text}
                </div>
              ))}
            </div>

            <div className="space-y-3 border-t border-slate-100 pt-3">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                rows={4}
                placeholder={t('share.inputPlaceholder')}
                className="w-full resize-none rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-800 outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={handleRun}
                disabled={running || !input.trim()}
                className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-60"
              >
                {running ? t('share.running') : t('share.send')}
              </button>
            </div>
          </div>

          <Link
            href={mode === 'preview' ? `/starship/publish/${appId}/intro-preview` : `/starship/share/${appId}`}
            className="mt-4 inline-flex w-full items-center justify-center text-sm text-slate-500"
          >
            {t('share.backIntro')}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default StarshipExperience
