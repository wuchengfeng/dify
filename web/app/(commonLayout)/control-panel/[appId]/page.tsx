import Link from 'next/link'
import SnapshotTimeline from '@/app/components/control-panel/snapshot-timeline'

type Props = {
  params: Promise<{ appId: string }>
}

const ControlPanelDetailPage = async ({ params }: Props) => {
  const { appId } = await params

  return (
    <div className="h-full overflow-y-auto px-6 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/control-panel"
          className="text-sm text-text-tertiary hover:text-text-secondary"
        >
          ← 返回总览
        </Link>
        <span className="text-text-quaternary">/</span>
        <h1 className="text-xl font-semibold text-text-primary">编辑历史</h1>
      </div>
      <SnapshotTimeline appId={appId} />
    </div>
  )
}

export default ControlPanelDetailPage
