'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import VersionTimeline from '@/app/components/starship/version-timeline'

const StarshipVersionsPage = () => {
  const { t } = useTranslation('starship')
  const { appId } = useParams<{ appId: string }>()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
        <Link href="/starship" className="inline-flex items-center gap-2 hover:text-slate-900">
          <span className="i-ri-arrow-left-line h-4 w-4" />
          {t('workspace.backHome')}
        </Link>
        <span>/</span>
        <Link href={`/starship/workspace/${appId}`} className="hover:text-slate-900">
          {t('workspace.openWorkspace')}
        </Link>
      </div>

      <section className="max-w-3xl rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur">
        <VersionTimeline appId={appId} />
      </section>
    </div>
  )
}

export default StarshipVersionsPage
