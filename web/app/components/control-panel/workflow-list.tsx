'use client'

import type { WorkflowItem } from '@/service/control-panel'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchControlPanelWorkflows } from '@/service/control-panel'

const WorkflowList = () => {
  const { t } = useTranslation()
  const [items, setItems] = useState<WorkflowItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchControlPanelWorkflows()
      .then(res => setItems(res.items))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-gray-400">
        Loading...
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-gray-400">
        {t('workflowList.noData', { ns: 'controlPanel' })}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-divider-subtle">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-divider-subtle bg-background-section-burn text-xs text-text-tertiary">
            <th className="px-4 py-3 text-left font-medium">{t('workflowList.appName', { ns: 'controlPanel' })}</th>
            <th className="px-4 py-3 text-left font-medium">{t('workflowList.lastEditor', { ns: 'controlPanel' })}</th>
            <th className="px-4 py-3 text-left font-medium">{t('workflowList.lastEditedAt', { ns: 'controlPanel' })}</th>
            <th className="px-4 py-3 text-right font-medium">{t('workflowList.llmNodes', { ns: 'controlPanel' })}</th>
            <th className="px-4 py-3 text-right font-medium">{t('workflowList.snapshots', { ns: 'controlPanel' })}</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.app_id} className="border-b border-divider-subtle last:border-0 hover:bg-background-default-hover">
              <td className="px-4 py-3 font-medium text-text-primary">{item.app_name}</td>
              <td className="px-4 py-3 text-text-secondary">
                {item.last_editor_name
                  ? (
                      <span>
                        {item.last_editor_name}
                        <span className="ml-1 text-text-tertiary">
                          (
                          {item.last_editor_email}
                          )
                        </span>
                      </span>
                    )
                  : <span className="text-text-tertiary">{t('workflowList.never', { ns: 'controlPanel' })}</span>}
              </td>
              <td className="px-4 py-3 text-text-secondary">
                {item.last_edited_at
                  ? new Date(item.last_edited_at * 1000).toLocaleString()
                  : <span className="text-text-tertiary">—</span>}
              </td>
              <td className="px-4 py-3 text-right text-text-secondary">{item.llm_node_count}</td>
              <td className="px-4 py-3 text-right text-text-secondary">{item.snapshot_count}</td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/control-panel/${item.app_id}`}
                  className="text-xs font-medium text-primary-600 hover:text-primary-700"
                >
                  {t('workflowList.viewHistory', { ns: 'controlPanel' })}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default WorkflowList
