import { get } from './base'

export type WorkflowItem = {
  app_id: string
  app_name: string
  last_editor_name: string | null
  last_editor_email: string | null
  last_edited_at: number | null
  llm_node_count: number
  snapshot_count: number
}

export type SnapshotItem = {
  id: string
  created_by_name: string | null
  created_by_email: string | null
  created_at: number
  llm_node_count: number
}

export type PromptMessage = {
  role: string
  text: string
}

export type LLMNodeInfo = {
  node_id: string
  node_title: string
  model: string
  prompt_template: PromptMessage[]
}

export type DiffNode = {
  node_id: string
  node_title: string
  changed: boolean
  snapshot_a: LLMNodeInfo | null
  snapshot_b: LLMNodeInfo | null
}

export const fetchControlPanelWorkflows = (): Promise<{ items: WorkflowItem[] }> =>
  get('/control-panel/workflows')

export const fetchControlPanelSnapshots = (
  appId: string,
  page = 1,
  limit = 20,
): Promise<{ items: SnapshotItem[], total: number, page: number, limit: number }> =>
  get(`/control-panel/workflows/${appId}/snapshots`, { params: { page, limit } })

export const fetchSnapshotLLMNodes = (snapshotId: string): Promise<{ nodes: LLMNodeInfo[] }> =>
  get(`/control-panel/snapshots/${snapshotId}/llm-nodes`)

export const fetchSnapshotDiff = (
  snapshotAId: string,
  snapshotBId: string,
): Promise<{ nodes: DiffNode[] }> =>
  get('/control-panel/snapshots/diff', { params: { a: snapshotAId, b: snapshotBId } })
