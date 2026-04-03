'use client'

import type { StarshipRole } from '@/service/starship'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchStarshipSession, setStarshipMockRole } from '@/service/starship'

const MockRoleSwitcher = () => {
  const { t } = useTranslation('starship')
  const router = useRouter()
  const [role, setRole] = useState<StarshipRole>('student')

  useEffect(() => {
    fetchStarshipSession().then(session => setRole(session.role))
  }, [])

  const handleSwitch = async (nextRole: StarshipRole) => {
    setRole(nextRole)
    await setStarshipMockRole(nextRole)
    router.replace(nextRole === 'coach' ? '/starship/coach' : '/starship/student')
    router.refresh()
  }

  return (
    <div className="rounded-[22px] border border-white/10 bg-[#0b1424]/95 px-3 py-3 shadow-[0_16px_40px_rgba(2,8,23,0.32)] backdrop-blur">
      <div className="text-[11px] font-medium tracking-[0.12em] text-slate-400">
        {t('mock.badge')}
      </div>
      <div className="mt-2 inline-flex rounded-full border border-white/10 bg-white/5 p-1">
        {(['coach', 'student'] as StarshipRole[]).map((item) => {
          const active = role === item
          return (
            <button
              key={item}
              type="button"
              onClick={() => handleSwitch(item)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-sky-400 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {item === 'coach' ? t('mock.switchCoach') : t('mock.switchStudent')}
            </button>
          )
        })}
      </div>
      <button
        type="button"
        onClick={() => router.push(role === 'coach' ? '/starship/coach' : '/starship/student')}
        className="mt-2 w-full rounded-full border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5"
      >
        {role === 'coach' ? t('nav.coach') : t('nav.student')}
      </button>
    </div>
  )
}

export default MockRoleSwitcher
