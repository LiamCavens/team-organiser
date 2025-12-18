import netlifyIdentity from 'netlify-identity-widget'

export type NetlifyUser = {
  token?: { access_token?: string }
  email?: string
  user_metadata?: { full_name?: string; name?: string }
}

type IdentityEvent = 'login' | 'logout'
type IdentityHandlerMap = {
  login: (user: NetlifyUser) => void
  logout: () => void
}

let initialized = false

export function initNetlifyIdentity() {
  if (initialized) return
  netlifyIdentity.init({
    // Netlify Identity reads / .netlify/identity endpoints from your deployed site.
    // In local dev, you can use Netlify CLI, but this app still works without it.
  })
  initialized = true
}

export function openNetlifyLogin() {
  initNetlifyIdentity()
  netlifyIdentity.open('login')
}

export function openNetlifySignup() {
  initNetlifyIdentity()
  netlifyIdentity.open('signup')
}

export function logoutNetlify() {
  initNetlifyIdentity()
  return netlifyIdentity.logout()
}

export function getNetlifyAccessToken(): string | null {
  initNetlifyIdentity()
  // netlify-identity-widget stores currentUser in-memory
  const currentUser = netlifyIdentity.currentUser() as unknown as NetlifyUser | null
  return currentUser?.token?.access_token ?? null
}

export function onNetlifyLogin(cb: (user: NetlifyUser) => void) {
  initNetlifyIdentity()
  ;(
    netlifyIdentity.on as unknown as <E extends IdentityEvent>(
      event: E,
      handler: IdentityHandlerMap[E],
    ) => void
  )('login', cb)
}

export function onNetlifyLogout(cb: () => void) {
  initNetlifyIdentity()
  ;(
    netlifyIdentity.on as unknown as <E extends IdentityEvent>(
      event: E,
      handler: IdentityHandlerMap[E],
    ) => void
  )('logout', cb)
}
