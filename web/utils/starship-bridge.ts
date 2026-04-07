'use client'

export const STARSHIP_ROUTE_PREFIX = '/starship'
export const BRIDGE_TOKEN_QUERY_KEY = 'bridge_token'
export const BRIDGE_TOKEN_STORAGE_KEY = 'ag-starship-bridge-token'

export const isStarshipPath = (pathname?: string | null) => {
  if (!pathname)
    return false
  return pathname === STARSHIP_ROUTE_PREFIX || pathname.startsWith(`${STARSHIP_ROUTE_PREFIX}/`)
}

export const readStarshipBridgeToken = () => {
  if (typeof window === 'undefined')
    return ''

  try {
    const url = new URL(window.location.href)
    const queryToken = url.searchParams.get(BRIDGE_TOKEN_QUERY_KEY) || ''
    if (queryToken)
      return queryToken
  }
  catch {
    return window.localStorage.getItem(BRIDGE_TOKEN_STORAGE_KEY) || ''
  }

  return window.localStorage.getItem(BRIDGE_TOKEN_STORAGE_KEY) || ''
}

export const persistStarshipBridgeToken = (token: string) => {
  if (typeof window === 'undefined' || !token)
    return

  window.localStorage.setItem(BRIDGE_TOKEN_STORAGE_KEY, token)
}

export const isStarshipBridgeRequest = (pathname?: string | null) => {
  const effectivePath = pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '')
  return isStarshipPath(effectivePath) && Boolean(readStarshipBridgeToken())
}
