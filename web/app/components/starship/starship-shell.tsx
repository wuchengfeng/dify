'use client'

import type { PropsWithChildren } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import MockRoleSwitcher from './mock-role-switcher'

const StarshipShell = ({ children }: PropsWithChildren) => {
  const pathname = usePathname()
  const isPublicSharePage = pathname.startsWith('/starship/share/') || pathname.startsWith('/starship/experience/')
  const isShareIntroPage = pathname.startsWith('/starship/share/')
  const isCoachStudioPage = /^\/starship\/coach\/[^/]+(?:\/classroom)?$/.test(pathname)
  const isCompactPage = pathname.startsWith('/starship/workspace/') || isCoachStudioPage
  const shellClassName = isCoachStudioPage ? 'h-screen overflow-hidden' : 'h-screen overflow-y-auto'

  if (isPublicSharePage) {
    return (
      <div className="h-screen overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_35%),linear-gradient(180deg,_#fffaf0_0%,_#f8fafc_100%)] px-4 py-6">
        <div className={`mx-auto ${isShareIntroPage ? 'max-w-xl' : 'max-w-lg'}`}>
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className={`${shellClassName} bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.22),_transparent_28%),linear-gradient(180deg,_#08111f_0%,_#0b1424_48%,_#0f172a_100%)] text-slate-100`}>
      <div className={`mx-auto flex min-h-full max-w-[1900px] flex-col ${isCompactPage ? 'px-3 py-3 sm:px-4 lg:px-5' : 'px-4 py-4 sm:px-6 lg:px-8'}`}>
        <header className={`flex items-center justify-between ${isCompactPage ? 'mb-2' : 'mb-5'}`}>
          <Link href="/starship" className="inline-flex items-center gap-3">
            <span className={`flex items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 via-blue-500 to-cyan-400 shadow-[0_12px_30px_rgba(56,189,248,0.22)] ${isCompactPage ? 'h-8 w-8 text-sm' : 'h-9 w-9 text-lg'}`}>
              🚀
            </span>
            <div>
              <div className={`${isCompactPage ? 'text-base' : 'text-lg'} leading-none text-white`} style={{ fontFamily: 'var(--font-instrument-serif)' }}>
                烁途AI+PBL
              </div>
            </div>
          </Link>
        </header>

        <main className={isCoachStudioPage ? 'flex-1 overflow-hidden' : 'flex-1'}>
          {children}
        </main>
      </div>

      <div className="fixed bottom-4 right-4 z-40">
        <MockRoleSwitcher />
      </div>
    </div>
  )
}

export default StarshipShell
