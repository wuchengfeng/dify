'use client'

import type { StarshipAgent } from '@/service/starship'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'

type Props = {
  agent: StarshipAgent
  showActions?: boolean
  onFork?: (agent: StarshipAgent) => void
  isSquare?: boolean
}

const AgentCard = ({ agent, showActions = false, onFork, isSquare = false }: Props) => {
  const { t } = useTranslation('starship')

  return (
    <div className="flex flex-col rounded-xl border border-divider-subtle bg-background-default p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
          style={{ backgroundColor: agent.icon_background || '#FFEAD5' }}
        >
          {agent.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-text-primary">{agent.name}</div>
          <div className="mt-0.5 line-clamp-2 text-xs text-text-tertiary">
            {agent.description || '—'}
          </div>
        </div>
      </div>

      {agent.creator_name && (
        <div className="mt-2 text-[11px] text-text-quaternary">
          by
          {agent.creator_name}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        {isSquare && agent.site_code && (
          <a
            href={`/chat/${agent.site_code}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 rounded-lg bg-primary-600 px-3 py-1.5 text-center text-xs font-medium text-white hover:bg-primary-700"
          >
            {t('square.chat')}
          </a>
        )}
        {isSquare && onFork && (
          <button
            onClick={() => onFork(agent)}
            className="flex-1 rounded-lg border border-divider-regular px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-background-default-hover"
          >
            {t('square.fork')}
          </button>
        )}
        {showActions && (
          <>
            <Link
              href={`/app/${agent.id}/configuration`}
              className="flex-1 rounded-lg border border-divider-regular px-3 py-1.5 text-center text-xs font-medium text-text-secondary hover:bg-background-default-hover"
            >
              {t('myAgents.edit')}
            </Link>
            <Link
              href={`/starship/${agent.id}/versions`}
              className="flex-1 rounded-lg border border-divider-regular px-3 py-1.5 text-center text-xs font-medium text-text-secondary hover:bg-background-default-hover"
            >
              {t('myAgents.versions')}
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

export default AgentCard
