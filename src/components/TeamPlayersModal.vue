<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount, onMounted } from 'vue'
import { useQuery, useMutation } from '@vue/apollo-composable'
import {
  GET_PLAYERS_NOT_IN_TEAM,
  ADD_PLAYER_TO_TEAM,
  REMOVE_PLAYER_FROM_TEAM,
} from '../graphql/queries'
import { useAuth } from '../composables/useAuth'

interface Player {
  id: number
  name: string
  rating: number
  teams?: Array<{
    id: number
    name: string
  }>
  teamCount?: number
}

interface Team {
  id: number
  name: string
  players: Player[]
  playerCount?: number
}

const props = defineProps<{
  team: Team
}>()
const emit = defineEmits<{
  close: []
  updated: []
}>()

const searchQuery = ref('')
const addingPlayerId = ref<number | null>(null)
const removingPlayerId = ref<number | null>(null)

const { isDemoMode } = useAuth()

// Get players not in this team
// In demo mode we should never initialize this query (avoids unauthenticated calls in dev).
const availablePlayersQueryEnabled = computed(() => !isDemoMode.value)
const {
  result: availableResult,
  loading: loadingAvailable,
  error: errorAvailable,
  refetch: refetchAvailablePlayers,
} = useQuery(
  GET_PLAYERS_NOT_IN_TEAM,
  () => ({ teamId: props.team.id }),
  () => ({ enabled: availablePlayersQueryEnabled.value }),
)

// Disable API requests in demo mode.
watch(
  () => isDemoMode.value,
  (demo) => {
    if (demo) {
      // Best-effort: clear any in-flight data by refetching nothing.
      // (Apollo composable doesn't support dynamically changing enabled after create in all versions.)
      searchQuery.value = ''
    }
  },
)

// Mutations
const { mutate: addPlayerToTeam } = useMutation(ADD_PLAYER_TO_TEAM)
const { mutate: removePlayerFromTeam } = useMutation(REMOVE_PLAYER_FROM_TEAM)

const availablePlayers = computed(() => availableResult.value?.playersNotInTeam || [])

const filteredAvailablePlayers = computed(() => {
  if (!searchQuery.value) return availablePlayers.value

  const query = searchQuery.value.toLowerCase()
  return availablePlayers.value.filter(
    (player: Player) =>
      player.name.toLowerCase().includes(query) || player.rating.toString().includes(query),
  )
})

const addPlayer = async (playerId: number) => {
  if (isDemoMode.value) {
    alert('Demo mode: editing team players is disabled.')
    return
  }
  addingPlayerId.value = playerId

  try {
    await addPlayerToTeam({
      playerId,
      teamId: props.team.id,
    })

    // Refresh available players list
    await refetchAvailablePlayers()
    emit('updated')
  } catch (error) {
    console.error('Error adding player to team:', error)
    alert('Failed to add player to team. Please try again.')
  } finally {
    addingPlayerId.value = null
  }
}

const removePlayer = async (playerId: number) => {
  if (isDemoMode.value) {
    alert('Demo mode: editing team players is disabled.')
    return
  }
  removingPlayerId.value = playerId

  try {
    await removePlayerFromTeam({
      playerId,
      teamId: props.team.id,
    })

    // Refresh available players list
    await refetchAvailablePlayers()
    emit('updated')
  } catch (error) {
    console.error('Error removing player from team:', error)
    alert('Failed to remove player from team. Please try again.')
  } finally {
    removingPlayerId.value = null
  }
}

// Watch for team changes and refetch
watch(
  () => props.team.id,
  () => {
    if (!isDemoMode.value) refetchAvailablePlayers()
  },
)

// Refresh available players
const handleRefreshClick = () => {
  if (isDemoMode.value) return
  refetchAvailablePlayers({ teamId: props.team.id })
}

// Modal UX: close on Escape and prevent background scroll while open
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') emit('close')
}

const previousBodyOverflow = ref<string | null>(null)

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  previousBodyOverflow.value = document.body.style.overflow
  document.body.style.overflow = 'hidden'
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = previousBodyOverflow.value ?? ''
})
</script>

