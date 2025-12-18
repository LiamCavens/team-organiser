<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import ThemeSelector from './components/ThemeSelector.vue'
import LoginModal from './components/auth/LoginModal.vue'
import { useTheme } from './composables/useTheme'
import { useAuth } from './composables/useAuth'
// Dev-only auth testing utilities (off by default)
// To enable, run in the browser console: localStorage.setItem('ENABLE_AUTH_TESTS','true'); location.reload()
if (import.meta.env.DEV && localStorage.getItem('ENABLE_AUTH_TESTS') === 'true') {
  import('./utils/authTest')
}

interface User {
  id: number
  username: string
  role: string
  email?: string
}

// Initialize theme
useTheme()

// Authentication state using the composable
const { user, setAuth, clearAuth, debugAuth, isDemoMode, enterDemoMode } = useAuth()
const showLoginModal = ref(false)

// Check for existing authentication on app start
// This is now handled automatically by the useAuth composable

const handleLoginSuccess = (data: { token: string; user: User }) => {
  setAuth(data)
  showLoginModal.value = false

  // Debug authentication
  console.log('🎉 User logged in successfully')
  debugAuth()
}

const handleLogout = () => {
  clearAuth()
  console.log('👋 User logged out')
}

const onOpenLogin = () => {
  showLoginModal.value = true
}

const onEnterDemo = () => {
  enterDemoMode()
}

const exitDemo = () => {
  clearAuth()
}

const signInFromBanner = () => {
  // Leaving demo mode when user explicitly wants to sign in keeps things intuitive.
  clearAuth()
  showLoginModal.value = true
}

onMounted(() => {
  window.addEventListener('app:open-login', onOpenLogin)
  window.addEventListener('app:enter-demo', onEnterDemo)
})

onBeforeUnmount(() => {
  window.removeEventListener('app:open-login', onOpenLogin)
  window.removeEventListener('app:enter-demo', onEnterDemo)
})
</script>

<template>
  <div id="app">
    <div v-if="isDemoMode" class="demo-banner" role="status" aria-live="polite">
      <div class="demo-banner__content">
        <div class="demo-banner__text">
          <strong>Demo mode</strong>
          <span class="demo-banner__subtext">Local-only • read-only • no account needed</span>
        </div>

        <div class="demo-banner__actions">
          <button type="button" class="demo-banner__btn" @click="signInFromBanner">Sign In</button>
          <button type="button" class="demo-banner__btn demo-banner__btn--danger" @click="exitDemo">
            Exit demo
          </button>
        </div>
      </div>
    </div>

    <header class="header">
      <div class="header__content">
        <h1 class="header__title">Football Organiser</h1>
        <div class="header__actions">
          <div class="auth-section">
            <div v-if="user" class="user-info">
              <span class="user-welcome">Welcome, {{ user.username }}!</span>
              <button @click="handleLogout" class="logout-btn">Logout</button>
            </div>
            <button v-else @click="showLoginModal = true" class="login-btn">Sign In</button>
          </div>
          <ThemeSelector />
          <nav class="nav">
            <RouterLink to="/" class="nav__link">Teams</RouterLink>
            <RouterLink to="/players" class="nav__link">Players</RouterLink>
            <RouterLink to="/pairing" class="nav__link">Team Pairing</RouterLink>
          </nav>
        </div>
      </div>
    </header>

    <main class="main">
      <RouterView />
    </main>

    <!-- Login Modal -->
    <LoginModal v-model="showLoginModal" @login-success="handleLoginSuccess" />
  </div>
</template>

<style scoped>
.demo-banner {
  background: color-mix(in srgb, var(--accent-primary) 18%, transparent);
  border-bottom: 1px solid var(--border-primary);
}

.demo-banner__content {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-sm) var(--space-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
}

.demo-banner__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  color: var(--text-primary);
}

.demo-banner__subtext {
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.demo-banner__actions {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
}

.demo-banner__btn {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
  padding: 6px 10px;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.demo-banner__btn:hover {
  background: var(--bg-secondary);
  transform: translateY(-1px);
}

.demo-banner__btn--danger {
  border-color: color-mix(in srgb, #e11d48 40%, var(--border-primary));
}

.demo-banner__btn--danger:hover {
  background: color-mix(in srgb, #e11d48 12%, var(--bg-secondary));
}

.header {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-primary);
  padding: var(--space-md) 0;
  margin-bottom: var(--space-xl);
}

.header__content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-md);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-md);
}

.header__title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.header__actions {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.auth-section {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.user-welcome {
  color: var(--text-primary);
  font-weight: 500;
  font-size: 0.9rem;
}

.login-btn,
.logout-btn {
  background: var(--accent-primary);
  color: white;
  border: none;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: 0.9rem;
}

.login-btn:hover,
.logout-btn:hover {
  background: var(--accent-primary-dark);
  transform: translateY(-1px);
}

.logout-btn {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
}

.logout-btn:hover {
  background: var(--bg-secondary);
  transform: translateY(-1px);
}

.nav {
  display: flex;
  gap: var(--space-md);
}

.nav__link {
  color: var(--text-secondary);
  text-decoration: none;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  font-weight: 500;
}

.nav__link:hover {
  color: var(--text-primary);
  background: var(--bg-tertiary);
}

.nav__link.router-link-active {
  color: var(--accent-primary);
  background: var(--accent-primary-light);
}

.main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-md);
  min-height: calc(100vh - 200px);
}

@media (max-width: 768px) {
  .header__content {
    flex-direction: column;
    align-items: stretch;
  }

  .header__actions {
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .auth-section {
    order: -1;
    justify-content: center;
    margin-bottom: var(--space-sm);
  }

  .user-info {
    flex-direction: column;
    text-align: center;
    gap: var(--space-xs);
  }

  .nav {
    justify-content: center;
  }
}
</style>
