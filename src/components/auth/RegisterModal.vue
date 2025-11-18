<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal__header">
        <h3 class="modal__title">Create Account</h3>
        <button @click="$emit('close')" class="modal__close" aria-label="Close modal">✕</button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal__form">
        <!-- Username Field -->
        <div class="form-group">
          <label for="register-username" class="form-label">Username</label>
          <input
            id="register-username"
            v-model="formData.username"
            type="text"
            class="input"
            :class="{ 'input--error': errors.username }"
            placeholder="Enter your username"
            required
            autocomplete="username"
          />
          <div v-if="errors.username" class="form-error">{{ errors.username }}</div>
          <div class="form-hint">At least 3 characters, letters, numbers, _ and - only</div>
        </div>

        <!-- Email Field -->
        <div class="form-group">
          <label for="register-email" class="form-label">Email Address</label>
          <input
            id="register-email"
            v-model="formData.email"
            type="email"
            class="input"
            :class="{ 'input--error': errors.email }"
            placeholder="Enter your email"
            required
            autocomplete="email"
          />
          <div v-if="errors.email" class="form-error">{{ errors.email }}</div>
        </div>

        <!-- Confirm Email Field -->
        <div class="form-group">
          <label for="register-confirm-email" class="form-label">Confirm Email</label>
          <input
            id="register-confirm-email"
            v-model="formData.confirmEmail"
            type="email"
            class="input"
            :class="{ 'input--error': errors.confirmEmail }"
            placeholder="Re-enter your email"
            required
            autocomplete="email"
          />
          <div v-if="errors.confirmEmail" class="form-error">{{ errors.confirmEmail }}</div>
        </div>

        <!-- Password Field -->
        <div class="form-group">
          <label for="register-password" class="form-label">Password</label>
          <div class="password-input">
            <input
              id="register-password"
              v-model="formData.password"
              :type="showPassword ? 'text' : 'password'"
              class="input"
              :class="{ 'input--error': errors.password }"
              placeholder="Enter your password"
              required
              autocomplete="new-password"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="password-toggle"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
            >
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>
          <div v-if="errors.password" class="form-error">{{ errors.password }}</div>
          <div class="form-hint">At least 6 characters</div>
        </div>

        <!-- Error Message -->
        <div v-if="registerError" class="form-group">
          <div class="alert alert--error">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span>{{ registerError }}</span>
          </div>
        </div>

        <!-- Success Message -->
        <div v-if="registerSuccess" class="form-group">
          <div class="alert alert--success">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="9,11 12,14 22,4" />
              <path d="m21,12.79a10,10 0 1,1 -2.79,-8.79" />
            </svg>
            <span>{{ registerSuccess }}</span>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="modal__actions">
          <button type="button" @click="$emit('close')" class="btn" :disabled="isLoading">
            Cancel
          </button>
          <button type="submit" class="btn btn--primary" :disabled="!isFormValid || isLoading">
            {{ isLoading ? 'Creating Account...' : 'Create Account' }}
          </button>
        </div>

        <!-- Switch to Login -->
        <div class="form-footer">
          <p>
            Already have an account?
            <button type="button" @click="$emit('switch-to-login')" class="link-button">
              Sign in here
            </button>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useMutation } from '@vue/apollo-composable'
import { REGISTER_MUTATION } from '../../graphql/queries'

// Emits
const emit = defineEmits<{
  close: []
  'register-success': [
    data: { token: string; user: { id: number; username: string; email: string; role: string } },
  ]
  'switch-to-login': []
}>()

// Form state
const isLoading = ref(false)
const showPassword = ref(false)
const registerError = ref('')
const registerSuccess = ref('')

// Form data
const formData = reactive({
  username: '',
  email: '',
  confirmEmail: '',
  password: '',
})

// Form errors
const errors = reactive({
  username: '',
  email: '',
  confirmEmail: '',
  password: '',
})

// Apollo mutation
const { mutate: registerMutate } = useMutation(REGISTER_MUTATION)

// Computed properties
const isFormValid = computed(() => {
  return (
    formData.username.trim().length >= 3 &&
    formData.email.trim().length > 0 &&
    formData.confirmEmail.trim().length > 0 &&
    formData.password.length >= 6 &&
    !errors.username &&
    !errors.email &&
    !errors.confirmEmail &&
    !errors.password
  )
})

