'use client'

import type { StarshipAgent } from '@/service/starship'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchSquare, forkAgent } from '@/service/starship'
import AgentCard from './agent-card'

const AgentSquare = () => {
  const { t } = useTranslation(['starship', 'common'])
  const [agents, setAgents] = useState<StarshipAgent[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [forkMsg, setForkMsg] = useState('')

  const load = (q = '') => {
    fetchSquare({ search: q })
      .then(res => setAgents(res.items))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setLoading(true) // eslint-disable-line react-hooks-extra/no-direct-set-state-in-use-effect -- initial fetch
    load()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    load(search)
  }

  const handleFork = async (agent: StarshipAgent) => {
    await forkAgent(agent.id)
    setForkMsg(t('square.forkSuccess'))
    setTimeout(() => setForkMsg(''), 3000)
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('square.search')}
          className="flex-1 rounded-xl border border-divider-regular bg-background-default px-4 py-2 text-sm outline-none focus:border-primary-400"
        />
        <button type="submit" className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
          {t('square.searchAction')}
        </button>
      </form>

      {forkMsg && (
        <div className="mb-4 rounded-xl bg-green-50 px-4 py-2 text-sm text-green-700">{forkMsg}</div>
      )}

      {loading
        ? (
            <div className="flex h-40 items-center justify-center text-sm text-text-tertiary">
              {t('loading', { ns: 'common' })}
              ...
            </div>
          )
        : !agents.length
            ? <div className="flex h-40 items-center justify-center text-sm text-text-tertiary">{t('square.noData')}</div>
            : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {agents.map(agent => (
                    <AgentCard
                      key={agent.id}
                      agent={agent}
                      isSquare
                      onFork={handleFork}
                    />
                  ))}
                </div>
              )}
    </div>
  )
}

export default AgentSquare
