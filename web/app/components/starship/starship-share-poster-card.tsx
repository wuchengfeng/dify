'use client'

import type { SharePosterTemplate } from '@/service/starship'
import { toPng } from 'html-to-image'
import Link from 'next/link'
import { QRCodeCanvas as QRCode } from 'qrcode.react'
import { useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { downloadUrl } from '@/utils/download'

type PosterSurfaceProps = {
  poster: SharePosterTemplate
  agentName: string
  authorName: string
  shareIntro: string
  icon: string
  sharePath: string
  className?: string
}

type StarshipSharePosterCardProps = PosterSurfaceProps & {
  isPublished: boolean
}

export const StarshipPosterSurface = ({
  poster,
  agentName,
  authorName,
  shareIntro,
  icon,
  sharePath,
  className = '',
}: PosterSurfaceProps) => {
  const { t } = useTranslation('starship')
  const qrValue = useMemo(() => {
    if (typeof window === 'undefined')
      return poster.qr_url
    return new URL(sharePath, window.location.origin).toString()
  }, [poster.qr_url, sharePath])

  return (
    <div
      className={`relative overflow-hidden rounded-[34px] border border-white/10 bg-[#07111f] shadow-[0_28px_90px_rgba(2,8,23,0.42)] ${className}`.trim()}
      style={{ backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0))' }}
    >
      <div
        className="absolute inset-0 opacity-90"
        style={{ background: `radial-gradient(circle at 14% 18%, ${poster.accent_from}55, transparent 22%), radial-gradient(circle at 88% 14%, ${poster.accent_to}50, transparent 24%), linear-gradient(145deg, #07111f 10%, #0b1830 52%, #0f223f 100%)` }}
      />
      <div className="absolute inset-x-0 top-0 h-36 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),transparent)]" />
      <div className="absolute -left-12 bottom-16 h-28 w-28 rounded-full blur-3xl" style={{ backgroundColor: `${poster.accent_from}70` }} />
      <div className="absolute -right-10 top-24 h-32 w-32 rounded-full blur-3xl" style={{ backgroundColor: `${poster.accent_to}70` }} />

      <div className="relative flex h-full flex-col justify-between gap-6 p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-4">
            <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-white/95">
              {poster.title}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-[20px] border border-white/20 bg-white/85 text-3xl shadow-[0_14px_30px_rgba(15,23,42,0.24)]">
                {icon}
              </div>
              <div>
                <div className="text-[12px] font-semibold tracking-[0.2em] text-sky-100/80">
                  烁途AI+PBL
                </div>
                <div className="mt-1 text-sm font-medium text-slate-200">
                  {authorName || t('share.defaultAuthor')}
                </div>
              </div>
            </div>
          </div>

          <div className="hidden rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[11px] font-medium text-white/70 sm:block">
            {t('share.posterGenerated')}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-black/20 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md sm:p-6">
          <div
            className="text-[32px] font-semibold leading-[1.08] text-white sm:text-[42px]"
            style={{ fontFamily: 'var(--font-instrument-serif)' }}
          >
            {poster.headline || agentName}
          </div>
          <div className="mt-4 text-sm leading-7 text-slate-100/80 sm:text-[15px]">
            {poster.caption || shareIntro}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_136px] sm:items-end">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
            <div className="text-[11px] font-semibold tracking-[0.18em] text-sky-100/75">
              {t('share.posterStoryLabel')}
            </div>
            <div className="mt-3 text-base leading-7 text-white">
              {shareIntro}
            </div>
          </div>

          <div className="rounded-[28px] bg-white p-4 text-center text-slate-900 shadow-[0_18px_40px_rgba(15,23,42,0.3)]">
            <QRCode value={qrValue} size={104} className="mx-auto" />
            <div className="mt-3 text-[11px] font-semibold leading-5 text-slate-500">
              {t('share.posterScanHint')}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const StarshipSharePosterCard = ({
  poster,
  agentName,
  authorName,
  shareIntro,
  icon,
  sharePath,
  isPublished,
}: StarshipSharePosterCardProps) => {
  const { t } = useTranslation('starship')
  const posterRef = useRef<HTMLDivElement | null>(null)

  const handleDownload = async () => {
    if (!posterRef.current)
      return

    const dataUrl = await toPng(posterRef.current, {
      cacheBust: true,
      pixelRatio: 2,
    })
    downloadUrl({
      url: dataUrl,
      fileName: `${agentName}-${poster.title}.png`,
    })
  }

  return (
    <div className="space-y-4">
      <div ref={posterRef}>
        <StarshipPosterSurface
          poster={poster}
          agentName={agentName}
          authorName={authorName}
          shareIntro={shareIntro}
          icon={icon}
          sharePath={sharePath}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleDownload}
          className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-white/5"
        >
          {t('share.downloadPoster')}
        </button>

        <Link
          href={sharePath}
          className="rounded-full bg-sky-400 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-300"
        >
          {isPublished ? t('share.openIntro') : t('share.previewIntro')}
        </Link>

        {!isPublished && (
          <div className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-400">
            {t('share.posterReadyHint')}
          </div>
        )}
      </div>
    </div>
  )
}

export default StarshipSharePosterCard
