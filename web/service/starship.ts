import { get, post } from './base'

// ---- Types ----

export type StarshipAgent = {
  id: string
  name: string
  description: string
  icon: string
  icon_background: string
  is_public: boolean
  created_at: number
  site_code?: string | null
  creator_name?: string | null
  updated_at?: number
}

export type StarshipMember = {
  id: string
  account_id: string
  name: string | null
  email: string | null
  role: 'coach' | 'student'
}

export type AgentVersion = {
  id: string
  version_number: number
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  submitted_by_name: string | null
  submitted_at: number | null
  reviewed_by_name: string | null
  reviewed_at: number | null
  review_comment: string | null
  agent_config: Record<string, unknown>
}

export type PendingVersion = {
  id: string
  app_id: string
  app_name: string | null
  version_number: number
  submitted_by_name: string | null
  submitted_at: number | null
  agent_config: Record<string, unknown>
}

export type StarshipGroup = {
  id: string
  name: string
  description: string
  created_at: number
}

// ---- Member APIs ----

export const fetchStarshipMembers = (): Promise<{ items: StarshipMember[] }> =>
  get('/starship/members')

export const assignStarshipMember = (account_id: string, role: 'coach' | 'student') =>
  post('/starship/members', { body: { account_id, role } })

// ---- Agent APIs ----

export const fetchMyAgents = (): Promise<{ items: StarshipAgent[] }> =>
  get('/starship/agents')

export const createStarshipAgent = (data: {
  name: string
  description: string
  icon: string
  icon_background: string
  pre_prompt: string
}): Promise<{ id: string, name: string }> =>
  post('/starship/agents', { body: data })

export const submitAgentVersion = (appId: string): Promise<{ id: string, version_number: number }> =>
  post(`/starship/agents/${appId}/submit`, {})

export const fetchAgentVersions = (appId: string): Promise<{ items: AgentVersion[] }> =>
  get(`/starship/agents/${appId}/versions`)

// ---- Coach APIs ----

export const fetchPendingVersions = (): Promise<{ items: PendingVersion[] }> =>
  get('/starship/coach/pending')

export const reviewVersion = (versionId: string, action: 'approve' | 'reject', comment = '') =>
  post(`/starship/versions/${versionId}/review`, { body: { action, comment } })

// ---- Square ----

export const fetchSquare = (params: {
  page?: number
  limit?: number
  search?: string
}): Promise<{ items: StarshipAgent[], total: number, page: number, limit: number }> =>
  get('/starship/square', { params })

// ---- Groups ----

export const fetchMyGroups = (): Promise<{ items: StarshipGroup[] }> =>
  get('/starship/groups')

export const createGroup = (data: { name: string, description: string, member_ids: string[] }) =>
  post('/starship/groups', { body: data })

export const fetchGroupAgents = (groupId: string): Promise<{ items: StarshipAgent[] }> =>
  get(`/starship/groups/${groupId}/agents`)

export const forkGroupAgent = (groupId: string, appId: string): Promise<{ id: string, name: string }> =>
  post(`/starship/groups/${groupId}/fork`, { body: { app_id: appId } })

// ---- Fork personal agent (from square) ----

export const forkAgent = (appId: string): Promise<{ id: string, name: string }> =>
  post(`/apps/${appId}/copy`, {
    body: { name: undefined, description: undefined },
  })
