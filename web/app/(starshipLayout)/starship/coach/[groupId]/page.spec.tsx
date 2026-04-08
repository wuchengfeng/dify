import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/app/components/starship/coach-group-workspace', () => ({
  default: ({ groupId }: { groupId: string }) => (
    <div data-testid="coach-group-workspace">{groupId}</div>
  ),
}))

describe('CoachGroupPage', () => {
  it('opens the coach group in workspace mode by default', async () => {
    const module = await import('./page')
    const Page = module.default

    const element = await Page({
      params: Promise.resolve({
        groupId: 'group-class-30',
      }),
    })

    render(element)

    expect(screen.getByTestId('coach-group-workspace')).toHaveTextContent('group-class-30')
  })
})
