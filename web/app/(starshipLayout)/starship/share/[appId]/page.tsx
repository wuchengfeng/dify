import StarshipShareIntro from '@/app/components/starship/starship-share-intro'

type StarshipShareIntroRouteProps = {
  params: Promise<{
    appId: string
  }>
}

const StarshipShareIntroRoute = async ({ params }: StarshipShareIntroRouteProps) => {
  const { appId } = await params

  return <StarshipShareIntro appId={appId} />
}

export default StarshipShareIntroRoute
