'use client'

import type { StarshipAgent } from '@/service/starship'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import AgentCard from '@/app/components/starship/agent-card'
import { fetchMyAgents } from '@/service/starship'

const MyAgentsPage = () => {
  const { t } = useTranslation('starship')
  const [agents, setAgents] = useState<StarshipAgent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMyAgents()
      .then(res => setAgents(res.items))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="h-full overflow-y-auto px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">
          {t('myAgents.title')}
        </h1>
        <Link
          href="/starship/create"
          className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          {t('myAgents.create')}
        </Link>
      </div>

      {loading && (
        <div className="flex h-40 items-center justify-center text-sm text-text-tertiary">Loading...</div>
      )}

      {!loading && !agents.length && (
        <div className="flex h-40 items-center justify-center text-sm text-text-tertiary">
          {t('myAgents.noData')}
        </div>
      )}

      {!loading && agents.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {agents.map(agent => (
            <AgentCard key={agent.id} agent={agent} showActions />
          ))}
        </div>
      )}
    </div>
  )
}

export default MyAgentsPage
