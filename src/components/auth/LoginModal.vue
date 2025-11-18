<template>
  <BaseModal
    v-model="isOpen"
    title="Sign In"
    :close-on-backdrop="!isLoading"
    :persistent="isLoading"
  >
    <form @submit.prevent="handleSubmit" class="login-form">
      <!-- Username Field -->
      <div class="form-group">
        <label for="username" class="form-label">Username</label>
        <input
          id="username"
          v-model="formData.username"
          type="text"
          class="form-input"
          :class="{ 'form-input--error': errors.username }"
          placeholder="Enter your username"
          autocomplete="username"
          :disabled="isLoading"
          required
        />
        <span v-if="errors.username" class="form-error">{{ errors.username }}</span>
      </div>

      <!-- Password Field -->
      <div class="form-group">
        <label for="password" class="form-label">Password</label>
        <div class="password-input-container">
          <input
            id="password"
            v-model="formData.password"
            :type="showPassword ? 'text' : 'password'"
            class="form-input"
            :class="{ 'form-input--error': errors.password }"
            placeholder="Enter your password"
            autocomplete="current-password"
            :disabled="isLoading"
            required
          />
          <button
            type="button"
            class="password-toggle-button"
            @click="showPassword = !showPassword"
            :aria-label="showPassword ? 'Hide password' : 'Show password'"
            :disabled="isLoading"
          >
            <svg
              v-if="showPassword"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
              />
              <path d="M1 1l22 22" />
            </svg>
            <svg
              v-else
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
        <span v-if="errors.password" class="form-error">{{ errors.password }}</span>
      </div>

      <!-- Error Message -->
      <div v-if="loginError" class="form-group">
        <div class="alert alert--error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <span>{{ loginError }}</span>
        </div>
      </div>

      <!-- Success Message -->
      <div v-if="loginSuccess" class="form-group">
        <div class="alert alert--success">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="9,11 12,14 22,4" />
            <path d="m21,12.79a10,10 0 1,1 -2.79,-8.79" />
          </svg>
          <span>{{ loginSuccess }}</span>
        </div>
      </div>

      <!-- Demo Credentials Helper -->
      <div class="demo-credentials">
        <h4>Demo Accounts:</h4>
        <div class="demo-buttons">
          <button
            type="button"
            class="demo-button"
            @click="fillDemoCredentials('admin')"
            :disabled="isLoading"
          >
            Admin (admin / admin)
          </button>
          <button
            type="button"
            class="demo-button"
            @click="fillDemoCredentials('user')"
            :disabled="isLoading"
          >
            User (coach1 / password123)
          </button>
        </div>
      </div>
    </form>

    <template #footer>
      <button type="button" class="btn btn--secondary" @click="closeModal" :disabled="isLoading">
        Cancel
      </button>
      <button
        type="submit"
        class="btn btn--primary"
        :disabled="isLoading || !isFormValid"
        @click="handleSubmit"
      >
        <span v-if="isLoading" class="loading-spinner"></span>
        <span v-else>Sign In</span>
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import BaseModal from '../ui/BaseModal.vue'
import { useMutation } from '@vue/apollo-composable'
import { LOGIN_MUTATION } from '../../graphql/queries'

