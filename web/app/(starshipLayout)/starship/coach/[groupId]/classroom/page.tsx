import CoachGroupClassroom from '@/app/components/starship/coach-group-classroom'

type CoachGroupClassroomPageProps = {
  params: Promise<{
    groupId: string
  }>
}

const CoachGroupClassroomPage = async ({ params }: CoachGroupClassroomPageProps) => {
  const { groupId } = await params

  return <CoachGroupClassroom groupId={groupId} />
}

export default CoachGroupClassroomPage
