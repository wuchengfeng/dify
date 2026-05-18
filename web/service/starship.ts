import { AG_API_BASE } from '@/config'
import { BRIDGE_TOKEN_QUERY_KEY, BRIDGE_TOKEN_STORAGE_KEY, isStarshipBridgeRequest, readStarshipBridgeToken } from '@/utils/starship-bridge'

type Timestamp = number

export type StarshipRole = 'coach' | 'student'
export type StarshipProjectKind = 'classroom' | 'publish' | 'history' | 'coach'

export type StarshipAgent = {
  id: string
  name: string
  description: string
  icon: string
  icon_background: string
  is_public: boolean
  created_at: Timestamp
  site_code?: string | null
  creator_name?: string | null
  updated_at?: Timestamp
  group_id?: string | null
  group_name?: string | null
  task_title?: string | null
  owner_role?: StarshipRole
  share_author_name?: string | null
  share_intro?: string | null
  opening_line?: string | null
  pre_prompt?: string | null
  project_kind?: StarshipProjectKind
  source_main_agent_id?: string | null
  source_agent_id?: string | null
}

export type StarshipMember = {
  id: string
  account_id: string
  name: string | null
  email: string | null
  role: StarshipRole
}

export type AgentVersion = {
  id: string
  version_number: number
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  submitted_by_name: string | null
  submitted_at: Timestamp | null
  reviewed_by_name: string | null
  reviewed_at: Timestamp | null
  review_comment: string | null
  agent_config: Record<string, unknown>
}

export type PendingVersion = {
  id: string
  app_id: string
  app_name: string | null
  version_number: number
  submitted_by_name: string | null
  submitted_at: Timestamp | null
  agent_config: Record<string, unknown>
}

export type StarshipGroup = {
  id: string
  name: string
  description: string
  created_at: Timestamp
  status?: 'active' | 'history'
  task_title?: string | null
  student_count?: number
  updated_at?: Timestamp
  coach_agent_id?: string | null
  task_id?: string | null
  task_status?: 'missing' | 'draft' | 'published' | 'main_published'
  task_published_to_students?: boolean
  task_main_published?: boolean
}

export type StarshipSession = {
  role: StarshipRole
  user_id: string
  user_name: string
}

export type StarshipTask = {
  id: string
  title: string
  objective: string
  teacher_note: string
  status: 'active' | 'closed'
  group_id: string
  group_name: string
  main_agent_id: string | null
  main_published: boolean
}

export type StudentDashboard = {
  session: StarshipSession
  current_task: StarshipTask | null
  current_group: StarshipGroup | null
  main_agent: StarshipAgent | null
  current_projects: StarshipAgent[]
  publish_agents: StarshipAgent[]
  history_agents: StarshipAgent[]
  draft_agents: StarshipAgent[]
  published_agents: StarshipAgent[]
}

export type WorkspaceToolSettings = {
  web_search: boolean
  image_recognition: boolean
  read_aloud: boolean
}

export type KnowledgeItem = {
  id: string
  name: string
  size_label: string
}

export type WorkspaceTestRecord = {
  id: string
  input: string
  output: string
  created_at: Timestamp
}

export type SharePosterTemplate = {
  id: string
  title: string
  headline: string
  caption: string
  accent_from: string
  accent_to: string
  qr_url: string
}

export type StarshipWorkspace = {
  session: StarshipSession
  agent: StarshipAgent
  group: StarshipGroup | null
  task: StarshipTask | null
  pre_prompt: string
  share_enabled: boolean
  share_block_reason: string | null
  share_author_name: string
  share_intro: string
  opening_line: string
  test_history: WorkspaceTestRecord[]
  tool_settings: WorkspaceToolSettings
  knowledge_items: KnowledgeItem[]
  is_history_project: boolean
  project_kind: StarshipProjectKind
  share_posters: SharePosterTemplate[]
  publish_agent: StarshipAgent | null
  source_main_agent: StarshipAgent | null
}

export type PublicStarshipAgent = {
  agent: StarshipAgent
  share_intro: string
  opening_line: string
  is_preview: boolean
  is_share_ready: boolean
  share_posters: SharePosterTemplate[]
  applause_count: number
  applauded_by_current_device: boolean
}

type InternalAgent = StarshipAgent & {
  owner_id: string
  pre_prompt: string
  tool_settings?: WorkspaceToolSettings
  knowledge_items?: KnowledgeItem[]
}

type InternalVersion = AgentVersion & {
  app_id: string
}

type MockDb = {
  session_role: StarshipRole
  sessions: Record<StarshipRole, StarshipSession>
  groups: StarshipGroup[]
  tasks: StarshipTask[]
  agents: InternalAgent[]
  versions: InternalVersion[]
  tests: Record<string, WorkspaceTestRecord[]>
  posters: Record<string, SharePosterTemplate[]>
  appreciation: Record<string, number>
}

const MOCK_ROLE_STORAGE_KEY = 'starship-mock-role'
const APPRECIATION_STORAGE_KEY = 'starship-public-appreciation'
const ROOT_KEY = '__STARSHIP_MOCK_DB__'
const ROOT_MODE_KEY = '__STARSHIP_DB_MODE__'
const ROOT_BRIDGE_TOKEN_KEY = '__STARSHIP_BRIDGE_TOKEN__'
type StarshipApiResponse<T> = {
  success: boolean
  data?: T
  message?: string
}

const now = (value: string): Timestamp => Math.floor(new Date(value).getTime() / 1000)

const makeId = (prefix: string) => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    return `${prefix}-${crypto.randomUUID()}`
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

const clone = <T>(value: T): T => {
  if (typeof structuredClone === 'function')
    return structuredClone(value)
  return JSON.parse(JSON.stringify(value)) as T
}

const withDelay = async <T>(value: T, wait = 120): Promise<T> =>
  new Promise(resolve => setTimeout(() => resolve(clone(value)), wait))

const DEFAULT_ENABLED_TOOLS: WorkspaceToolSettings = {
  web_search: true,
  image_recognition: true,
  read_aloud: true,
}

const buildMockWorkspaceTestOutput = (agent: InternalAgent, input: string) => {
  const plainInput = input.trim()
  const opening = agent.opening_line || `你好，我是${agent.name}。`
  return `${opening} 这是演示环境下的本地测试结果，我先记下你的问题“${plainInput}”，线上真实环境会按当前项目配置和模型设置来回答。`
}

const getToolSettings = (agent: Pick<InternalAgent, 'owner_role' | 'tool_settings'>): WorkspaceToolSettings =>
  clone({
    ...DEFAULT_ENABLED_TOOLS,
    ...(agent.tool_settings || {}),
    web_search: true,
    image_recognition: true,
    read_aloud: true,
  })

const getKnowledgeItems = (agent: Pick<InternalAgent, 'knowledge_items'>): KnowledgeItem[] =>
  clone(agent.knowledge_items || [])

const getOpeningLine = (agent: Pick<InternalAgent, 'opening_line' | 'share_intro' | 'name'>) =>
  agent.opening_line || `你好呀，我是${agent.name}。你想先从哪里开始？`

const getAppreciationSet = () => {
  if (typeof window === 'undefined')
    return new Set<string>()

  const raw = window.localStorage.getItem(APPRECIATION_STORAGE_KEY)
  if (!raw)
    return new Set<string>()

  try {
    return new Set(JSON.parse(raw) as string[])
  }
  catch {
    return new Set<string>()
  }
}

const persistAppreciationSet = (value: Set<string>) => {
  if (typeof window === 'undefined')
    return
  window.localStorage.setItem(APPRECIATION_STORAGE_KEY, JSON.stringify([...value]))
}

