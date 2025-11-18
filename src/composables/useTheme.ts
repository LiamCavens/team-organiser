import { ref, computed, watchEffect } from 'vue'

const accentColors = [
  { name: 'Green', value: 'green' },
  { name: 'Blue', value: 'blue' },
  { name: 'Purple', value: 'purple' },
  { name: 'Orange', value: 'orange' },
  { name: 'Red', value: 'red' },
  { name: 'Cyan', value: 'cyan' },
] as const

type AccentColor = typeof accentColors[number]['value']

const currentAccent = ref<AccentColor>('green')

// Load saved accent color from localStorage
const savedAccent = localStorage.getItem('accent-color') as AccentColor
if (savedAccent && accentColors.some(c => c.value === savedAccent)) {
  currentAccent.value = savedAccent
}

export function useTheme() {
  const setAccentColor = (color: AccentColor) => {
    currentAccent.value = color
    localStorage.setItem('accent-color', color)
  }

  // Apply accent color to document
  watchEffect(() => {
    document.documentElement.setAttribute('data-accent', currentAccent.value)
  })

  return {
    accentColors,
    currentAccent: computed(() => currentAccent.value),
    setAccentColor,
  }
}