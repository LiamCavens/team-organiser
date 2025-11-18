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
const isAuthenticated = computed(() => !!user.value && !!token.value)

// Initialize from localStorage
const initAuth = () => {
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
  user.value = null
  token.value = null
  localStorage.removeItem('token')
  localStorage.removeItem('user')

  // Clear Apollo cache to remove any cached data that might be user-specific
  apolloClient.clearStore()
}

// Set authentication
const setAuth = (authData: { token: string; user: User }) => {
  token.value = authData.token
  user.value = authData.user
  localStorage.setItem('token', authData.token)
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
    isAuthenticated,
    setAuth,
    clearAuth,

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
export { user, token, isAuthenticated, setAuth, clearAuth }