const buildShareUrl = (agent: Pick<InternalAgent, 'site_code' | 'id'>) => `https://share.suotuai.com/starship/${agent.site_code || agent.id}`

const createPosterSet = (agent: InternalAgent): SharePosterTemplate[] => {
  const qrUrl = buildShareUrl(agent)
  const author = agent.share_author_name || agent.creator_name || '课堂作品'
  const intro = agent.share_intro || agent.description || '快来看看我的作品'

  return [
    {
      id: `${agent.id}-poster-story`,
      title: '故事版',
      headline: agent.name,
      caption: `${author} · ${intro}`,
      accent_from: '#FB923C',
      accent_to: '#F472B6',
      qr_url: qrUrl,
    },
    {
      id: `${agent.id}-poster-showcase`,
      title: '展示版',
      headline: agent.name,
      caption: `${author} 邀请你来体验这个作品`,
      accent_from: '#38BDF8',
      accent_to: '#4F46E5',
      qr_url: qrUrl,
    },
    {
      id: `${agent.id}-poster-minimal`,
      title: '极简版',
      headline: agent.name,
      caption: intro,
      accent_from: '#14B8A6',
      accent_to: '#22C55E',
      qr_url: qrUrl,
    },
  ]
}

const buildAgentConfig = (agent: InternalAgent): Record<string, unknown> => ({
  description: agent.description,
  icon: agent.icon,
  icon_background: agent.icon_background,
  pre_prompt: agent.pre_prompt,
  share_author_name: agent.share_author_name,
  share_intro: agent.share_intro,
  opening_line: getOpeningLine(agent),
  tool_settings: getToolSettings(agent),
  knowledge_items: getKnowledgeItems(agent),
})

