'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchStarshipSession } from '@/service/starship'

const LegacyCreatePage = () => {
  const { t } = useTranslation(['starship', 'common'])
  const router = useRouter()

  useEffect(() => {
    fetchStarshipSession().then((session) => {
      router.replace(session.role === 'coach' ? '/starship/coach' : '/starship/student')
    })
  }, [router])

  return (
    <div className="flex h-[60vh] items-center justify-center text-sm text-slate-400">
      {t('loading', { ns: 'common' })}
      ...
    </div>
  )
}

export default LegacyCreatePage
