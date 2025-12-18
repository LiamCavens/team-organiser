import { ref, computed, watch, readonly } from 'vue'
import { apolloClient } from '../apollo'

interface User {
  id: number
  username: string
  role: string
  email?: string
}

// Global authentication state
const user = ref<User | null>(null)
const token = ref<string | null>(null)
const isDemoMode = ref(false)
const isAuthenticated = computed(() => (isDemoMode.value ? true : !!user.value && !!token.value))

// Initialize from localStorage
const initAuth = () => {
  // Demo mode is a special local-only session that should not call the API.
  isDemoMode.value = localStorage.getItem('demoMode') === 'true'

  const storedToken = localStorage.getItem('token')
  const storedUser = localStorage.getItem('user')

  if (storedToken && storedUser) {
    try {
      token.value = storedToken
      user.value = JSON.parse(storedUser)
    } catch (error) {
      console.error('Error parsing stored auth data:', error)
      clearAuth()
    }
  }
}

// Clear authentication
const clearAuth = () => {
  isDemoMode.value = false
  localStorage.removeItem('demoMode')

  user.value = null
  token.value = null
  localStorage.removeItem('token')
  localStorage.removeItem('user')

  // Clear Apollo cache to remove any cached data that might be user-specific
  apolloClient.clearStore()
}

const enterDemoMode = () => {
  // Demo is a local-only session.
  // Ensure real auth is cleared first, then enable the reactive demo flag.
  user.value = { id: 0, username: 'Demo', role: 'USER', email: 'demo@local' }
  token.value = null
  localStorage.removeItem('token')
  localStorage.setItem('user', JSON.stringify(user.value))

  isDemoMode.value = true
  localStorage.setItem('demoMode', 'true')

  // Clear Apollo cache so views recompute from demo store immediately.
  apolloClient.clearStore()
}

// Set authentication
const setAuth = (authData: { token: string; user: User }) => {
  // Any real login turns off demo mode.
  isDemoMode.value = false
  localStorage.removeItem('demoMode')

  // Don't store/keep empty tokens.
  const normalizedToken = authData.token?.trim() || null
  token.value = normalizedToken
  user.value = authData.user
  if (normalizedToken) localStorage.setItem('token', normalizedToken)
  else localStorage.removeItem('token')
  localStorage.setItem('user', JSON.stringify(authData.user))
}

// Watch for auth changes and log them for debugging
watch(
  [user, token],
  ([newUser, newToken]) => {
    console.log('🔐 Auth state changed:', {
      user: newUser,
      token: newToken ? `${newToken.substring(0, 20)}...` : null,
      isAuthenticated: isAuthenticated.value,
    })
  },
  { immediate: true },
)

export function useAuth() {
  // Initialize on first use
  if (!user.value && !token.value) {
    initAuth()
  }

  return {
    user: readonly(user),
    token: readonly(token),
    isDemoMode: readonly(isDemoMode),
    isAuthenticated,
    setAuth,
    clearAuth,
    enterDemoMode,

    // Debugging utilities
    debugAuth: () => {
      console.log('🔍 Current auth state:', {
        user: user.value,
        token: token.value,
        isAuthenticated: isAuthenticated.value,
        localStorage: {
          token: localStorage.getItem('token'),
          user: localStorage.getItem('user'),
        },
      })
    },
  }
}

// Export for direct access if needed
export { user, token, isAuthenticated, setAuth, clearAuth, enterDemoMode }
