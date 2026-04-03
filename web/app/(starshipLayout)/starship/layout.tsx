import type { ReactNode } from 'react'
import StarshipShell from '@/app/components/starship/starship-shell'

const StarshipLayout = ({ children }: { children: ReactNode }) => {
  return <StarshipShell>{children}</StarshipShell>
}

export default StarshipLayout
