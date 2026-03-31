'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppContext } from '@/context/app-context'

const StarshipHomePage = () => {
  const { t } = useTranslation('starship')
  const router = useRouter()
  const { userProfile } = useAppContext()

  useEffect(() => {
    if (userProfile?.id)
      router.replace('/starship/my-agents')
    else
      router.replace('/starship/square')
  }, [userProfile, router])

  return (
    <div className="flex h-full items-center justify-center text-sm text-text-tertiary">
      {t('title')}
      ...
    </div>
  )
}

export default StarshipHomePage
