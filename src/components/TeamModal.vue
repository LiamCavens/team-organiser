<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal__header">
        <h3 class="modal__title">
          {{ team ? 'Edit Team' : 'Create New Team' }}
        </h3>
        <button @click="$emit('close')" class="modal__close">✕</button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal__form">
        <div class="form-group">
          <label for="team-name" class="form-label">Team Name</label>
          <input
            id="team-name"
            v-model="formData.name"
            type="text"
            class="input"
            placeholder="Enter team name"
            required
            maxlength="50"
          />
          <div v-if="errors.name" class="form-error">{{ errors.name }}</div>
        </div>

        <div class="modal__actions">
          <button type="button" @click="$emit('close')" class="btn">
            Cancel
          </button>
          <button 
            type="submit" 
            class="btn btn--primary"
            :disabled="!isFormValid || isSubmitting"
          >
            {{ isSubmitting ? 'Saving...' : (team ? 'Update' : 'Create') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'

interface Team {
  id: number
  name: string
  players: Array<{
    id: number
    name: string
    rating: number
  }>
  createdAt: string
  updatedAt: string
}

const props = defineProps<{
  team?: Team | null
}>()

const emit = defineEmits<{
  close: []
  save: [data: { name: string }]
}>()

const isSubmitting = ref(false)

const formData = reactive({
  name: ''
})

const errors = reactive({
  name: ''
})

// Initialize form data when team prop changes
watch(() => props.team, (newTeam) => {
  if (newTeam) {
    formData.name = newTeam.name
  } else {
    formData.name = ''
  }
  // Clear errors when team changes
  errors.name = ''
}, { immediate: true })

const isFormValid = computed(() => {
  return formData.name.trim().length > 0 && !errors.name
})

const validateForm = () => {
  errors.name = ''
  
  if (!formData.name.trim()) {
    errors.name = 'Team name is required'
    return false
  }
  
  if (formData.name.trim().length < 2) {
    errors.name = 'Team name must be at least 2 characters'
    return false
  }
  
  return true
}

const handleSubmit = async () => {
  if (!validateForm()) return
  
  isSubmitting.value = true
  
  try {
    await emit('save', {
      name: formData.name.trim()
    })
  } catch (error) {
    console.error('Error submitting form:', error)
  } finally {
    isSubmitting.value = false
  }
}

// Validate on input change
watch(() => formData.name, () => {
  if (errors.name) {
    validateForm()
  }
})
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
  font-size: 1.25rem;
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

.form-error {
  color: var(--error);
  font-size: 0.875rem;
  margin-top: var(--space-xs);
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