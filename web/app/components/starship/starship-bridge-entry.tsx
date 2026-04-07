'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import Loading from '@/app/components/base/loading'
import { fetchStarshipSession } from '@/service/starship'
import { persistStarshipBridgeToken, readStarshipBridgeToken } from '@/utils/starship-bridge'

const subscribeBridgeToken = (onStoreChange: () => void) => {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const handleChange = () => onStoreChange()
  window.addEventListener('popstate', handleChange)
  window.addEventListener('hashchange', handleChange)
  window.addEventListener('storage', handleChange)

  return () => {
    window.removeEventListener('popstate', handleChange)
    window.removeEventListener('hashchange', handleChange)
    window.removeEventListener('storage', handleChange)
  }
}

const getBridgeTokenSnapshot = () => readStarshipBridgeToken()
const getEmptyBridgeToken = () => ''
const getClientReadySnapshot = () => true
const getServerReadySnapshot = () => false

const StarshipBridgeEntry = () => {
  const bridgeToken = useSyncExternalStore(subscribeBridgeToken, getBridgeTokenSnapshot, getEmptyBridgeToken)
  const isClientReady = useSyncExternalStore(() => () => {}, getClientReadySnapshot, getServerReadySnapshot)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!bridgeToken) {
      return
    }

    persistStarshipBridgeToken(bridgeToken)

    fetchStarshipSession()
      .then((session) => {
        const target = session.role === 'coach' ? '/starship/coach' : '/starship/student'
        window.location.replace(target)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : '进入班级失败，请回到个人中心重试。')
      })
  }, [bridgeToken])

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-[28px] border border-white/10 bg-[#0b1424]/90 p-8 text-center shadow-[0_24px_80px_rgba(2,8,23,0.45)] backdrop-blur">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-gradient-to-br from-sky-400 via-blue-500 to-cyan-400 text-2xl shadow-[0_16px_40px_rgba(56,189,248,0.28)]">
          🚀
        </div>

        <h1 className="mt-5 text-2xl font-semibold text-white" style={{ fontFamily: 'var(--font-instrument-serif)' }}>
          正在进入我的班级
        </h1>

        {!error && (
          <>
            <div className="mt-6 flex justify-center">
              <Loading />
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              正在为你打开星舰空间，请稍等一下。
            </p>
          </>
        )}

        {isClientReady && !bridgeToken && !error && (
          <div className="mt-6 rounded-[20px] border border-rose-400/25 bg-rose-400/10 px-4 py-4 text-sm leading-7 text-rose-100">
            进入班级的凭证缺失，请回到个人中心重新进入。
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-[20px] border border-rose-400/25 bg-rose-400/10 px-4 py-4 text-sm leading-7 text-rose-100">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}

export default StarshipBridgeEntry
