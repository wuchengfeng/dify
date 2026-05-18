import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createReactI18nextMock } from '@/test/i18n-mock'
import CreateTaskPage from './page'

const mockReplace = vi.fn()
const mockSearchParamsGet = vi.fn()
const mockUseCoachGroupDetails = vi.fn()
const mockFetchStarshipWorkspace = vi.fn()

vi.mock('react-i18next', () => createReactI18nextMock({
  'common.loading': '加载中',
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string, children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => ({
    get: mockSearchParamsGet,
  }),
}))

vi.mock('@/app/components/starship/use-coach-group-details', () => ({
  default: (groupId: string) => mockUseCoachGroupDetails(groupId),
}))

vi.mock('@/service/starship', () => ({
  deleteStarshipTask: vi.fn(),
  fetchStarshipWorkspace: (...args: unknown[]) => mockFetchStarshipWorkspace(...args),
  publishStarshipTaskMain: vi.fn(),
  publishStarshipTaskToStudents: vi.fn(),
  upsertStarshipTaskForGroup: vi.fn(),
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
  task_id: null as string | null,
  task_published_to_students: false,
  task_main_published: false,
}

describe('CreateTaskPage', () => {
  it('shows the no-task state clearly and avoids technical wording in the flow explanation', async () => {
    mockSearchParamsGet.mockReturnValue('group-class-30')
    mockUseCoachGroupDetails.mockReturnValue({
      currentGroup: baseGroup,
      groupAgents: [],
      loading: false,
      reload: vi.fn(),
    })

    render(<CreateTaskPage />)

    expect(await screen.findByText('当前状态：还没有班级任务')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '保存任务草稿' })).toBeInTheDocument()
    expect(screen.getByText(/最后由教练发布主版本，项目结束后，孩子们再生成自己的继续作品/)).toBeInTheDocument()
    expect(screen.queryByText(/fork/i)).not.toBeInTheDocument()
  })

  it('shows main publish action only after the task has already been published to students', async () => {
    mockSearchParamsGet.mockReturnValue('group-class-30')
    mockUseCoachGroupDetails.mockReturnValue({
      currentGroup: {
        ...baseGroup,
        task_id: 'task-project-88',
        task_published_to_students: true,
      },
      groupAgents: [
        {
          id: 'coach-project-88',
          name: '周日上午项目组主空间',
          description: '主空间',
          icon: '🧭',
          icon_background: '#DBEAFE',
          is_public: false,
          created_at: 1712500000,
          updated_at: 1712503600,
          owner_role: 'coach' as const,
        },
      ],
      loading: false,
      reload: vi.fn(),
    })
    mockFetchStarshipWorkspace.mockResolvedValue({
      agent: {
        id: 'coach-project-88',
        name: '周日上午项目组主空间',
        description: '主空间',
        icon: '🧭',
        icon_background: '#DBEAFE',
        is_public: false,
        created_at: 1712500000,
        updated_at: 1712503600,
      },
      task: {
        id: 'task-project-88',
        teacher_note: '老师提醒',
      },
      pre_prompt: '主版本提示词',
      knowledge_items: [],
    })

    render(<CreateTaskPage />)

    expect(await screen.findByText('当前状态：孩子们已经开始创作')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '发布主版本并结束项目' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '打开课堂看板' })).toHaveAttribute('href', '/starship/coach/group-class-30/classroom')
  })
})
