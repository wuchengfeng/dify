import CoachGroupClassroom from '@/app/components/starship/coach-group-classroom'

type CoachGroupPageProps = {
  params: Promise<{
    groupId: string
  }>
}

const CoachGroupPage = async ({ params }: CoachGroupPageProps) => {
  const { groupId } = await params

  return <CoachGroupClassroom groupId={groupId} />
}

export default CoachGroupPage
