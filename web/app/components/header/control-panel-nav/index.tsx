'use client'

import Link from 'next/link'
import { useSelectedLayoutSegment } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/classnames'

type ControlPanelNavProps = {
  className?: string
}

const ControlPanelNav = ({ className }: ControlPanelNavProps) => {
  const { t } = useTranslation()
  const selectedSegment = useSelectedLayoutSegment()
  const activated = selectedSegment === 'control-panel'

  return (
    <Link
      href="/control-panel"
      className={cn(
        className,
        'group',
        activated && 'bg-components-main-nav-nav-button-bg-active shadow-md',
        activated
          ? 'text-components-main-nav-nav-button-text-active'
          : 'text-components-main-nav-nav-button-text hover:bg-components-main-nav-nav-button-bg-hover',
      )}
    >
      {activated
        ? <span className="i-ri-dashboard-fill h-4 w-4" />
        : <span className="i-ri-dashboard-line h-4 w-4" />}
      <div className="ml-2 max-[1024px]:hidden">
        {t('title', { ns: 'controlPanel' })}
      </div>
    </Link>
  )
}

export default ControlPanelNav
