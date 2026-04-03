import CoachGroupReviews from '@/app/components/starship/coach-group-reviews'

type CoachGroupReviewsPageProps = {
  params: Promise<{
    groupId: string
  }>
}

const CoachGroupReviewsPage = async ({ params }: CoachGroupReviewsPageProps) => {
  const { groupId } = await params

  return <CoachGroupReviews groupId={groupId} />
}

export default CoachGroupReviewsPage
