import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createReactI18nextMock } from '@/test/i18n-mock'
import CoachGroupClassroom from './coach-group-classroom'

const mockUseCoachGroupDetails = vi.fn()
const mockFetchStarshipWorkspace = vi.fn()

vi.mock('react-i18next', () => createReactI18nextMock({
  'common.loading': '加载中',
  'coach.backToGroups': '返回我的小组',
  'coach.classroomEmpty': '这个小组还没有能放进课堂看板的关联项目。',
  'coach.classroomEmptyDescription': '等任务和组内项目接好后，这里会显示最多 6 个学生窗口。',
  'coach.classroomTestingSubtitle': '正在测试：{{name}}',
  'workspace.knowledgeTitle': '知识资料',
  'workspace.uploadKnowledge': '上传资料',
  'workspace.noKnowledge': '还没有上传资料。',
  'workspace.removeKnowledge': '删除',
  'workspace.coachSaving': '保存中...',
  'coach.classroomSaveMain': '保存老师主版本',
  'coach.classroomTestSaved': '测试结果已经保存。',
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string, children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('./use-coach-group-details', () => ({
  default: (groupId: string, options?: unknown) => mockUseCoachGroupDetails(groupId, options),
}))

vi.mock('@/service/starship', () => ({
  fetchStarshipWorkspace: (...args: unknown[]) => mockFetchStarshipWorkspace(...args),
  runStarshipWorkspaceTest: vi.fn(),
  saveStarshipWorkspace: vi.fn(),
}))

const baseGroup = {
  id: 'group-class-30',
  name: '周日上午项目组',
  task_title: '周日上午项目组',
  task_id: null as string | null,
  task_published_to_students: false,
  task_main_published: false,
}

const coachAgent = {
  id: 'coach-project-88',
  name: '周日上午项目组主空间',
  description: '主空间',
  icon: '🧭',
  icon_background: '#DBEAFE',
  is_public: false,
  created_at: 1712500000,
  updated_at: 1712503600,
  owner_role: 'coach' as const,
  pre_prompt: '老师主版本提示词',
}

describe('CoachGroupClassroom', () => {
  it('explains clearly that the coach should create a task first when the class has no task yet', async () => {
    mockUseCoachGroupDetails.mockReturnValue({
      currentGroup: baseGroup,
      groupAgents: [],
      loading: false,
      reload: vi.fn(),
    })

    render(<CoachGroupClassroom groupId="group-class-30" />)

    expect(await screen.findByText('这个班还没有任务，先回到班级任务管理页创建一个任务。')).toBeInTheDocument()
  })

  it('explains that student windows only appear after the task is officially published', async () => {
    mockUseCoachGroupDetails.mockReturnValue({
      currentGroup: {
        ...baseGroup,
        task_id: 'task-project-88',
      },
      groupAgents: [coachAgent],
      loading: false,
      reload: vi.fn(),
    })
    mockFetchStarshipWorkspace.mockResolvedValue({
      agent: coachAgent,
      pre_prompt: '老师主版本提示词',
      knowledge_items: [],
    })

    render(<CoachGroupClassroom groupId="group-class-30" />)

    expect(await screen.findByText('这个班的任务还没正式发布给孩子。发布之后，孩子们一进入个人中心，这里就会开始出现他们的创作窗口。')).toBeInTheDocument()
  })

  it('shows student windows and the test panel after the task has been published', async () => {
    mockUseCoachGroupDetails.mockReturnValue({
      currentGroup: {
        ...baseGroup,
        task_id: 'task-project-88',
        task_published_to_students: true,
      },
      groupAgents: [
        coachAgent,
        {
          id: 'student-project-88-student-11',
          name: '陆奕尧的环保医生',
          creator_name: '陆奕尧',
          description: '课堂项目',
          icon: '🚀',
          icon_background: '#FDE68A',
          is_public: false,
          created_at: 1712500000,
          updated_at: 1712503600,
          owner_role: 'student' as const,
          project_kind: 'classroom' as const,
          pre_prompt: '孩子正在写的提示词',
        },
      ],
      loading: false,
      reload: vi.fn(),
    })
    mockFetchStarshipWorkspace.mockResolvedValue({
      agent: coachAgent,
      pre_prompt: '老师主版本提示词',
      knowledge_items: [],
    })

    render(<CoachGroupClassroom groupId="group-class-30" />)

    await waitFor(() => {
      expect(screen.getByText('陆奕尧')).toBeInTheDocument()
    })
    expect(screen.getByText('孩子正在写的提示词')).toBeInTheDocument()
    expect(screen.getByText('正在测试：{{name}}')).toBeInTheDocument()
  })
})
