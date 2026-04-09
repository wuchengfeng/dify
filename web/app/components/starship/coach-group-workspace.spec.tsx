import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createReactI18nextMock } from '@/test/i18n-mock'
import CoachGroupWorkspace from './coach-group-workspace'

const mockUseCoachGroupDetails = vi.fn()

vi.mock('react-i18next', () => createReactI18nextMock())

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string, children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('./use-coach-group-details', () => ({
  default: (groupId: string) => mockUseCoachGroupDetails(groupId),
}))

vi.mock('./agent-card', () => ({
  default: ({ agent }: { agent: { name: string } }) => (
    <div data-testid="agent-card">{agent.name}</div>
  ),
}))

vi.mock('./review-panel', () => ({
  default: () => <div data-testid="review-panel" />,
}))

const baseGroup = {
  id: 'group-class-30',
  name: '周日上午项目组',
  description: '本班说明',
  created_at: 1712500000,
  updated_at: 1712503600,
  status: 'active' as const,
  task_title: '智能体任务',
  student_count: 6,
  task_id: null,
  task_published_to_students: false,
  task_main_published: false,
}

describe('CoachGroupWorkspace', () => {
  it('treats missing task as the first action the coach needs to do', () => {
    mockUseCoachGroupDetails.mockReturnValue({
      currentGroup: baseGroup,
      groupAgents: [],
      groupPendingVersions: [],
      loading: false,
      reload: vi.fn(),
    })

    render(<CoachGroupWorkspace groupId="group-class-30" />)

    expect(screen.getByText('还没有任务，先点“新建任务”。')).toBeInTheDocument()
    const taskManagementLink = screen.getByRole('link', { name: '新建任务' })
    expect(taskManagementLink).not.toBeNull()
    expect(taskManagementLink).toHaveAttribute(
      'href',
      '/starship/create?groupId=group-class-30',
    )
  })

  it('shows unpublished task status before the coach releases it to students', () => {
    mockUseCoachGroupDetails.mockReturnValue({
      currentGroup: {
        ...baseGroup,
        task_id: 'task-project-99',
      },
      groupAgents: [],
      groupPendingVersions: [],
      loading: false,
      reload: vi.fn(),
    })

    render(<CoachGroupWorkspace groupId="group-class-30" />)

    expect(screen.getByText('任务已经建好，还没发给孩子。')).toBeInTheDocument()
    expect(screen.getByText('待发布')).toBeInTheDocument()
  })

  it('shows main published status when the class project is finished', () => {
    mockUseCoachGroupDetails.mockReturnValue({
      currentGroup: {
        ...baseGroup,
        task_id: 'task-project-99',
        task_published_to_students: true,
        task_main_published: true,
      },
      groupAgents: [],
      groupPendingVersions: [],
      loading: false,
      reload: vi.fn(),
    })

    render(<CoachGroupWorkspace groupId="group-class-30" />)

    expect(screen.getByText('主版本已经发布，这个班的项目已经结束。')).toBeInTheDocument()
    expect(screen.getByText('已结束')).toBeInTheDocument()
  })
})
