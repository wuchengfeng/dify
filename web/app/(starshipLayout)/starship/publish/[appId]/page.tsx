import StarshipPublishCenter from '@/app/components/starship/starship-publish-center'

type StarshipPublishCenterRouteProps = {
  params: Promise<{
    appId: string
  }>
}

const StarshipPublishCenterRoute = async ({ params }: StarshipPublishCenterRouteProps) => {
  const { appId } = await params

  return <StarshipPublishCenter appId={appId} />
}

export default StarshipPublishCenterRoute
