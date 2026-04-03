'use client'

import type { StarshipAgent, StarshipGroup } from '@/service/starship'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchGroupAgents, fetchMyGroups, forkGroupAgent } from '@/service/starship'
import AgentCard from './agent-card'

const GroupList = () => {
  const { t } = useTranslation(['starship', 'common'])
  const [groups, setGroups] = useState<StarshipGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [groupAgents, setGroupAgents] = useState<Record<string, StarshipAgent[]>>({})
  const [forkMsg, setForkMsg] = useState('')

  useEffect(() => {
    fetchMyGroups()
      .then(res => setGroups(res.items))
      .finally(() => setLoading(false))
  }, [])

  const toggleGroup = async (groupId: string) => {
    if (expanded === groupId) {
      setExpanded(null)
      return
    }
    setExpanded(groupId)
    if (!groupAgents[groupId]) {
      const res = await fetchGroupAgents(groupId)
      setGroupAgents(prev => ({ ...prev, [groupId]: res.items }))
    }
  }

  const handleFork = async (groupId: string, agent: StarshipAgent) => {
    await forkGroupAgent(groupId, agent.id)
    setForkMsg(`${t('groups.fork')} ✓`)
    setTimeout(() => setForkMsg(''), 3000)
  }

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-text-tertiary">
        {t('loading', { ns: 'common' })}
        ...
      </div>
    )
  }

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-text-primary">
        {t('groups.title')}
      </h2>

      {forkMsg && (
        <div className="mb-4 rounded-xl bg-green-50 px-4 py-2 text-sm text-green-700">{forkMsg}</div>
      )}

      {!groups.length
        ? (
            <div className="flex h-32 items-center justify-center text-sm text-text-tertiary">
              {t('groups.noData')}
            </div>
          )
        : (
            <div className="space-y-3">
              {groups.map(group => (
                <div key={group.id} className="rounded-xl border border-divider-subtle bg-background-default">
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="flex w-full items-center justify-between p-4 text-left"
                  >
                    <div>
                      <div className="font-semibold text-text-primary">{group.name}</div>
                      {group.description && (
                        <div className="mt-0.5 text-sm text-text-tertiary">{group.description}</div>
                      )}
                    </div>
                    <span className="text-text-quaternary">{expanded === group.id ? '▲' : '▼'}</span>
                  </button>

                  {expanded === group.id && (
                    <div className="border-t border-divider-subtle p-4">
                      {!groupAgents[group.id]
                        ? (
                            <div className="text-sm text-text-tertiary">
                              {t('loading', { ns: 'common' })}
                              ...
                            </div>
                          )
                        : !groupAgents[group.id].length
                            ? <div className="text-sm text-text-tertiary">{t('myAgents.noData')}</div>
                            : (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                  {groupAgents[group.id].map(agent => (
                                    <AgentCard
                                      key={agent.id}
                                      agent={agent}
                                      isSquare
                                      onFork={a => handleFork(group.id, a)}
                                    />
                                  ))}
                                </div>
                              )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
    </div>
  )
}

export default GroupList
