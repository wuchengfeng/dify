import StarshipExperience from '@/app/components/starship/starship-experience'

type StarshipExperiencePreviewRouteProps = {
  params: Promise<{
    appId: string
  }>
}

const StarshipExperiencePreviewRoute = async ({ params }: StarshipExperiencePreviewRouteProps) => {
  const { appId } = await params

  return <StarshipExperience appId={appId} mode="preview" />
}

export default StarshipExperiencePreviewRoute
