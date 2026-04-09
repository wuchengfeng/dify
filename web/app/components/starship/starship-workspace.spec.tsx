import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createReactI18nextMock } from '@/test/i18n-mock'
import StarshipWorkspacePage from './starship-workspace'

const mockFetchStarshipWorkspace = vi.fn()

vi.mock('react-i18next', () =>
  createReactI18nextMock({
    'workspace.backHome': '返回首页',
    'workspace.currentBadge': '当前项目',
    'workspace.historyBadge': '历史项目',
    'workspace.testTitle': '测试窗口',
    'workspace.testAutoVersionHint': '测试说明',
    'workspace.quickTestOne': '测试一',
    'workspace.quickTestTwo': '测试二',
    'workspace.quickTestThree': '测试三',
    'workspace.noTests': '暂无测试',
    'workspace.testPlaceholder': '输入测试问题',
    'workspace.voiceStart': '语音输入',
    'workspace.voiceStop': '停止录音',
    'workspace.voiceHint': '语音提示',
    'workspace.runTest': '试一试',
    'workspace.projectInfoTitle': '项目来源',
    'workspace.openVersions': '看版本变化',
    'workspace.promptTitle': '正在写提示词',
    'workspace.autoSaveHint': '自动保存提示',
    'workspace.knowledgeTitle': '知识资料',
    'workspace.knowledgeDescription': '资料说明',
    'workspace.uploadKnowledge': '上传资料',
    'workspace.noKnowledge': '还没有上传资料。',
    'workspace.currentProjectTitle': '现在先专心修改和测试',
    'workspace.currentProjectDescription': '老师还没有确认主版本。现在先继续修改和测试，后面的个人继续作品会在项目结束后再出现。',
    'workspace.currentProjectHint': '这节课先把想法写好、测试好。项目结束后，再继续做你自己的作品。',
    'workspace.classroomFinishedTitle': '课堂项目已经结束',
    'workspace.classroomFinishedDescription': '老师主版本已经确认。课堂里的原项目会保留成记录；如果你还想继续完善，就去自己的继续作品里改。',
    'workspace.classroomFinishedCreateHint': '老师主版本已经确认。课堂里的这份会保留成记录；如果你还想继续完善，我可以先帮你准备一份自己的继续作品。',
    'workspace.createFollowupProject': '生成我的继续作品',
  }))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string, children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('@/service/starship', () => ({
  fetchStarshipWorkspace: (...args: unknown[]) => mockFetchStarshipWorkspace(...args),
  forkStarshipWorkspace: vi.fn(),
  runStarshipWorkspaceTest: vi.fn(),
  saveStarshipWorkspace: vi.fn(),
}))

vi.mock('./use-browser-voice-input', () => ({
  default: () => ({
    interimText: '',
    isListening: false,
    isSupported: false,
    startListening: vi.fn(),
    stopListening: vi.fn(),
  }),
}))

const baseWorkspace = {
  session: {
    role: 'student',
    user_id: 'student-1',
    user_name: '李昀齐',
  },
  agent: {
    id: 'classroom-1',
    name: '课堂里的项目',
    description: '课堂项目说明',
    icon: '🤖',
    icon_background: '#1D4ED8',
    is_public: false,
    created_at: 1712500000,
    updated_at: 1712503600,
  },
  group: {
    id: 'group-30',
    name: '周日上午项目组',
    description: '班级说明',
    created_at: 1712500000,
  },
  task: {
    id: 'task-30',
    title: '做一个有帮助的智能体',
    objective: '目标',
    teacher_note: '老师提醒',
    status: 'active',
    group_id: 'group-30',
    group_name: '周日上午项目组',
    main_agent_id: null,
    main_published: false,
  },
  pre_prompt: '你好',
  share_enabled: false,
  share_block_reason: null,
  share_author_name: '',
  share_intro: '',
  opening_line: '',
  test_history: [],
  tool_settings: {
    web_search: true,
    image_recognition: true,
    read_aloud: true,
  },
  knowledge_items: [],
  is_history_project: false,
  project_kind: 'classroom',
  share_posters: [],
  publish_agent: null,
  source_main_agent: null,
}

describe('StarshipWorkspacePage', () => {
  it('keeps current classroom projects in test-only mode before main publish', async () => {
    mockFetchStarshipWorkspace.mockResolvedValue({
      ...baseWorkspace,
      is_history_project: false,
      project_kind: 'classroom',
      publish_agent: null,
    })

    render(<StarshipWorkspacePage appId="classroom-1" />)

    await waitFor(() => {
      expect(screen.getByText('现在先专心修改和测试')).toBeInTheDocument()
    })

    expect(screen.getByText('老师还没有确认主版本。现在先继续修改和测试，后面的个人继续作品会在项目结束后再出现。')).toBeInTheDocument()
    expect(screen.getByText('这节课先把想法写好、测试好。项目结束后，再继续做你自己的作品。')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '生成我的继续作品' })).not.toBeInTheDocument()
    expect(screen.queryByText(/fork/i)).not.toBeInTheDocument()
  })

  it('shows the continue-work action only after the classroom project becomes history', async () => {
    mockFetchStarshipWorkspace.mockResolvedValue({
      ...baseWorkspace,
      is_history_project: true,
      project_kind: 'history',
      publish_agent: null,
    })

    render(<StarshipWorkspacePage appId="classroom-1" />)

    await waitFor(() => {
      expect(screen.getByText('课堂项目已经结束')).toBeInTheDocument()
    })

    expect(screen.getByText('老师主版本已经确认。课堂里的原项目会保留成记录；如果你还想继续完善，就去自己的继续作品里改。')).toBeInTheDocument()
    expect(screen.getByText('老师主版本已经确认。课堂里的这份会保留成记录；如果你还想继续完善，我可以先帮你准备一份自己的继续作品。')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '生成我的继续作品' })).toBeInTheDocument()
    expect(screen.queryByText(/fork/i)).not.toBeInTheDocument()
  })
})
