import CoachGroupWorkspace from '@/app/components/starship/coach-group-workspace'

type CoachGroupPageProps = {
  params: Promise<{
    groupId: string
  }>
}

const CoachGroupPage = async ({ params }: CoachGroupPageProps) => {
  const { groupId } = await params

  return <CoachGroupWorkspace groupId={groupId} />
}

export default CoachGroupPage