<template>
  <Teleport to="body">
    <div class="modal-overlay" role="dialog" aria-modal="true" @click.self="$emit('close')">
      <div class="modal modal--large">
        <div class="modal__header">
          <h3 class="modal__title">Manage Players - {{ team.name }}</h3>
          <button @click="$emit('close')" class="modal__close btn btn--primary">Close</button>
        </div>

        <div class="modal__content">
          <div v-if="isDemoMode" class="alert alert--info">
            Demo mode is read-only. Sign in to add or remove players from teams.
          </div>

          <!-- Current Team Players -->
          <div class="section">
            <h4 class="section__title">Team Players ({{ team.players.length }})</h4>

            <div v-if="team.players.length === 0" class="empty-state">
              No players in this team yet.
            </div>

            <div v-else class="players-grid">
              <div v-for="player in team.players" :key="player.id" class="player-card">
                <div class="player-info">
                  <span class="player-name">{{ player.name }}</span>
                  <span class="player-rating">{{ player.rating }}</span>
                </div>
                <button
                  @click="removePlayer(player.id)"
                  class="btn btn--small btn--danger"
                  :disabled="isDemoMode || removingPlayerId === player.id"
                >
                  {{ removingPlayerId === player.id ? '...' : 'Remove' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Available Players -->
          <div v-if="!isDemoMode" class="section">
            <h4 class="section__title">
              Available Players

              <button
                @click="handleRefreshClick"
                class="btn btn--small"
                :disabled="loadingAvailable"
              >
                {{ loadingAvailable ? 'Loading...' : 'Refresh' }}
              </button>
            </h4>

            <!-- Search -->
            <div class="search-box">
              <input
                v-model="searchQuery"
                type="text"
                class="input"
                placeholder="Search players..."
              />
            </div>

            <div v-if="loadingAvailable" class="loading">
              <div class="loading__spinner"></div>
              <p>Loading available players...</p>
            </div>

            <div v-else-if="errorAvailable" class="error">
              Error loading players: {{ errorAvailable.message }}
            </div>

            <div v-else-if="filteredAvailablePlayers.length === 0" class="empty-state">
              {{
                searchQuery
                  ? 'No players match your search.'
                  : 'All players are already in this team.'
              }}
            </div>

            <div v-else class="players-grid">
              <div v-for="player in filteredAvailablePlayers" :key="player.id" class="player-card">
                <div class="player-info">
                  <span class="player-name">{{ player.name }}</span>
                  <span class="player-rating">{{ player.rating }}</span>
                  <div v-if="player.teamCount && player.teamCount > 0" class="player-teams">
                    In {{ player.teamCount }} team{{ player.teamCount > 1 ? 's' : '' }}
                  </div>
                </div>
                <button
                  @click="addPlayer(player.id)"
                  class="btn btn--small btn--primary"
                  :disabled="addingPlayerId === player.id"
                >
                  {{ addingPlayerId === player.id ? '...' : 'Add' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-md);
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(2px);
}

.modal {
  width: 100%;
  background-color: var(--bg-surface);
  border-radius: var(--radius-lg);
}

.modal--large {
  max-width: 800px;
  max-height: 90vh;
}

.modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--border-primary);
}

.modal__close {
  padding: var(--space-xs) var(--space-sm);
}

.modal__content {
  padding: var(--space-lg);
  max-height: calc(90vh - 120px);
  overflow-y: auto;
}

.section {
  margin-bottom: var(--space-xl);
}

.section:last-child {
  margin-bottom: 0;
}

.section__title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-md);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.search-box {
  margin-bottom: var(--space-md);
}

.players-grid {
  display: grid;
  gap: var(--space-sm);
}

.player-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.player-card:hover {
  background: var(--bg-surface);
  border-color: var(--border-secondary);
}

.player-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  flex: 1;
}

.player-name {
  font-weight: 600;
  color: var(--text-primary);
}

.player-rating {
  font-weight: 600;
  color: var(--accent-primary);
  font-size: 0.875rem;
}

.player-teams {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-style: italic;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
  color: var(--text-secondary);
}

.loading__spinner {
  width: 30px;
  height: 30px;
  border: 2px solid var(--border-primary);
  border-top: 2px solid var(--accent-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: var(--space-sm);
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error {
  color: var(--error);
  text-align: center;
  padding: var(--space-lg);
}

.empty-state {
  text-align: center;
  color: var(--text-muted);
  padding: var(--space-lg);
  font-style: italic;
}

.btn--danger {
  color: var(--error);
}

.btn--danger:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: var(--error);
}

@media (max-width: 768px) {
  .modal--large {
    margin: var(--space-sm);
    max-height: calc(100vh - 1rem);
  }

  .modal__content {
    padding: var(--space-md);
  }

  .player-card {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-sm);
  }

  .section__title {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
