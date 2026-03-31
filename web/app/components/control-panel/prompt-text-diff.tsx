'use client'

import { useMemo } from 'react'
import { cn } from '@/utils/classnames'

type DiffSegment = {
  text: string
  type: 'equal' | 'insert' | 'delete'
}

function computeDiff(a: string, b: string): DiffSegment[] {
  // Simple line-based diff using LCS
  const aLines = a.split('\n')
  const bLines = b.split('\n')
  const m = aLines.length
  const n = bLines.length

  // LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array.from({ length: n + 1 }, () => 0))
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (aLines[i - 1] === bLines[j - 1])
        dp[i][j] = dp[i - 1][j - 1] + 1
      else
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }

  // Traceback
  const segments: DiffSegment[] = []
  let i = m
  let j = n
  const ops: Array<{ type: 'equal' | 'insert' | 'delete', line: string }> = []
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && aLines[i - 1] === bLines[j - 1]) {
      ops.unshift({ type: 'equal', line: aLines[i - 1] })
      i--
      j--
    }
    else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.unshift({ type: 'insert', line: bLines[j - 1] })
      j--
    }
    else {
      ops.unshift({ type: 'delete', line: aLines[i - 1] })
      i--
    }
  }

  // Merge consecutive ops of same type
  for (const op of ops) {
    const last = segments[segments.length - 1]
    if (last && last.type === op.type)
      last.text += `\n${op.line}`
    else
      segments.push({ type: op.type, text: op.line })
  }

  return segments
}

type Props = {
  before: string
  after: string
  className?: string
}

const PromptTextDiff = ({ before, after, className }: Props) => {
  const segments = useMemo(() => computeDiff(before, after), [before, after])

  return (
    <pre className={cn('bg-background-code whitespace-pre-wrap rounded-lg p-3 font-mono text-xs leading-relaxed', className)}>
      {segments.map((seg, idx) => {
        if (seg.type === 'equal') {
          return <span key={idx} className="text-text-secondary">{seg.text}</span>
        }
        if (seg.type === 'insert') {
          return (
            <span key={idx} className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
              {seg.text.split('\n').map((line, li) => (
                <span key={li} className="block">
                  <span className="select-none text-green-500">+ </span>
                  {line}
                </span>
              ))}
            </span>
          )
        }
        return (
          <span key={idx} className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
            {seg.text.split('\n').map((line, li) => (
              <span key={li} className="block">
                <span className="select-none text-red-500">- </span>
                {line}
              </span>
            ))}
          </span>
        )
      })}
    </pre>
  )
}

export default PromptTextDiff
