'use client'

import type { PendingVersion, StarshipAgent, StarshipGroup } from '@/service/starship'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchGroupAgents,
  fetchMyGroups,
  fetchPendingVersions,
  setStarshipMockRole,
} from '@/service/starship'

type UseCoachGroupDetailsResult = {
  currentGroup: StarshipGroup | null
  groupAgents: StarshipAgent[]
  groupPendingVersions: PendingVersion[]
  loading: boolean
  reload: () => Promise<void>
}

type UseCoachGroupDetailsOptions = {
  pollIntervalMs?: number
}

const useCoachGroupDetails = (
  groupId: string,
  options?: UseCoachGroupDetailsOptions,
): UseCoachGroupDetailsResult => {
  const [groups, setGroups] = useState<StarshipGroup[]>([])
  const [groupAgents, setGroupAgents] = useState<StarshipAgent[]>([])
  const [pendingVersions, setPendingVersions] = useState<PendingVersion[]>([])
  const [loading, setLoading] = useState(true)
  const pollIntervalMs = options?.pollIntervalMs || 0

  const load = useCallback(async (config?: { silent?: boolean }) => {
    if (!config?.silent)
      setLoading(true)
    try {
      await setStarshipMockRole('coach')

      const [groupsRes, agentsRes, pendingRes] = await Promise.all([
        fetchMyGroups(),
        fetchGroupAgents(groupId),
        fetchPendingVersions(),
      ])

      setGroups(groupsRes.items)
      setGroupAgents(agentsRes.items)
      setPendingVersions(pendingRes.items)
    }
    catch {
      if (!config?.silent) {
        setGroups([])
        setGroupAgents([])
        setPendingVersions([])
      }
    }
    finally {
      if (!config?.silent)
        setLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!pollIntervalMs)
      return

    const timer = window.setInterval(() => {
      void load({ silent: true })
    }, pollIntervalMs)

    return () => window.clearInterval(timer)
  }, [load, pollIntervalMs])

  const currentGroup = useMemo(
    () => groups.find(group => group.id === groupId) || null,
    [groupId, groups],
  )

  const groupAgentIdSet = useMemo(
    () => new Set(groupAgents.map(agent => agent.id)),
    [groupAgents],
  )

  const groupPendingVersions = useMemo(
    () => pendingVersions.filter(version => groupAgentIdSet.has(version.app_id)),
    [groupAgentIdSet, pendingVersions],
  )

  return {
    currentGroup,
    groupAgents,
    groupPendingVersions,
    loading,
    reload: async () => {
      await load()
    },
  }
}

export default useCoachGroupDetails
