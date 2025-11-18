<template>
  <Teleport to="body">
    <Transition name="modal" appear>
      <div
        v-if="modelValue"
        class="modal-backdrop"
        @click.self="handleBackdropClick"
        @keydown.esc="handleEscapeKey"
      >
        <div class="modal-container" role="dialog" aria-modal="true" :aria-labelledby="titleId">
          <!-- Modal Header -->
          <header class="modal-header">
            <h2 v-if="title" :id="titleId" class="modal-title">{{ title }}</h2>
            <slot name="header" />
            <button
              type="button"
              class="modal-close-button"
              aria-label="Close modal"
              @click="closeModal"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M18 6L6 18M6 6l12 12" stroke-width="2" stroke-linecap="round" />
              </svg>
            </button>
          </header>

          <!-- Modal Body -->
          <main class="modal-body">
            <slot />
          </main>

          <!-- Modal Footer -->
          <footer v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, nextTick, watch } from 'vue'

interface Props {
  modelValue: boolean
  title?: string
  closeOnBackdrop?: boolean
  closeOnEscape?: boolean
  persistent?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  closeOnBackdrop: true,
  closeOnEscape: true,
  persistent: false,
})

const emit = defineEmits<Emits>()

// Generate unique ID for accessibility
const titleId = computed(() => `modal-title-${Math.random().toString(36).substr(2, 9)}`)

const closeModal = () => {
  if (props.persistent) return
  emit('update:modelValue', false)
  emit('close')
}

const handleBackdropClick = () => {
  if (props.closeOnBackdrop && !props.persistent) {
    closeModal()
  }
}

const handleEscapeKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.closeOnEscape && !props.persistent) {
    closeModal()
  }
}

// Focus management for accessibility
let previousActiveElement: HTMLElement | null = null

const trapFocus = (event: KeyboardEvent) => {
  if (event.key !== 'Tab') return

  const modalElement = document.querySelector('.modal-container') as HTMLElement
  if (!modalElement) return

  const focusableElements = modalElement.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  ) as NodeListOf<HTMLElement>

  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  if (event.shiftKey) {
    if (document.activeElement === firstElement) {
      event.preventDefault()
      lastElement?.focus()
    }
  } else {
    if (document.activeElement === lastElement) {
      event.preventDefault()
      firstElement?.focus()
    }
  }
}

onMounted(() => {
  if (props.modelValue) {
    previousActiveElement = document.activeElement as HTMLElement
    document.addEventListener('keydown', trapFocus)
    document.body.style.overflow = 'hidden'

    // Focus first focusable element
    nextTick(() => {
      const firstInput = document.querySelector(
        '.modal-container input, .modal-container button',
      ) as HTMLElement
      firstInput?.focus()
    })
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', trapFocus)
  document.body.style.overflow = ''

  // Restore focus to previous element
  if (previousActiveElement) {
    previousActiveElement.focus()
  }
})

// Watch for modal open/close to manage focus and body scroll
watch(
  () => props.modelValue,
  (isOpen: boolean) => {
    if (isOpen) {
      previousActiveElement = document.activeElement as HTMLElement
      document.addEventListener('keydown', trapFocus)
      document.body.style.overflow = 'hidden'

      nextTick(() => {
        const firstInput = document.querySelector(
          '.modal-container input, .modal-container button',
        ) as HTMLElement
        firstInput?.focus()
      })
    } else {
      document.removeEventListener('keydown', trapFocus)
      document.body.style.overflow = ''

      if (previousActiveElement) {
        previousActiveElement.focus()
      }
    }
  },
)
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.modal-container {
  background-color: var(--color-background-soft);
  border-radius: 12px;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.3),
    0 10px 10px -5px rgba(0, 0, 0, 0.2);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
}

.modal-header {
  padding: 1.5rem 1.5rem 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 1rem;
  margin-bottom: 0;
}

.modal-title {
  color: var(--color-heading);
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  flex: 1;
}

.modal-close-button {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  margin-left: 1rem;
}

.modal-close-button:hover {
  background-color: var(--color-background-mute);
  color: var(--color-text);
}

.modal-close-button:focus {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 1rem 1.5rem 1.5rem 1.5rem;
  border-top: 1px solid var(--color-border);
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  align-items: center;
}

/* Transition Animations */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.9) translateY(-20px);
}

.modal-enter-to .modal-container,
.modal-leave-from .modal-container {
  transform: scale(1) translateY(0);
}

/* Responsive Design */
@media (max-width: 768px) {
  .modal-backdrop {
    padding: 0.5rem;
  }

  .modal-container {
    max-height: 95vh;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .modal-title {
    font-size: 1.125rem;
  }
}
</style>