const createInitialDb = (): MockDb => {
  const groups: StarshipGroup[] = [
    {
      id: 'group-orbit',
      name: '文明之旅创作组',
      description: '这节课大家一起做“火星导览员”，一共有 6 个孩子同时创作。',
      created_at: now('2026-03-20T09:00:00+08:00'),
      status: 'active',
      task_title: '火星导览员',
      student_count: 6,
      updated_at: now('2026-04-02T10:12:00+08:00'),
      coach_agent_id: 'agent-coach-main',
    },
    {
      id: 'group-nebula',
      name: '植物观察二组',
      description: '这个班正在准备下一次课的主题“植物观察员”。',
      created_at: now('2026-03-22T09:00:00+08:00'),
      status: 'active',
      task_title: '植物观察员',
      student_count: 5,
      updated_at: now('2026-04-02T08:50:00+08:00'),
      coach_agent_id: 'agent-coach-botany',
    },
    {
      id: 'group-comet',
      name: '月球博物馆结课组',
      description: '上一个主题“月球博物馆讲解员”已经结课，现在作为历史项目保留。',
      created_at: now('2026-03-10T09:00:00+08:00'),
      status: 'history',
      task_title: '月球博物馆讲解员',
      student_count: 4,
      updated_at: now('2026-03-27T18:20:00+08:00'),
      coach_agent_id: 'agent-coach-museum',
    },
  ]

  const tasks: StarshipTask[] = [
    {
      id: 'task-orbit-main',
      title: '火星导览员',
      objective: '做一个能带新同学认识火星基地规则、地点和安全提示的智能体。',
      teacher_note: '先让它会打招呼，再慢慢补充地图、规则和有趣的故事。',
      status: 'active',
      group_id: 'group-orbit',
      group_name: '文明之旅创作组',
      main_agent_id: 'agent-coach-main',
      main_published: true,
    },
    {
      id: 'task-nebula-main',
      title: '植物观察员',
      objective: '做一个能记录植物生长变化并鼓励同学观察的智能体。',
      teacher_note: '先把观察流程定清楚，再慢慢加上有温度的表达。',
      status: 'active',
      group_id: 'group-nebula',
      group_name: '植物观察二组',
      main_agent_id: 'agent-coach-botany',
      main_published: false,
    },
    {
      id: 'task-comet-museum',
      title: '月球博物馆讲解员',
      objective: '做一个能带参观者认识月球博物馆展区和故事的智能体。',
      teacher_note: '这已经是历史任务了，主要用于回看作品和课堂记录。',
      status: 'closed',
      group_id: 'group-comet',
      group_name: '月球博物馆结课组',
      main_agent_id: 'agent-coach-museum',
      main_published: true,
    },
  ]

  const agents: InternalAgent[] = [
    {
      id: 'agent-coach-main',
      name: '火星导览主版本',
      description: '教练整理后的主版本，用来给孩子们继续分叉和创作。',
      icon: '🚀',
      icon_background: '#FFEAD5',
      is_public: true,
      created_at: now('2026-03-26T10:00:00+08:00'),
      site_code: 'starship-mars-main',
      creator_name: '林老师',
      updated_at: now('2026-04-02T09:30:00+08:00'),
      group_id: 'group-orbit',
      group_name: '文明之旅创作组',
      task_title: '火星导览员',
      owner_role: 'coach',
      owner_id: 'coach-lin',
      pre_prompt: '你是火星基地的小小导览员，要用孩子能听懂的方式介绍规则、空间和礼仪。',
      share_author_name: '林老师',
      share_intro: '一个帮助新同学认识火星基地的主版本智能体。',
      opening_line: '你好呀，我是火星导览主版本。想先认识火星基地的哪里？',
      project_kind: 'coach',
      tool_settings: {
        web_search: true,
        image_recognition: true,
        read_aloud: true,
      },
      knowledge_items: [
        { id: 'kb-orbit-1', name: '火星基地规则.pdf', size_label: '2.4 MB' },
        { id: 'kb-orbit-2', name: '火星基地地图.png', size_label: '860 KB' },
      ],
    },
    {
      id: 'agent-amy-guide',
      name: '小明的月球展厅导游',
      description: '这是上一期结课后留下来的历史项目。',
      icon: '🪐',
      icon_background: '#E0F2FE',
      is_public: true,
      created_at: now('2026-03-28T11:00:00+08:00'),
      site_code: 'amy-mars-guide',
      creator_name: '小明',
      updated_at: now('2026-04-02T10:10:00+08:00'),
      group_id: 'group-comet',
      group_name: '月球博物馆结课组',
      task_title: '月球博物馆讲解员',
      owner_role: 'student',
      owner_id: 'student-amy',
      pre_prompt: '你是小明做的月球展厅导游，要像带着朋友参观一样介绍展厅里的故事。',
      share_author_name: '小明的月球展厅导游',
      share_intro: '欢迎来到我做的月球展厅，一起边走边看。',
      opening_line: '欢迎来到我的月球展厅，我先带你认识最有趣的展区吧。',
      project_kind: 'history',
      source_main_agent_id: 'agent-coach-museum',
      knowledge_items: [
        { id: 'kb-museum-1', name: '月球展厅故事.txt', size_label: '24 KB' },
      ],
    },
    {
      id: 'agent-amy-draft',
      name: '小明的火星导览员',
      description: '这是我现在正在做的课堂项目，还会继续改。',
      icon: '📚',
      icon_background: '#FFF7ED',
      is_public: false,
      created_at: now('2026-03-30T14:20:00+08:00'),
      site_code: null,
      creator_name: '小明',
      updated_at: now('2026-04-02T10:12:00+08:00'),
      group_id: 'group-orbit',
      group_name: '文明之旅创作组',
      task_title: '火星导览员',
      owner_role: 'student',
      owner_id: 'student-amy',
      pre_prompt: '你是小明做的火星导览员，要先欢迎大家，再用故事带大家认识火星基地。',
      share_author_name: '小明',
      share_intro: '用故事带你认识火星基地。',
      opening_line: '你好呀，我是火星故事导览员，我们先从欢迎大厅开始吧。',
      project_kind: 'classroom',
      source_main_agent_id: 'agent-coach-main',
      knowledge_items: [
        { id: 'kb-xiaoming-1', name: '火星小故事.docx', size_label: '96 KB' },
      ],
    },
    {
      id: 'agent-ben-guide',
      name: '小红的规则提醒器',
      description: '重点提醒孩子不要在火星基地里做危险动作。',
      icon: '🛡️',
      icon_background: '#F0FDF4',
      is_public: false,
      created_at: now('2026-03-30T13:40:00+08:00'),
      site_code: null,
      creator_name: '小红',
      updated_at: now('2026-04-02T09:55:00+08:00'),
      group_id: 'group-orbit',
      group_name: '文明之旅创作组',
      task_title: '火星导览员',
      owner_role: 'student',
      owner_id: 'student-ben',
      pre_prompt: '你是一个规则提醒器，要简短、清楚、带一点鼓励。',
      share_author_name: '小红',
      share_intro: '我做了一个专门提醒基地规则的机器人。',
      project_kind: 'classroom',
      source_main_agent_id: 'agent-coach-main',
    },
    {
      id: 'agent-cici-guide',
      name: '小雨的基地地图官',
      description: '可以带孩子认识基地里的教室、宿舍和实验区。',
      icon: '🗺️',
      icon_background: '#EFF6FF',
      is_public: false,
      created_at: now('2026-03-29T16:40:00+08:00'),
      site_code: null,
      creator_name: '小雨',
      updated_at: now('2026-04-02T09:42:00+08:00'),
      group_id: 'group-orbit',
      group_name: '文明之旅创作组',
      task_title: '火星导览员',
      owner_role: 'student',
      owner_id: 'student-cici',
      pre_prompt: '你是基地地图官，要帮助孩子认识空间位置和路线。',
      share_author_name: '小雨',
      share_intro: '一起来认识火星基地的不同区域。',
      project_kind: 'classroom',
      source_main_agent_id: 'agent-coach-main',
    },
    {
      id: 'agent-dodo-guide',
      name: '小鹿的火星礼仪官',
      description: '重点负责火星基地里的合作礼仪和相处方式。',
      icon: '🤝',
      icon_background: '#FEF2F2',
      is_public: false,
      created_at: now('2026-03-29T17:10:00+08:00'),
      site_code: null,
      creator_name: '小鹿',
      updated_at: now('2026-04-02T09:40:00+08:00'),
      group_id: 'group-orbit',
      group_name: '文明之旅创作组',
      task_title: '火星导览员',
      owner_role: 'student',
      owner_id: 'student-dodo',
      pre_prompt: '你是礼仪官，要鼓励大家友好合作、轮流说话。',
      share_author_name: '小鹿',
      share_intro: '在火星基地里也要记得礼貌和合作。',
      project_kind: 'classroom',
      source_main_agent_id: 'agent-coach-main',
    },
    {
      id: 'agent-ella-guide',
      name: '小海的补给站小助手',
      description: '专门介绍补给站的位置、作用和注意事项。',
      icon: '🧃',
      icon_background: '#FDF4FF',
      is_public: false,
      created_at: now('2026-03-31T09:05:00+08:00'),
      site_code: null,
      creator_name: '小海',
      updated_at: now('2026-04-02T09:20:00+08:00'),
      group_id: 'group-orbit',
      group_name: '文明之旅创作组',
      task_title: '火星导览员',
      owner_role: 'student',
      owner_id: 'student-ella',
      pre_prompt: '你是补给站小助手，要介绍补给站的物资和使用顺序。',
      share_author_name: '小海',
      share_intro: '补给站是火星基地里非常重要的地方。',
      project_kind: 'classroom',
      source_main_agent_id: 'agent-coach-main',
    },
    {
      id: 'agent-finn-guide',
      name: '小青的火星问答员',
      description: '孩子提什么就回答什么，是课堂里的开放问答版本。',
      icon: '💬',
      icon_background: '#F0FFF4',
      is_public: false,
      created_at: now('2026-03-31T09:30:00+08:00'),
      site_code: null,
      creator_name: '小青',
      updated_at: now('2026-04-02T09:18:00+08:00'),
      group_id: 'group-orbit',
      group_name: '文明之旅创作组',
      task_title: '火星导览员',
      owner_role: 'student',
      owner_id: 'student-finn',
      pre_prompt: '你是问答员，要先回答问题，再提醒安全和规则。',
      share_author_name: '小青',
      share_intro: '欢迎来问我关于火星基地的一切。',
      project_kind: 'classroom',
      source_main_agent_id: 'agent-coach-main',
    },
    {
      id: 'agent-coach-botany',
      name: '植物观察主版本',
      description: '植物观察二组的老师主版本，还没有发布给学生公开。',
      icon: '🌿',
      icon_background: '#F0FDF4',
      is_public: false,
      created_at: now('2026-03-27T12:00:00+08:00'),
      site_code: null,
      creator_name: '林老师',
      updated_at: now('2026-04-02T08:50:00+08:00'),
      group_id: 'group-nebula',
      group_name: '植物观察二组',
      task_title: '植物观察员',
      owner_role: 'coach',
      owner_id: 'coach-lin',
      pre_prompt: '你是植物观察主版本，要帮助孩子一步一步记录植物变化。',
      share_author_name: '林老师',
      share_intro: '帮助孩子学会观察和记录植物。',
      project_kind: 'coach',
    },
    {
      id: 'agent-coach-museum',
      name: '月球博物馆主版本',
      description: '历史项目里的教练主版本，用来保留课堂成果。',
      icon: '🌕',
      icon_background: '#FEF3C7',
      is_public: true,
      created_at: now('2026-03-18T10:00:00+08:00'),
      site_code: 'moon-museum-main',
      creator_name: '林老师',
      updated_at: now('2026-03-27T18:00:00+08:00'),
      group_id: 'group-comet',
      group_name: '月球博物馆结课组',
      task_title: '月球博物馆讲解员',
      owner_role: 'coach',
      owner_id: 'coach-lin',
      pre_prompt: '你是月球博物馆的小讲解员，要带着孩子按展区顺序参观，并穿插有趣故事。',
      share_author_name: '林老师',
      share_intro: '这是上一期月球博物馆项目的主版本。',
      project_kind: 'coach',
    },
    {
      id: 'agent-amy-museum',
      name: '小明的月球故事讲解员',
      description: '上一次结课后保留下来的历史项目版本。',
      icon: '🌙',
      icon_background: '#E0E7FF',
      is_public: true,
      created_at: now('2026-03-21T15:00:00+08:00'),
      site_code: 'amy-moon-guide',
      creator_name: '小明',
      updated_at: now('2026-03-27T18:20:00+08:00'),
      group_id: 'group-comet',
      group_name: '月球博物馆结课组',
      task_title: '月球博物馆讲解员',
      owner_role: 'student',
      owner_id: 'student-amy',
      pre_prompt: '你是小明的月球故事讲解员，要像讲故事一样介绍展厅里的内容。',
      share_author_name: '小明的月球故事讲解员',
      share_intro: '欢迎来参观我做的月球博物馆导览。',
      project_kind: 'history',
      source_main_agent_id: 'agent-coach-museum',
    },
    {
      id: 'agent-amy-publish',
      name: '小明的火星故事导览',
      description: '这是老师主版本结束后，我继续改出来的分享版。',
      icon: '🚀',
      icon_background: '#DBEAFE',
      is_public: false,
      created_at: now('2026-04-02T10:30:00+08:00'),
      site_code: 'amy-mars-story',
      creator_name: '小明',
      updated_at: now('2026-04-02T10:35:00+08:00'),
      group_id: 'group-orbit',
      group_name: '文明之旅创作组',
      task_title: '火星导览员',
      owner_role: 'student',
      owner_id: 'student-amy',
      pre_prompt: '你是小明的火星故事导览员，要先欢迎大家，再像讲冒险故事一样介绍火星基地。',
      share_author_name: '小明的火星故事导览',
      share_intro: '欢迎来听我讲火星基地里的故事。',
      opening_line: '欢迎来到我的火星故事站，我先讲一个关于火星基地的小秘密。',
      project_kind: 'publish',
      source_main_agent_id: 'agent-coach-main',
      source_agent_id: 'agent-amy-draft',
      knowledge_items: [
        { id: 'kb-amy-publish-1', name: '火星导览故事卡.pdf', size_label: '1.2 MB' },
      ],
    },
  ]

  const versions: InternalVersion[] = [
    {
      id: 'version-amy-1',
      app_id: 'agent-amy-guide',
      version_number: 1,
      status: 'approved',
      submitted_by_name: '小明',
      submitted_at: now('2026-03-31T17:30:00+08:00'),
      reviewed_by_name: '林老师',
      reviewed_at: now('2026-03-31T19:10:00+08:00'),
      review_comment: '欢迎语很不错，可以再加一点火星基地里的地点介绍。',
      agent_config: buildAgentConfig(agents[1]),
    },
    {
      id: 'version-amy-2',
      app_id: 'agent-amy-draft',
      version_number: 1,
      status: 'draft',
      submitted_by_name: null,
      submitted_at: null,
      reviewed_by_name: null,
      reviewed_at: null,
      review_comment: null,
      agent_config: buildAgentConfig(agents[2]),
    },
    {
      id: 'version-amy-publish-1',
      app_id: 'agent-amy-publish',
      version_number: 1,
      status: 'draft',
      submitted_by_name: null,
      submitted_at: null,
      reviewed_by_name: null,
      reviewed_at: null,
      review_comment: null,
      agent_config: buildAgentConfig(agents[11]),
    },
    {
      id: 'version-ben-1',
      app_id: 'agent-ben-guide',
      version_number: 1,
      status: 'submitted',
      submitted_by_name: '小红',
      submitted_at: now('2026-04-02T09:52:00+08:00'),
      reviewed_by_name: null,
      reviewed_at: null,
      review_comment: null,
      agent_config: buildAgentConfig(agents[3]),
    },
    {
      id: 'version-cici-1',
      app_id: 'agent-cici-guide',
      version_number: 1,
      status: 'submitted',
      submitted_by_name: '小雨',
      submitted_at: now('2026-04-02T09:46:00+08:00'),
      reviewed_by_name: null,
      reviewed_at: null,
      review_comment: null,
      agent_config: buildAgentConfig(agents[4]),
    },
    {
      id: 'version-coach-main-1',
      app_id: 'agent-coach-main',
      version_number: 1,
      status: 'approved',
      submitted_by_name: '林老师',
      submitted_at: now('2026-03-29T20:00:00+08:00'),
      reviewed_by_name: '林老师',
      reviewed_at: now('2026-03-29T20:05:00+08:00'),
      review_comment: '作为主版本发布。',
      agent_config: buildAgentConfig(agents[0]),
    },
    {
      id: 'version-amy-museum-1',
      app_id: 'agent-amy-museum',
      version_number: 1,
      status: 'approved',
      submitted_by_name: '小明',
      submitted_at: now('2026-03-27T17:30:00+08:00'),
      reviewed_by_name: '林老师',
      reviewed_at: now('2026-03-27T18:10:00+08:00'),
      review_comment: '这个版本保留在历史项目里展示。',
      agent_config: buildAgentConfig(agents[10]),
    },
  ]

  const tests: Record<string, WorkspaceTestRecord[]> = {
    'agent-amy-guide': [
      {
        id: 'test-amy-1',
        input: '请你先欢迎我，再告诉我为什么进入实验区要戴头盔。',
        output: '欢迎来到火星基地。进入实验区要戴头盔，因为那里可能有漂浮颗粒和突发实验声音，先保护好自己我们再去参观。',
        created_at: now('2026-04-02T10:08:00+08:00'),
      },
    ],
    'agent-amy-draft': [
      {
        id: 'test-amy-draft-1',
        input: '给我讲一个火星宿舍的睡前故事。',
        output: '火星宿舍的灯会慢慢变暗，提醒大家安静下来。小明的火星导览员会先带你认识睡前规则，再讲一个关于红色星空的小故事。',
        created_at: now('2026-04-02T10:09:00+08:00'),
      },
    ],
    'agent-amy-publish': [
      {
        id: 'test-amy-publish-1',
        input: '你能先欢迎我，再带我认识火星基地吗？',
        output: '欢迎来到我的火星基地故事站。我们先从基地入口出发，再一起去认识宿舍、补给站和实验区，路上我会顺便讲几个有趣的小故事。',
        created_at: now('2026-04-02T10:36:00+08:00'),
      },
    ],
  }

  const posters: Record<string, SharePosterTemplate[]> = {
    'agent-amy-publish': createPosterSet(agents[11]),
    'agent-amy-museum': createPosterSet(agents[10]),
  }

  return {
    session_role: 'student',
    sessions: {
      coach: {
        role: 'coach',
        user_id: 'coach-lin',
        user_name: '林老师',
      },
      student: {
        role: 'student',
        user_id: 'student-amy',
        user_name: '小明',
      },
    },
    groups,
    tasks,
    agents,
    versions,
    tests,
    posters,
    appreciation: {
      'agent-amy-publish': 18,
      'agent-amy-museum': 34,
    },
  }
}

