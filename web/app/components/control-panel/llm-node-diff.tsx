'use client'

import type { DiffNode } from '@/service/control-panel'
import { useTranslation } from 'react-i18next'
import PromptTextDiff from './prompt-text-diff'

type Props = {
  nodes: DiffNode[]
}

const roleLabel: Record<string, string> = {
  'system': 'System',
  'user': 'User',
  'assistant': 'Assistant',
  'user (memory)': 'User Query Template',
}

const LLMNodeDiff = ({ nodes }: Props) => {
  const { t } = useTranslation()

  if (!nodes.length) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-text-tertiary">
        {t('diff.noChange', { ns: 'controlPanel' })}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {nodes.map(node => (
        <div key={node.node_id} className="rounded-xl border border-divider-subtle">
          <div className="flex items-center justify-between border-b border-divider-subtle px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="font-medium text-text-primary">{node.node_title}</span>
              <span className="text-xs text-text-tertiary">
                (
                {node.node_id}
                )
              </span>
              {node.snapshot_b?.model && (
                <span className="rounded bg-background-section px-1.5 py-0.5 text-xs text-text-secondary">
                  {node.snapshot_b.model}
                </span>
              )}
            </div>
            {node.changed
              ? (
                  <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                    Changed
                  </span>
                )
              : (
                  <span className="rounded-full bg-background-section px-2 py-0.5 text-xs text-text-tertiary">
                    {t('diff.noChange', { ns: 'controlPanel' })}
                  </span>
                )}
          </div>

          {node.changed && (
            <div className="p-4">
              {/* Build combined prompt strings for diff */}
              {(() => {
                const promptsA = (node.snapshot_a?.prompt_template ?? [])
                  .map(p => `[${roleLabel[p.role] ?? p.role}]\n${p.text}`)
                  .join('\n\n')
                const promptsB = (node.snapshot_b?.prompt_template ?? [])
                  .map(p => `[${roleLabel[p.role] ?? p.role}]\n${p.text}`)
                  .join('\n\n')
                return <PromptTextDiff before={promptsA} after={promptsB} />
              })()}
            </div>
          )}

          {!node.changed && node.snapshot_b && (
            <div className="p-4">
              <pre className="bg-background-code whitespace-pre-wrap rounded-lg p-3 font-mono text-xs text-text-secondary">
                {node.snapshot_b.prompt_template
                  .map(p => `[${roleLabel[p.role] ?? p.role}]\n${p.text}`)
                  .join('\n\n')}
              </pre>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default LLMNodeDiff
