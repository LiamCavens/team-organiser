<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import ThemeSelector from './components/ThemeSelector.vue'
import LoginModal from './components/auth/LoginModal.vue'
import { useTheme } from './composables/useTheme'
import { useAuth } from './composables/useAuth'
import './utils/authTest' // Import auth testing utilities

interface User {
  id: number
  username: string
  role: string
  email?: string
}

// Initialize theme
useTheme()

// Authentication state using the composable
const { user, setAuth, clearAuth, debugAuth } = useAuth()
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
</script>

<template>
  <div id="app">
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