const getRoot = (): typeof globalThis & Record<string, unknown> => globalThis as typeof globalThis & Record<string, unknown>

const storeBridgeToken = (value: string) => {
  if (typeof window === 'undefined' || !value)
    return

  window.localStorage.setItem(BRIDGE_TOKEN_STORAGE_KEY, value)
}

const sanitizeBridgeTokenFromUrl = (token: string) => {
  if (typeof window === 'undefined' || !token)
    return

  const url = new URL(window.location.href)
  if (!url.searchParams.has(BRIDGE_TOKEN_QUERY_KEY))
    return

  url.searchParams.delete(BRIDGE_TOKEN_QUERY_KEY)
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`)
}

const readBridgeToken = () => {
  const queryToken = readStarshipBridgeToken()
  if (queryToken) {
    storeBridgeToken(queryToken)
    sanitizeBridgeTokenFromUrl(queryToken)
    return queryToken
  }

  return ''
}

export const isStarshipBridgeMode = () => isStarshipBridgeRequest()

const bridgeBootstrapPath = (bridgeToken: string) =>
  `${AG_API_BASE.replace(/\/$/, '')}/ag/starship/bootstrap?bridge_token=${encodeURIComponent(bridgeToken)}`

const bridgeMutationPath = (path: string, bridgeToken: string) =>
  `${AG_API_BASE.replace(/\/$/, '')}${path}${path.includes('?') ? '&' : '?'}bridge_token=${encodeURIComponent(bridgeToken)}`

const fetchBridgeBootstrap = async (bridgeToken: string): Promise<MockDb> => {
  const response = await fetch(`${bridgeBootstrapPath(bridgeToken)}&_=${Date.now()}`, {
    cache: 'no-store',
  })
  const payload = await response.json().catch(() => ({})) as StarshipApiResponse<MockDb>
  if (!response.ok || !payload.success || !payload.data)
    throw new Error(payload.message || '无法载入 AG 星舰空间')
  return payload.data
}

const bridgeRequest = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const bridgeToken = readBridgeToken()
  if (!bridgeToken)
    throw new Error('进入班级的凭证缺失，请回到个人中心重新进入。')

  const response = await fetch(bridgeMutationPath(path, bridgeToken), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })
  const payload = await response.json().catch(() => ({})) as StarshipApiResponse<T>
  if (!response.ok || !payload.success)
    throw new Error(payload.message || '星舰操作失败，请稍后再试')
  return payload.data as T
}

const setLoadedDb = (db: MockDb, mode: 'mock' | 'bridge', bridgeToken = '') => {
  const root = getRoot()
  root[ROOT_KEY] = db
  root[ROOT_MODE_KEY] = mode
  root[ROOT_BRIDGE_TOKEN_KEY] = bridgeToken
}

const loadBridgeDb = async (bridgeToken: string, force = false): Promise<MockDb> => {
  const root = getRoot()
  if (
    !force
    && root[ROOT_MODE_KEY] === 'bridge'
    && root[ROOT_BRIDGE_TOKEN_KEY] === bridgeToken
    && root[ROOT_KEY]
  ) {
    return root[ROOT_KEY] as MockDb
  }

  const bridgeDb = await fetchBridgeBootstrap(bridgeToken)
  setLoadedDb(bridgeDb, 'bridge', bridgeToken)
  return bridgeDb
}

const ensureDbReady = async (): Promise<MockDb> => {
  const bridgeToken = readBridgeToken()

  if (bridgeToken)
    return loadBridgeDb(bridgeToken)

  const root = getRoot()
  if (!root[ROOT_KEY] || root[ROOT_MODE_KEY] !== 'mock') {
    setLoadedDb(createInitialDb(), 'mock')
  }

  return root[ROOT_KEY] as MockDb
}

const refreshBridgeDb = async (): Promise<MockDb> => {
  const bridgeToken = readBridgeToken()
  if (!bridgeToken)
    return ensureDbReady()

  return loadBridgeDb(bridgeToken, true)
}

const ensureFreshDb = async (): Promise<MockDb> => {
  if (isStarshipBridgeMode())
    return refreshBridgeDb()
  return ensureDbReady()
}

const getDb = (): MockDb => {
  const root = getRoot()
  if (!root[ROOT_KEY])
    setLoadedDb(createInitialDb(), 'mock')

  const db = root[ROOT_KEY] as MockDb

  if (typeof window !== 'undefined' && root[ROOT_MODE_KEY] === 'mock') {
    const storedRole = window.localStorage.getItem(MOCK_ROLE_STORAGE_KEY)
    if (storedRole === 'coach' || storedRole === 'student')
      db.session_role = storedRole
  }

  return db
}

const currentSession = () => {
  const db = getDb()
  return db.sessions[db.session_role]
}

const findAgent = (appId: string) => {
  const agent = getDb().agents.find(item => item.id === appId)
  if (!agent)
    throw new Error('Agent not found in mock data')
  return agent
}

const findGroup = (groupId: string | null | undefined) =>
  groupId ? getDb().groups.find(group => group.id === groupId) || null : null

const findTaskByGroup = (groupId: string | null | undefined) =>
  groupId ? getDb().tasks.find(task => task.group_id === groupId && task.status === 'active') || null : null

const findTaskForGroup = (groupId: string | null | undefined) =>
  groupId ? getDb().tasks.find(task => task.group_id === groupId) || null : null

const getSharePosters = (appId: string): SharePosterTemplate[] =>
  clone(getDb().posters[appId] || [])

const ensureSharePosters = (appId: string): SharePosterTemplate[] => {
  const db = getDb()
  if (!db.posters[appId])
    db.posters[appId] = createPosterSet(findAgent(appId))
  return clone(db.posters[appId])
}

const findStudentPublishAgent = (ownerId: string, groupId: string | null | undefined, sourceMainAgentId: string | null | undefined) => {
  return getDb().agents.find(agent =>
    agent.owner_id === ownerId
    && agent.owner_role === 'student'
    && agent.project_kind === 'publish'
    && agent.group_id === (groupId || null)
    && agent.source_main_agent_id === (sourceMainAgentId || null),
  ) || null
}

const toPublicAgent = (agent: InternalAgent): StarshipAgent => clone(agent)

const buildPublicAgentPayload = (agent: InternalAgent, isPreview: boolean): PublicStarshipAgent => {
  const appreciationSet = getAppreciationSet()

  return {
    agent: toPublicAgent(agent),
    share_intro: agent.share_intro || agent.description,
    opening_line: getOpeningLine(agent),
    is_preview: isPreview,
    is_share_ready: agent.is_public,
    share_posters: agent.project_kind === 'publish' ? ensureSharePosters(agent.id) : getSharePosters(agent.id),
    applause_count: getDb().appreciation[agent.id] || 0,
    applauded_by_current_device: appreciationSet.has(agent.id),
  }
}

const getLatestVersionForAgent = (appId: string) =>
  getDb().versions.filter(version => version.app_id === appId).sort((a, b) => b.version_number - a.version_number)[0] || null

const createDraftSnapshot = (appId: string) => {
  const db = getDb()
  const agent = findAgent(appId)
  const latestVersion = getLatestVersionForAgent(appId)
  const nextConfig = buildAgentConfig(agent)

  if (latestVersion && JSON.stringify(latestVersion.agent_config) === JSON.stringify(nextConfig))
    return null

  const appVersions = db.versions.filter(version => version.app_id === appId)
  const nextVersionNumber = (Math.max(0, ...appVersions.map(version => version.version_number)) || 0) + 1

  const version: InternalVersion = {
    id: makeId('version'),
    app_id: appId,
    version_number: nextVersionNumber,
    status: 'draft',
    submitted_by_name: null,
    submitted_at: null,
    reviewed_by_name: null,
    reviewed_at: null,
    review_comment: null,
    agent_config: nextConfig,
  }

  db.versions.unshift(version)
  return version
}

// ---- Demo session ----

export const fetchStarshipSession = async (): Promise<StarshipSession> =>
  withDelay((await ensureFreshDb(), currentSession()))

export const setStarshipMockRole = async (role: StarshipRole): Promise<{ role: StarshipRole }> => {
  await ensureDbReady()
  if (isStarshipBridgeMode())
    return withDelay({ role: currentSession().role }, 50)

  const db = getDb()
  db.session_role = role
  if (typeof window !== 'undefined')
    window.localStorage.setItem(MOCK_ROLE_STORAGE_KEY, role)
  return withDelay({ role }, 50)
}

// ---- Member APIs ----

export const fetchStarshipMembers = async (): Promise<{ items: StarshipMember[] }> =>
  withDelay((await ensureDbReady(), {
    items: [
      {
        id: 'member-coach-lin',
        account_id: 'coach-lin',
        name: '林老师',
        email: 'coach@example.com',
        role: 'coach',
      },
      {
        id: 'member-student-amy',
        account_id: 'student-amy',
        name: '小明',
        email: 'amy@example.com',
        role: 'student',
      },
    ],
  }))

export const assignStarshipMember = async (_account_id: string, _role: StarshipRole) =>
  withDelay((await ensureDbReady(), { result: 'ok' }))

// ---- Student APIs ----

export const fetchStudentDashboard = async (): Promise<StudentDashboard> => {
  await ensureFreshDb()
  const db = getDb()
  const session = currentSession()
  const studentAgents = db.agents
    .filter(agent => agent.owner_id === session.user_id)
    .sort((a, b) => (b.updated_at || b.created_at) - (a.updated_at || a.created_at))
  const currentProjects = studentAgents.filter((agent) => {
    if (agent.project_kind !== 'classroom')
      return false
    const task = findTaskByGroup(agent.group_id)
    return Boolean(task && !task.main_published)
  }).slice(0, 1)
  const publishAgents = studentAgents.filter(agent => agent.project_kind === 'publish')
  const historyAgents = studentAgents.filter((agent) => {
    if (agent.project_kind === 'history')
      return true
    if (agent.project_kind === 'classroom') {
      const task = findTaskForGroup(agent.group_id)
      return Boolean(task?.main_published)
    }
    return false
  })

  const currentTask = currentProjects[0] ? findTaskByGroup(currentProjects[0].group_id) : null
  const currentGroup = findGroup(currentTask?.group_id) || null
  const mainAgent = currentTask?.main_agent_id ? toPublicAgent(findAgent(currentTask.main_agent_id)) : null

  return withDelay({
    session,
    current_task: currentTask,
    current_group: currentGroup,
    main_agent: mainAgent,
    current_projects: currentProjects.map(toPublicAgent),
    publish_agents: publishAgents.map(toPublicAgent),
    history_agents: historyAgents.map(toPublicAgent),
    draft_agents: studentAgents.map(toPublicAgent),
    published_agents: studentAgents.filter(agent => agent.is_public).map(toPublicAgent),
  })
}

// ---- Agent APIs ----

export const fetchMyAgents = async (): Promise<{ items: StarshipAgent[] }> => {
  await ensureFreshDb()
  const session = currentSession()
  return withDelay({
    items: getDb().agents.filter(agent => agent.owner_id === session.user_id).sort((a, b) => (b.updated_at || b.created_at) - (a.updated_at || a.created_at)).map(toPublicAgent),
  })
}

export const createStarshipAgent = async (data: {
  name: string
  description: string
  icon: string
  icon_background: string
  pre_prompt: string
  group_id?: string
}): Promise<{ id: string, name: string }> => {
  await ensureDbReady()
  if (isStarshipBridgeMode()) {
    const session = currentSession()
    if (session.role !== 'coach' || !data.group_id)
      throw new Error('请先进入班级，再由教练创建任务。')

    const result = await bridgeRequest<{ coach_agent_id: string, task_id: string }>(
      `/ag/starship/groups/${encodeURIComponent(data.group_id)}/task`,
      {
        method: 'POST',
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          teacher_note: data.description,
          pre_prompt: data.pre_prompt,
          knowledge_items: [],
        }),
      },
    )
    await refreshBridgeDb()
    return withDelay({ id: result.coach_agent_id, name: data.name })
  }

  const db = getDb()
  const session = currentSession()
  const fallbackGroupId = session.role === 'coach'
    ? (data.group_id || db.groups[0]?.id || null)
    : (db.agents.find(agent => agent.owner_id === session.user_id)?.group_id || db.groups[0]?.id || null)

  const group = findGroup(fallbackGroupId)
  const task = findTaskByGroup(group?.id)
  const agent: InternalAgent = {
    id: makeId('agent'),
    name: data.name,
    description: data.description,
    icon: data.icon,
    icon_background: data.icon_background,
    is_public: false,
    created_at: Math.floor(Date.now() / 1000),
    updated_at: Math.floor(Date.now() / 1000),
    site_code: null,
    creator_name: session.user_name,
    group_id: group?.id || null,
    group_name: group?.name || null,
    task_title: task?.title || null,
    owner_role: session.role,
    owner_id: session.user_id,
    pre_prompt: data.pre_prompt,
    share_author_name: session.user_name,
    share_intro: data.description,
    tool_settings: clone(DEFAULT_ENABLED_TOOLS),
    knowledge_items: [],
    project_kind: session.role === 'coach' ? 'coach' : 'classroom',
    source_main_agent_id: task?.main_agent_id || null,
  }

  db.agents.unshift(agent)
  db.versions.unshift({
    id: makeId('version'),
    app_id: agent.id,
    version_number: 1,
    status: 'draft',
    submitted_by_name: null,
    submitted_at: null,
    reviewed_by_name: null,
    reviewed_at: null,
    review_comment: null,
    agent_config: buildAgentConfig(agent),
  })

  return withDelay({ id: agent.id, name: agent.name })
}

export const fetchAgentVersions = async (appId: string): Promise<{ items: AgentVersion[] }> =>
  withDelay((await ensureDbReady(), {
    items: getDb().versions.filter(version => version.app_id === appId).sort((a, b) => b.version_number - a.version_number),
  }))

export const submitAgentVersion = async (appId: string): Promise<{ id: string, version_number: number }> => {
  await ensureDbReady()
  const db = getDb()
  const agent = findAgent(appId)
  const session = currentSession()
  const appVersions = db.versions.filter(version => version.app_id === appId)
  const nextVersionNumber = (Math.max(0, ...appVersions.map(version => version.version_number)) || 0) + 1
  const version: InternalVersion = {
    id: makeId('version'),
    app_id: appId,
    version_number: nextVersionNumber,
    status: 'submitted',
    submitted_by_name: session.user_name,
    submitted_at: Math.floor(Date.now() / 1000),
    reviewed_by_name: null,
    reviewed_at: null,
    review_comment: null,
    agent_config: buildAgentConfig(agent),
  }
  agent.updated_at = Math.floor(Date.now() / 1000)
  db.versions.unshift(version)
  return withDelay({ id: version.id, version_number: version.version_number })
}

// ---- Coach APIs ----

export const fetchPendingVersions = async (): Promise<{ items: PendingVersion[] }> => {
  await ensureFreshDb()
  if (isStarshipBridgeMode())
    return withDelay({ items: [] })
  const db = getDb()
  const session = currentSession()
  const visibleGroupIds = new Set(
    (session.role === 'coach'
      ? db.groups
      : db.groups.filter((group) => {
          return db.agents.some(agent => agent.owner_id === session.user_id && agent.group_id === group.id)
        }))
      .map(group => group.id),
  )

  return withDelay({
    items: db.versions
      .filter(version => version.status === 'submitted')
      .map((version) => {
        const agent = db.agents.find(item => item.id === version.app_id)
        if (!agent || !agent.group_id || !visibleGroupIds.has(agent.group_id))
          return null
        return {
          id: version.id,
          app_id: version.app_id,
          app_name: agent.name,
          version_number: version.version_number,
          submitted_by_name: version.submitted_by_name,
          submitted_at: version.submitted_at,
          agent_config: version.agent_config,
        }
      })
      .filter(Boolean) as PendingVersion[],
  })
}

export const reviewVersion = async (versionId: string, action: 'approve' | 'reject', comment = '') => {
  await ensureDbReady()
  const db = getDb()
  const version = db.versions.find(item => item.id === versionId)
  if (!version)
    throw new Error('Version not found in mock data')
  version.status = action === 'approve' ? 'approved' : 'rejected'
  version.review_comment = comment || (action === 'approve' ? '教练已通过这个版本。' : '教练建议你继续修改后再提交。')
  version.reviewed_by_name = currentSession().user_name
  version.reviewed_at = Math.floor(Date.now() / 1000)
  return withDelay({ result: 'ok' })
}

// ---- Square ----

export const fetchSquare = async (params: {
  page?: number
  limit?: number
  search?: string
}): Promise<{ items: StarshipAgent[], total: number, page: number, limit: number }> => {
  await ensureFreshDb()
  const search = params.search?.trim().toLowerCase() || ''
  const limit = params.limit || 20
  const page = params.page || 1
  const filtered = getDb().agents.filter((agent) => {
    if (!agent.is_public)
      return false
    if (!search)
      return true
    return `${agent.name} ${agent.description}`.toLowerCase().includes(search)
  })

  return withDelay({
    items: filtered.slice((page - 1) * limit, page * limit).map(toPublicAgent),
    total: filtered.length,
    page,
    limit,
  })
}

// ---- Groups ----

const fetchMyGroupsSync = (): { items: StarshipGroup[] } => {
  const db = getDb()
  const session = currentSession()

  if (session.role === 'coach')
    return { items: db.groups }

  const myGroupIds = new Set(
    db.agents
      .filter(agent => agent.owner_id === session.user_id && agent.group_id)
      .map(agent => agent.group_id!),
  )

  return {
    items: db.groups.filter(group => myGroupIds.has(group.id)),
  }
}

export const fetchMyGroups = async (): Promise<{ items: StarshipGroup[] }> =>
  withDelay((await ensureFreshDb(), {
    items: fetchMyGroupsSync().items.sort((a, b) => {
      const statusWeight = (value?: 'active' | 'history') => value === 'active' ? 1 : 0
      const statusDiff = statusWeight(b.status) - statusWeight(a.status)
      if (statusDiff !== 0)
        return statusDiff
      return (b.updated_at || b.created_at) - (a.updated_at || a.created_at)
    }),
  }))

export const createGroup = async (data: { name: string, description: string, member_ids: string[] }) => {
  await ensureDbReady()
  const group: StarshipGroup = {
    id: makeId('group'),
    name: data.name,
    description: data.description,
    created_at: Math.floor(Date.now() / 1000),
  }
  getDb().groups.push(group)
  return withDelay({ id: group.id, name: group.name })
}

export const fetchGroupAgents = async (groupId: string): Promise<{ items: StarshipAgent[] }> =>
  withDelay((await ensureFreshDb(), {
    items: getDb().agents.filter(agent => agent.group_id === groupId).sort((a, b) => (b.updated_at || b.created_at) - (a.updated_at || a.created_at)).map(toPublicAgent),
  }))

export const upsertStarshipTaskForGroup = async (groupId: string, payload: {
  name: string
  description: string
  teacher_note: string
  pre_prompt: string
  knowledge_items: KnowledgeItem[]
}) => {
  await ensureDbReady()
  if (isStarshipBridgeMode()) {
    const result = await bridgeRequest<{ coach_agent_id: string, task_id: string }>(
      `/ag/starship/groups/${encodeURIComponent(groupId)}/task`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    )
    await refreshBridgeDb()
    return withDelay(result)
  }

  throw new Error('当前环境不支持班级任务管理')
}

export const deleteStarshipTask = async (taskId: string) => {
  await ensureDbReady()
  if (isStarshipBridgeMode()) {
    const result = await bridgeRequest<{ task_id: string }>(
      `/ag/starship/tasks/${encodeURIComponent(taskId)}`,
      { method: 'DELETE' },
    )
    await refreshBridgeDb()
    return withDelay(result)
  }

  throw new Error('当前环境不支持删除班级任务')
}

export const publishStarshipTaskToStudents = async (taskId: string) => {
  await ensureDbReady()
  if (isStarshipBridgeMode()) {
    const result = await bridgeRequest<{ task_id: string }>(
      `/ag/starship/tasks/${encodeURIComponent(taskId)}/publish`,
      { method: 'POST' },
    )
    await refreshBridgeDb()
    return withDelay(result)
  }

  throw new Error('当前环境不支持发布班级任务')
}

export const publishStarshipTaskMain = async (taskId: string) => {
  await ensureDbReady()
  if (isStarshipBridgeMode()) {
    const result = await bridgeRequest<{ task_id: string }>(
      `/ag/starship/tasks/${encodeURIComponent(taskId)}/main-publish`,
      { method: 'POST' },
    )
    await refreshBridgeDb()
    return withDelay(result)
  }

  throw new Error('当前环境不支持发布主版本')
}

const duplicateAgent = (source: InternalAgent, role: StarshipRole, ownerId: string, ownerName: string, groupId?: string | null) => {
  const nextGroupId = groupId ?? source.group_id ?? null
  const nextTask = findTaskForGroup(nextGroupId)
  const copied: InternalAgent = {
    ...clone(source),
    id: makeId('agent'),
    name: `${source.name}（我的版本）`,
    creator_name: ownerName,
    owner_id: ownerId,
    owner_role: role,
    is_public: false,
    site_code: role === 'student' ? `${makeId('share')}` : null,
    created_at: Math.floor(Date.now() / 1000),
    updated_at: Math.floor(Date.now() / 1000),
    group_id: nextGroupId,
    group_name: findGroup(nextGroupId)?.name || source.group_name || null,
    task_title: nextTask?.title || source.task_title || null,
    share_author_name: ownerName,
    project_kind: role === 'coach'
      ? 'coach'
      : (source.owner_role === 'coach' ? 'publish' : (source.project_kind || 'history')),
    source_main_agent_id: source.owner_role === 'coach'
      ? source.id
      : (source.source_main_agent_id || null),
    source_agent_id: source.id,
  }

  getDb().agents.unshift(copied)
  if (copied.project_kind === 'publish')
    getDb().posters[copied.id] = createPosterSet(copied)
  getDb().versions.unshift({
    id: makeId('version'),
    app_id: copied.id,
    version_number: 1,
    status: 'draft',
    submitted_by_name: null,
    submitted_at: null,
    reviewed_by_name: null,
    reviewed_at: null,
    review_comment: null,
    agent_config: buildAgentConfig(copied),
  })
  return copied
}

export const forkGroupAgent = async (groupId: string, appId: string): Promise<{ id: string, name: string }> => {
  await ensureDbReady()
  if (isStarshipBridgeMode()) {
    const result = await bridgeRequest<{ id: string, name: string }>(
      `/ag/starship/workspace/${encodeURIComponent(appId)}/fork`,
      { method: 'POST' },
    )
    await refreshBridgeDb()
    return withDelay(result)
  }

  const source = findAgent(appId)
  const session = currentSession()
  const copied = duplicateAgent(source, session.role, session.user_id, session.user_name, groupId)
  return withDelay({ id: copied.id, name: copied.name })
}

// ---- Fork personal agent (from square) ----

export const forkAgent = async (appId: string): Promise<{ id: string, name: string }> => {
  await ensureDbReady()
  if (isStarshipBridgeMode()) {
    const result = await bridgeRequest<{ id: string, name: string }>(
      `/ag/starship/workspace/${encodeURIComponent(appId)}/fork`,
      { method: 'POST' },
    )
    await refreshBridgeDb()
    return withDelay(result)
  }

  const source = findAgent(appId)
  const session = currentSession()
  const copied = duplicateAgent(source, session.role, session.user_id, session.user_name)
  return withDelay({ id: copied.id, name: copied.name })
}

export const forkStarshipWorkspace = async (appId: string): Promise<{ id: string, name: string }> =>
  forkAgent(appId)

// ---- Workspace ----

export const fetchStarshipWorkspace = async (appId: string): Promise<StarshipWorkspace> => {
  await ensureFreshDb()
  const agent = findAgent(appId)
  const session = currentSession()
  const task = findTaskForGroup(agent.group_id)
  const projectKind = agent.project_kind || (agent.owner_role === 'coach' ? 'coach' : 'history')
  const isHistoryProject = projectKind === 'history'
  const publishAgent = projectKind === 'classroom'
    ? findStudentPublishAgent(agent.owner_id, agent.group_id, agent.source_main_agent_id || task?.main_agent_id || null)
    : null
  const sourceMainAgent = agent.source_main_agent_id ? toPublicAgent(findAgent(agent.source_main_agent_id)) : null
  const studentCanShare = agent.owner_role === 'student' && (projectKind === 'publish' || projectKind === 'history')

  return withDelay({
    session,
    agent: toPublicAgent(agent),
    group: findGroup(agent.group_id),
    task,
    pre_prompt: agent.pre_prompt,
    share_enabled: agent.owner_role === 'coach' || studentCanShare,
    share_block_reason: agent.owner_role === 'coach' || studentCanShare
      ? null
      : (task?.main_published ? 'classroom-record-locked' : 'current-project-locked'),
    share_author_name: agent.share_author_name || session.user_name,
    share_intro: agent.share_intro || agent.description,
    opening_line: getOpeningLine(agent),
    test_history: getDb().tests[appId] || [],
    tool_settings: getToolSettings(agent),
    knowledge_items: getKnowledgeItems(agent),
    is_history_project: isHistoryProject,
    project_kind: projectKind,
    share_posters: projectKind === 'publish' ? ensureSharePosters(appId) : getSharePosters(appId),
    publish_agent: publishAgent ? toPublicAgent(publishAgent) : null,
    source_main_agent: sourceMainAgent,
  })
}

export const saveStarshipWorkspace = async (appId: string, payload: {
  name: string
  description: string
  pre_prompt: string
  share_author_name: string
  share_intro: string
  opening_line?: string
  tool_settings?: WorkspaceToolSettings
  knowledge_items?: KnowledgeItem[]
}) => {
  await ensureDbReady()
  if (isStarshipBridgeMode()) {
    const result = await bridgeRequest<{ result?: string }>(
      `/ag/starship/workspace/${encodeURIComponent(appId)}/save`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    )
    await refreshBridgeDb()
    return withDelay(result || { result: 'ok' })
  }

  const agent = findAgent(appId)
  agent.name = payload.name
  agent.description = payload.description
  agent.pre_prompt = payload.pre_prompt
  agent.share_author_name = payload.share_author_name
  agent.share_intro = payload.share_intro
  if (payload.opening_line !== undefined)
    agent.opening_line = payload.opening_line
  if (payload.tool_settings)
    agent.tool_settings = clone(payload.tool_settings)
  if (payload.knowledge_items)
    agent.knowledge_items = clone(payload.knowledge_items)
  agent.updated_at = Math.floor(Date.now() / 1000)
  return withDelay({ result: 'ok' })
}

export const runStarshipWorkspaceTest = async (
  appId: string,
  payload: {
    input: string
    draft?: {
      name: string
      description: string
      pre_prompt: string
      share_author_name: string
      share_intro: string
      opening_line?: string
      tool_settings: WorkspaceToolSettings
      knowledge_items: KnowledgeItem[]
    }
    persist_snapshot?: boolean
  },
): Promise<{ output: string, snapshot_created: boolean }> => {
  await ensureDbReady()
  if (isStarshipBridgeMode()) {
    const result = await bridgeRequest<{ output: string, snapshot_created: boolean }>(
      `/ag/starship/workspace/${encodeURIComponent(appId)}/test`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    )
    await refreshBridgeDb()
    return withDelay(result)
  }

  const agent = findAgent(appId)
  const db = getDb()
  if (payload.draft) {
    agent.name = payload.draft.name
    agent.description = payload.draft.description
    agent.pre_prompt = payload.draft.pre_prompt
    agent.share_author_name = payload.draft.share_author_name
    agent.share_intro = payload.draft.share_intro
    if (payload.draft.opening_line !== undefined)
      agent.opening_line = payload.draft.opening_line
    agent.tool_settings = clone(payload.draft.tool_settings)
    agent.knowledge_items = clone(payload.draft.knowledge_items)
  }
  const output = buildMockWorkspaceTestOutput(agent, payload.input)
  const record: WorkspaceTestRecord = {
    id: makeId('test'),
    input: payload.input,
    output,
    created_at: Math.floor(Date.now() / 1000),
  }
  db.tests[appId] = [record, ...(db.tests[appId] || [])]
  agent.updated_at = record.created_at
  const snapshot = payload.persist_snapshot ? createDraftSnapshot(appId) : null
  return withDelay({ output, snapshot_created: Boolean(snapshot) })
}

export const publishStarshipWorkspace = async (appId: string, payload: {
  share_author_name: string
  share_intro: string
  opening_line?: string
}) => {
  await ensureDbReady()
  if (isStarshipBridgeMode()) {
    const result = await bridgeRequest<{ result: string }>(
      `/ag/starship/workspace/${encodeURIComponent(appId)}/publish`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    )
    await refreshBridgeDb()
    return withDelay(result)
  }

  const agent = findAgent(appId)
  const canShare = agent.owner_role === 'coach' || agent.project_kind === 'publish' || agent.project_kind === 'history'

  if (!canShare)
    throw new Error('Current project cannot be published yet.')

  agent.share_author_name = payload.share_author_name
  agent.share_intro = payload.share_intro
  if (payload.opening_line !== undefined)
    agent.opening_line = payload.opening_line
  agent.is_public = true
  agent.site_code = agent.site_code || `${agent.id}-site`
  agent.updated_at = Math.floor(Date.now() / 1000)
  getDb().posters[appId] = createPosterSet(agent)
  return withDelay({ result: 'ok' })
}

export const fetchPublicStarshipAgent = async (appId: string): Promise<PublicStarshipAgent> => {
  await ensureDbReady()
  const agent = findAgent(appId)
  if (!agent.is_public)
    throw new Error('Public agent not found in mock data')

  return withDelay(buildPublicAgentPayload(agent, false))
}

export const runStarshipExperience = async (appId: string, input: string): Promise<{ output: string }> => {
  await ensureDbReady()
  const agent = findAgent(appId)
  const promptTone = agent.pre_prompt.split('。')[0] || agent.name

  return withDelay({
    output: `${agent.name}：${promptTone}。你刚刚说的是“${input}”。我会先顺着你的问题回答，再带你继续往下探索。`,
  })
}

export const fetchPreviewStarshipAgent = async (appId: string): Promise<PublicStarshipAgent> => {
  await ensureDbReady()
  const agent = findAgent(appId)
  const canPreview = agent.owner_role === 'coach' || agent.project_kind === 'publish' || agent.project_kind === 'history'
  if (!canPreview)
    throw new Error('Preview not available for this project in mock data')

  return withDelay(buildPublicAgentPayload(agent, true))
}

export const toggleStarshipAppreciation = async (appId: string): Promise<{ applause_count: number, applauded_by_current_device: boolean }> => {
  await ensureDbReady()
  const db = getDb()
  const appreciationSet = getAppreciationSet()
  const current = db.appreciation[appId] || 0

  if (appreciationSet.has(appId)) {
    appreciationSet.delete(appId)
    db.appreciation[appId] = Math.max(0, current - 1)
  }
  else {
    appreciationSet.add(appId)
    db.appreciation[appId] = current + 1
  }

  persistAppreciationSet(appreciationSet)

  return withDelay({
    applause_count: db.appreciation[appId],
    applauded_by_current_device: appreciationSet.has(appId),
  })
}
