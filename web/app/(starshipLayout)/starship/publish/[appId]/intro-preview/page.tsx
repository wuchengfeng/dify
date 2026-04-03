import StarshipShareIntro from '@/app/components/starship/starship-share-intro'

type StarshipShareIntroPreviewRouteProps = {
  params: Promise<{
    appId: string
  }>
}

const StarshipShareIntroPreviewRoute = async ({ params }: StarshipShareIntroPreviewRouteProps) => {
  const { appId } = await params

  return <StarshipShareIntro appId={appId} mode="preview" />
}

export default StarshipShareIntroPreviewRoute
