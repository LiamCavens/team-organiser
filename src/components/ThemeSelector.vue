<template>
  <div class="theme-selector">
    <label class="theme-selector__label">Theme:</label>
    <select 
      v-model="selectedAccent" 
      @change="handleAccentChange"
      class="theme-selector__select"
    >
      <option 
        v-for="color in accentColors" 
        :key="color.value" 
        :value="color.value"
      >
        {{ color.name }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useTheme } from '../composables/useTheme'

const { accentColors, currentAccent, setAccentColor } = useTheme()
const selectedAccent = ref(currentAccent.value)

// Watch for external changes to current accent
watch(currentAccent, (newAccent) => {
  selectedAccent.value = newAccent
})

const handleAccentChange = () => {
  setAccentColor(selectedAccent.value)
}
</script>

<style scoped>
.theme-selector {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.theme-selector__label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  white-space: nowrap;
}

.theme-selector__select {
  padding: var(--space-xs) var(--space-sm);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: border-color var(--transition-fast);
}

.theme-selector__select:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px var(--accent-primary-light);
}

.theme-selector__select:hover {
  border-color: var(--border-secondary);
}
</style>