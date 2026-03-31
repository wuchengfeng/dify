'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import VersionTimeline from '@/app/components/starship/version-timeline'

const VersionsPage = () => {
  const { t } = useTranslation('starship')
  const { appId } = useParams<{ appId: string }>()

  return (
    <div className="h-full overflow-y-auto px-6 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/starship/my-agents" className="text-sm text-text-tertiary hover:text-text-secondary">
          ←
          {' '}
          {t('myAgents.title')}
        </Link>
      </div>
      <div className="max-w-2xl">
        <VersionTimeline appId={appId} />
      </div>
    </div>
  )
}

export default VersionsPage
