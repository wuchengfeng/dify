'use client'

import type { PublicStarshipAgent } from '@/service/starship'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchPreviewStarshipAgent, fetchPublicStarshipAgent, toggleStarshipAppreciation } from '@/service/starship'
import { StarshipPosterSurface } from './starship-share-poster-card'

type StarshipShareIntroProps = {
  appId: string
  mode?: 'public' | 'preview'
}

const StarshipShareIntro = ({ appId, mode = 'public' }: StarshipShareIntroProps) => {
  const { t } = useTranslation(['starship', 'common'])
  const [data, setData] = useState<PublicStarshipAgent | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [appreciating, setAppreciating] = useState(false)

  useEffect(() => {
    const loader = mode === 'preview' ? fetchPreviewStarshipAgent : fetchPublicStarshipAgent

    loader(appId)
      .then((result) => {
        setData(result)
        setLoadFailed(false)
      })
      .catch(() => {
        setData(null)
        setLoadFailed(true)
      })
      .finally(() => setLoading(false))
  }, [appId, mode])

  const heroPoster = useMemo(() => data?.share_posters[0] || null, [data])

  const handleAppreciation = async () => {
    if (!data || data.is_preview)
      return

    setAppreciating(true)
    try {
      const result = await toggleStarshipAppreciation(appId)
      setData(prev => prev
        ? {
            ...prev,
            applause_count: result.applause_count,
            applauded_by_current_device: result.applauded_by_current_device,
          }
        : prev)
    }
    finally {
      setAppreciating(false)
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

  if (!data || loadFailed || !heroPoster) {
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
    <div className="mx-auto max-w-lg space-y-5">
      {data.is_preview && (
        <div className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
          {t('share.previewHint')}
        </div>
      )}

      <StarshipPosterSurface
        poster={heroPoster}
        agentName={data.agent.name}
        authorName={data.agent.share_author_name || data.agent.creator_name || t('share.defaultAuthor')}
        shareIntro={data.share_intro}
        icon={data.agent.icon}
        sharePath={`/starship/share/${appId}`}
      />

      <div className="rounded-[32px] border border-white/70 bg-white/90 px-6 py-6 shadow-[0_28px_70px_rgba(15,23,42,0.1)]">
        <div className="text-sm text-slate-500">{t('share.authorLabel')}</div>
        <div className="mt-2 text-lg font-semibold text-slate-900">
          {data.agent.share_author_name || data.agent.creator_name || t('share.defaultAuthor')}
        </div>

        <h1
          className="mt-5 text-4xl leading-tight text-slate-950"
          style={{ fontFamily: 'var(--font-instrument-serif)' }}
        >
          {data.agent.name}
        </h1>

        <div className="mt-4 text-base leading-8 text-slate-600">
          {data.share_intro}
        </div>

        <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
          <div className="text-xs font-semibold tracking-[0.18em] text-slate-400">
            {t('share.openingLineLabel')}
          </div>
          <div className="mt-3 text-base leading-7 text-slate-800">
            {data.opening_line}
          </div>
        </div>

        <Link
          href={mode === 'preview' ? `/starship/publish/${appId}/experience-preview` : `/starship/experience/${appId}`}
          className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-5 py-3.5 text-sm font-medium text-white hover:bg-slate-900"
        >
          {data.is_preview ? t('share.previewExperience') : t('share.startExperience')}
        </Link>

        {!data.is_preview && (
          <button
            type="button"
            onClick={() => void handleAppreciation()}
            disabled={appreciating}
            className={`mt-3 inline-flex w-full items-center justify-center rounded-full border px-5 py-3 text-sm font-medium transition ${data.applauded_by_current_device ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'} disabled:opacity-60`}
          >
            {data.applauded_by_current_device ? t('share.applauded') : t('share.applaud')}
            <span className="ml-2 text-slate-400">·</span>
            <span className="ml-2">{t('share.applauseCount', { count: data.applause_count })}</span>
          </button>
        )}
      </div>
    </div>
  )
}

export default StarshipShareIntro