// Validation functions
const validateUsername = () => {
  errors.username = ''

  if (!formData.username.trim()) {
    errors.username = 'Username is required'
    return false
  }

  if (formData.username.length < 3) {
    errors.username = 'Username must be at least 3 characters'
    return false
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
    errors.username = 'Username can only contain letters, numbers, _ and -'
    return false
  }

  return true
}

const validateEmail = () => {
  errors.email = ''

  if (!formData.email.trim()) {
    errors.email = 'Email is required'
    return false
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(formData.email)) {
    errors.email = 'Please enter a valid email address'
    return false
  }

  return true
}

const validateConfirmEmail = () => {
  errors.confirmEmail = ''

  if (!formData.confirmEmail.trim()) {
    errors.confirmEmail = 'Please confirm your email'
    return false
  }

  if (formData.email !== formData.confirmEmail) {
    errors.confirmEmail = 'Email addresses do not match'
    return false
  }

  return true
}

const validatePassword = () => {
  errors.password = ''

  if (!formData.password) {
    errors.password = 'Password is required'
    return false
  }

  if (formData.password.length < 6) {
    errors.password = 'Password must be at least 6 characters'
    return false
  }

  return true
}

const validateForm = () => {
  const isUsernameValid = validateUsername()
  const isEmailValid = validateEmail()
  const isConfirmEmailValid = validateConfirmEmail()
  const isPasswordValid = validatePassword()

  return isUsernameValid && isEmailValid && isConfirmEmailValid && isPasswordValid
}

// Form submission
const handleSubmit = async () => {
  if (!validateForm()) return

  isLoading.value = true
  registerError.value = ''
  registerSuccess.value = ''

  try {
    const result = await registerMutate({
      input: {
        username: formData.username.trim(),
        email: formData.email.trim(),
        confirmEmail: formData.confirmEmail.trim(),
        password: formData.password,
      },
    })

    if (result?.data?.register) {
      const { token, user } = result.data.register

      registerSuccess.value = `Account created successfully! Welcome, ${user.username}!`

      // Emit success event
      setTimeout(() => {
        emit('register-success', { token, user })
      }, 1000)
    } else {
      registerError.value = 'Registration failed - no data received'
    }
  } catch (error) {
    const apolloError = error as {
      message: string
      graphQLErrors?: { message: string }[]
      networkError?: unknown
    }

    // Handle different types of errors
    if (apolloError.graphQLErrors && apolloError.graphQLErrors.length > 0) {
      registerError.value = apolloError.graphQLErrors[0]?.message || 'Registration failed'
    } else if (apolloError.networkError) {
      registerError.value = 'Network error - please check your connection'
    } else {
      registerError.value = apolloError.message || 'Registration failed - please try again'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-md);
}

.modal {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-lg);
  border-bottom: 1px solid var(--border-primary);
}

.modal__title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.modal__close {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.25rem;
  cursor: pointer;
  padding: var(--space-xs);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.modal__close:hover {
  color: var(--text-primary);
  background: var(--bg-tertiary);
}

.modal__form {
  padding: var(--space-lg);
}

.form-group {
  margin-bottom: var(--space-lg);
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

.input {
  width: 100%;
  padding: var(--space-md);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: all var(--transition-fast);
}

.input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
}

.input--error {
  border-color: var(--error);
}

.password-input {
  position: relative;
  display: flex;
  align-items: center;
}

.password-toggle {
  position: absolute;
  right: var(--space-sm);
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: var(--space-xs);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.password-toggle:hover {
  color: var(--text-primary);
  background: var(--bg-tertiary);
}

.form-error {
  color: var(--error);
  font-size: 0.875rem;
  margin-top: var(--space-xs);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.form-hint {
  color: var(--text-muted);
  font-size: 0.75rem;
  margin-top: var(--space-xs);
}

.alert {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
}

.alert--error {
  background: var(--error-bg);
  color: var(--error);
  border: 1px solid var(--error);
}

.alert--success {
  background: var(--success-bg);
  color: var(--success);
  border: 1px solid var(--success);
}

.modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-md);
  margin-top: var(--space-xl);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-footer {
  text-align: center;
  margin-top: var(--space-lg);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--border-primary);
}

.form-footer p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.link-button {
  background: none;
  border: none;
  color: var(--accent-primary);
  cursor: pointer;
  text-decoration: underline;
  font-size: inherit;
  padding: 0;
}

.link-button:hover {
  color: var(--accent-secondary);
}

@media (max-width: 768px) {
  .modal {
    margin: var(--space-md);
    max-height: calc(100vh - 2rem);
  }

  .modal__actions {
    flex-direction: column;
  }
}
</style>
