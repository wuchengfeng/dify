'use client'

import type { DiffNode, LLMNodeInfo, SnapshotItem } from '@/service/control-panel'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchControlPanelSnapshots, fetchSnapshotDiff, fetchSnapshotLLMNodes } from '@/service/control-panel'
import LLMNodeDiff from './llm-node-diff'

type Props = {
  appId: string
}

type RightPanel
  = | { mode: 'empty' }
    | { mode: 'view', snapshotId: string, nodes: LLMNodeInfo[] }
    | { mode: 'diff', nodes: DiffNode[] }

const roleLabel: Record<string, string> = {
  'system': 'System',
  'user': 'User',
  'assistant': 'Assistant',
  'user (memory)': 'User Query Template',
}

const SnapshotTimeline = ({ appId }: Props) => {
  const { t } = useTranslation()
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [checked, setChecked] = useState<string[]>([])
  const [right, setRight] = useState<RightPanel>({ mode: 'empty' })
  const [rightLoading, setRightLoading] = useState(false)

  const handleView = async (id: string) => {
    setActiveId(id)
    setRightLoading(true)
    try {
      const res = await fetchSnapshotLLMNodes(id)
      setRight({ mode: 'view', snapshotId: id, nodes: res.nodes })
    }
    finally {
      setRightLoading(false)
    }
  }

  useEffect(() => {
    fetchControlPanelSnapshots(appId)
      .then((res) => {
        setSnapshots(res.items)
        if (res.items.length > 0)
          handleView(res.items[0].id)
      })
      .finally(() => setLoading(false))
  }, [appId])

  const toggleCheck = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setChecked((prev) => {
      if (prev.includes(id))
        return prev.filter(x => x !== id)
      if (prev.length >= 2)
        return [prev[1], id]
      return [...prev, id]
    })
  }

  const handleCompare = async () => {
    if (checked.length !== 2)
      return
    setRightLoading(true)
    try {
      const idxA = snapshots.findIndex(s => s.id === checked[0])
      const idxB = snapshots.findIndex(s => s.id === checked[1])
      const [aId, bId] = idxA > idxB ? [checked[1], checked[0]] : [checked[0], checked[1]]
      const res = await fetchSnapshotDiff(aId, bId)
      setRight({ mode: 'diff', nodes: res.nodes })
    }
    finally {
      setRightLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-text-tertiary">Loading...</div>
    )
  }

  return (
    <div className="flex gap-6">
      {/* Left: timeline */}
      <div className="w-72 shrink-0">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-text-secondary">
            {t('snapshotList.title', { ns: 'controlPanel' })}
          </span>
          {checked.length === 2 && (
            <button
              onClick={handleCompare}
              disabled={rightLoading}
              className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {rightLoading ? '...' : t('snapshotList.compareSelected', { ns: 'controlPanel' })}
            </button>
          )}
        </div>

        {!snapshots.length
          ? (
              <p className="text-xs text-text-tertiary">{t('snapshotList.noData', { ns: 'controlPanel' })}</p>
            )
          : (
              <div className="space-y-1.5">
                {snapshots.map((snap, idx) => {
                  const isActive = activeId === snap.id
                  const checkOrder = checked.indexOf(snap.id)
                  const isChecked = checkOrder !== -1
                  return (
                    <button
                      key={snap.id}
                      onClick={() => handleView(snap.id)}
                      className={`group w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${
                        isActive
                          ? 'border-primary-300 bg-primary-50'
                          : 'border-divider-subtle bg-background-default hover:bg-background-default-hover'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {/* Checkbox for compare */}
                        <span
                          onClick={e => toggleCheck(e, snap.id)}
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold transition-colors ${
                            isChecked
                              ? 'border-primary-500 bg-primary-500 text-white'
                              : 'border-divider-regular bg-background-default text-transparent group-hover:border-primary-300'
                          }`}
                        >
                          {isChecked ? (checkOrder === 0 ? 'A' : 'B') : ''}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            {idx === 0 && (
                              <span className="rounded bg-green-100 px-1 py-0.5 text-[10px] font-medium text-green-700">
                                Latest
                              </span>
                            )}
                            <span className="text-xs font-medium text-text-primary">
                              {new Date(snap.created_at * 1000).toLocaleString()}
                            </span>
                          </div>
                          <div className="mt-0.5 text-[11px] text-text-tertiary">
                            {snap.created_by_name || '—'}
                            {' · '}
                            {snap.llm_node_count}
                            {' '}
                            LLM nodes
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

        {checked.length === 1 && (
          <p className="mt-2 text-[11px] text-text-tertiary">再勾选一个快照可对比差异</p>
        )}
      </div>

      {/* Right: view / diff panel */}
      <div className="min-w-0 flex-1">
        {rightLoading && (
          <div className="flex h-40 items-center justify-center text-sm text-text-tertiary">Loading...</div>
        )}

        {!rightLoading && right.mode === 'empty' && (
          <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-divider-subtle text-sm text-text-tertiary">
            点击左侧快照查看提示词
          </div>
        )}

        {!rightLoading && right.mode === 'view' && (
          <div className="space-y-4">
            {!right.nodes.length && (
              <p className="text-sm text-text-tertiary">该快照没有 LLM 节点。</p>
            )}
            {right.nodes.map(node => (
              <div key={node.node_id} className="rounded-xl border border-divider-subtle">
                <div className="flex items-center gap-2 border-b border-divider-subtle px-4 py-3">
                  <span className="font-medium text-text-primary">{node.node_title}</span>
                  <span className="text-xs text-text-tertiary">
                    (
                    {node.node_id}
                    )
                  </span>
                  {node.model && (
                    <span className="rounded bg-background-section px-1.5 py-0.5 text-xs text-text-secondary">
                      {node.model}
                    </span>
                  )}
                </div>
                <div className="space-y-2 p-4">
                  {node.prompt_template.map((msg, i) => (
                    <div key={i}>
                      <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
                        {roleLabel[msg.role] ?? msg.role}
                      </div>
                      <pre className="bg-background-code whitespace-pre-wrap rounded-lg p-3 font-mono text-xs text-text-secondary">
                        {msg.text || <span className="italic text-text-quaternary">(empty)</span>}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!rightLoading && right.mode === 'diff' && (
          <>
            <h3 className="mb-4 text-sm font-medium text-text-secondary">
              {t('diff.title', { ns: 'controlPanel' })}
            </h3>
            <LLMNodeDiff nodes={right.nodes} />
          </>
        )}
      </div>
    </div>
  )
}

export default SnapshotTimeline
