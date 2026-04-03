import StarshipWorkspace from '@/app/components/starship/starship-workspace'

type StarshipWorkspaceRouteProps = {
  params: Promise<{
    appId: string
  }>
}

const StarshipWorkspaceRoute = async ({ params }: StarshipWorkspaceRouteProps) => {
  const { appId } = await params

  return <StarshipWorkspace appId={appId} />
}

export default StarshipWorkspaceRoute
