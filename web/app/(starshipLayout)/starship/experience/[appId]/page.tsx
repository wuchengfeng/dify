import StarshipExperience from '@/app/components/starship/starship-experience'

type StarshipExperienceRouteProps = {
  params: Promise<{
    appId: string
  }>
}

const StarshipExperienceRoute = async ({ params }: StarshipExperienceRouteProps) => {
  const { appId } = await params

  return <StarshipExperience appId={appId} />
}

export default StarshipExperienceRoute