interface User {
  id: number
  username: string
  role: string
  email?: string
}

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'login-success', data: { token: string; user: User }): void
  (e: 'switch-to-register'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Form state
const formData = reactive({
  username: '',
  password: '',
})

const errors = reactive({
  username: '',
  password: '',
})

const isLoading = ref(false)
const showPassword = ref(false)
const loginError = ref('')
const loginSuccess = ref('')

// Computed
const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const isFormValid = computed(() => {
  return (
    formData.username.trim().length > 0 && formData.password.trim().length > 0 && !isLoading.value
  )
})

// Apollo mutation for real authentication
const { mutate: loginMutate } = useMutation(LOGIN_MUTATION)

// Methods
const validateForm = (): boolean => {
  let isValid = true

  // Clear previous errors
  errors.username = ''
  errors.password = ''

  // Validate username
  if (!formData.username.trim()) {
    errors.username = 'Username is required'
    isValid = false
  } else if (formData.username.trim().length < 2) {
    errors.username = 'Username must be at least 2 characters'
    isValid = false
  }

  // Validate password
  if (!formData.password.trim()) {
    errors.password = 'Password is required'
    isValid = false
  } else if (formData.password.trim().length < 3) {
    errors.password = 'Password must be at least 3 characters'
    isValid = false
  }

  return isValid
}

const handleSubmit = async () => {
  if (!validateForm()) return

  isLoading.value = true
  loginError.value = ''
  loginSuccess.value = ''

  try {
    // Use real GraphQL authentication
    const result = await loginMutate({
      input: {
        username: formData.username,
        password: formData.password,
      },
    })

    if (result?.data?.login) {
      const { token, user } = result.data.login

      // Store token and user in localStorage
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))

      loginSuccess.value = `Welcome back, ${user.username}!`

      // Emit success event with real data
      emit('login-success', { token, user })

      // Close modal after short delay
      setTimeout(() => {
        closeModal()
      }, 1000)
    } else {
      loginError.value = 'Authentication failed - no data received'
    }
  } catch (error: unknown) {
    console.error('Login error:', error)

    const apolloError = error as {
      message: string
      graphQLErrors?: { message: string }[]
      networkError?: unknown
    }

    // Handle different types of errors
    if (apolloError.graphQLErrors && apolloError.graphQLErrors.length > 0) {
      loginError.value = apolloError.graphQLErrors[0]?.message || 'GraphQL error occurred'
    } else if (apolloError.networkError) {
      loginError.value = 'Network error - please check your connection'
    } else {
      loginError.value = apolloError.message || 'Login failed - please try again'
    }
  } finally {
    isLoading.value = false
  }
}

const fillDemoCredentials = (type: 'admin' | 'user') => {
  if (type === 'admin') {
    formData.username = 'admin'
    formData.password = 'admin'
  } else {
    formData.username = 'coach1'
    formData.password = 'password123'
  }

  // Clear any previous errors
  errors.username = ''
  errors.password = ''
}

const closeModal = () => {
  // Reset form when closing
  formData.username = ''
  formData.password = ''
  errors.username = ''
  errors.password = ''
  loginError.value = ''
  loginSuccess.value = ''
  showPassword.value = false
  isLoading.value = false

  emit('update:modelValue', false)
}
</script>

<style scoped>
.login-form {
  min-width: 320px;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  color: var(--color-heading);
  font-weight: 500;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background-color: var(--color-background);
  color: var(--color-text);
  font-size: 1rem;
  transition: all 0.2s ease;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(var(--accent-rgb), 0.1);
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: var(--color-background-mute);
}

.form-input--error {
  border-color: #ef4444;
}

.form-input--error:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.password-input-container {
  position: relative;
}

.password-toggle-button {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
}

.password-toggle-button:hover {
  color: var(--color-text);
}

.password-toggle-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-error {
  display: block;
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.alert {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
}

.alert--error {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.alert--success {
  background-color: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.demo-credentials {
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: var(--color-background-mute);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.demo-credentials h4 {
  color: var(--color-heading);
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
}

.demo-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.demo-button {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text);
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.demo-button:hover {
  background-color: var(--color-background-soft);
  border-color: var(--color-accent);
}

.demo-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 44px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn--primary {
  background-color: var(--color-accent);
  color: white;
}

.btn--primary:hover:not(:disabled) {
  background-color: var(--color-accent-dark);
}

.btn--secondary {
  background-color: transparent;
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn--secondary:hover:not(:disabled) {
  background-color: var(--color-background-soft);
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Responsive Design */
@media (max-width: 480px) {
  .login-form {
    min-width: auto;
  }

  .demo-buttons {
    flex-direction: column;
  }

  .demo-button {
    text-align: center;
  }
}
</style>
