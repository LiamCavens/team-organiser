<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal__header">
        <h3 class="modal__title">
          {{ player ? 'Edit Player' : 'Create New Player' }}
        </h3>
        <button @click="$emit('close')" class="modal__close">✕</button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal__form">
        <div class="form-group">
          <label for="player-name" class="form-label">Player Name</label>
          <input
            id="player-name"
            v-model="formData.name"
            type="text"
            class="input"
            placeholder="Enter player name"
            required
            maxlength="50"
          />
          <div v-if="errors.name" class="form-error">{{ errors.name }}</div>
        </div>

        <div class="form-group">
          <label for="player-rating" class="form-label">
            Rating ({{ formData.rating }}/100)
          </label>
          <div class="rating-input">
            <input
              id="player-rating"
              v-model.number="formData.rating"
              type="range"
              min="1"
              max="100"
              class="slider"
            />
            <input
              v-model.number="formData.rating"
              type="number"
              min="1"
              max="100"
              class="input rating-number"
            />
          </div>
          <div class="rating-preview">
            <div class="rating-bar">
              <div 
                class="rating-fill" 
                :style="{ width: `${formData.rating}%` }"
              ></div>
            </div>
            <span class="rating-label">{{ getRatingLabel(formData.rating) }}</span>
          </div>
          <div v-if="errors.rating" class="form-error">{{ errors.rating }}</div>
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
            {{ isSubmitting ? 'Saving...' : (player ? 'Update' : 'Create') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'

interface Player {
  id: number
  name: string
  rating: number
  teams: Array<{
    id: number
    name: string
  }>
  teamCount?: number
  createdAt: string
  updatedAt: string
}

const props = defineProps<{
  player?: Player | null
}>()

const emit = defineEmits<{
  close: []
  save: [data: { name: string; rating: number }]
}>()

const isSubmitting = ref(false)

const formData = reactive({
  name: '',
  rating: 50
})

const errors = reactive({
  name: '',
  rating: ''
})

// Initialize form data when player prop changes
watch(() => props.player, (newPlayer) => {
  if (newPlayer) {
    formData.name = newPlayer.name
    formData.rating = newPlayer.rating
  } else {
    formData.name = ''
    formData.rating = 50
  }
  // Clear errors when player changes
  errors.name = ''
  errors.rating = ''
}, { immediate: true })

const isFormValid = computed(() => {
  return formData.name.trim().length > 0 && 
         formData.rating >= 1 && 
         formData.rating <= 100 &&
         !errors.name && 
         !errors.rating
})

const validateForm = () => {
  errors.name = ''
  errors.rating = ''
  
  if (!formData.name.trim()) {
    errors.name = 'Player name is required'
    return false
  }
  
  if (formData.name.trim().length < 2) {
    errors.name = 'Player name must be at least 2 characters'
    return false
  }
  
  if (formData.rating < 1 || formData.rating > 100) {
    errors.rating = 'Rating must be between 1 and 100'
    return false
  }
  
  return true
}

const getRatingLabel = (rating: number): string => {
  if (rating >= 90) return 'Excellent'
  if (rating >= 80) return 'Very Good'
  if (rating >= 70) return 'Good'
  if (rating >= 60) return 'Average'
  if (rating >= 50) return 'Below Average'
  return 'Poor'
}

const handleSubmit = async () => {
  if (!validateForm()) return
  
  isSubmitting.value = true
  
  try {
    await emit('save', {
      name: formData.name.trim(),
      rating: formData.rating
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

watch(() => formData.rating, () => {
  if (errors.rating) {
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

.rating-input {
  display: flex;
  gap: var(--space-md);
  align-items: center;
  margin-bottom: var(--space-sm);
}

.slider {
  flex: 1;
  height: 6px;
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
  outline: none;
  cursor: pointer;
}

.slider::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent-primary);
  cursor: pointer;
  border: 2px solid var(--bg-secondary);
  box-shadow: var(--shadow-sm);
}

.slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent-primary);
  cursor: pointer;
  border: 2px solid var(--bg-secondary);
  box-shadow: var(--shadow-sm);
}

.rating-number {
  width: 80px;
  text-align: center;
}

.rating-preview {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.rating-bar {
  flex: 1;
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.rating-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-primary), var(--accent-primary-hover));
  border-radius: var(--radius-md);
  transition: width var(--transition-normal);
}

.rating-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--accent-primary);
  min-width: 100px;
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
  
  .rating-input {
    flex-direction: column;
    align-items: stretch;
  }
  
  .rating-number {
    width: 100%;
  }
}
</style>