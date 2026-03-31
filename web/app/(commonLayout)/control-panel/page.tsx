import WorkflowList from '@/app/components/control-panel/workflow-list'

const ControlPanelPage = () => {
  return (
    <div className="h-full overflow-y-auto px-6 py-8">
      <h1 className="mb-6 text-xl font-semibold text-text-primary">中控台 · 工作流总览</h1>
      <WorkflowList />
    </div>
  )
}

export default ControlPanelPage
