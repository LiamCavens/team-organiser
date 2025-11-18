<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { GET_PLAYERS, CREATE_PLAYER, UPDATE_PLAYER, DELETE_PLAYER } from '../graphql/queries'
import PlayerCard from '../components/PlayerCard.vue'
import PlayerModal from '../components/PlayerModal.vue'
import { useAuth } from '../composables/useAuth'

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

const showCreateModal = ref(false)
const editingPlayer = ref<Player | null>(null)

// Authentication check
const { isAuthenticated } = useAuth()

// GraphQL queries and mutations - only execute when authenticated
const { result, loading, error, refetch } = useQuery(
  GET_PLAYERS,
  {},
  {
    enabled: isAuthenticated,
  },
)
const { mutate: createPlayer } = useMutation(CREATE_PLAYER)
const { mutate: updatePlayer } = useMutation(UPDATE_PLAYER)
const { mutate: deletePlayer } = useMutation(DELETE_PLAYER)

const players = computed(() => result.value?.players || [])

const handleEditPlayer = (player: Player) => {
  editingPlayer.value = player
}

const handleDeletePlayer = async (player: Player) => {
  if (
    confirm(
      `Are you sure you want to delete "${player.name}"? This will remove them from all teams.`,
    )
  ) {
    try {
      await deletePlayer({ id: player.id })
      await refetch()
    } catch (err) {
      console.error('Error deleting player:', err)
      alert('Failed to delete player. Please try again.')
    }
  }
}

const handleSavePlayer = async (playerData: { name: string; rating: number }) => {
  try {
    if (editingPlayer.value) {
      // Update existing player
      await updatePlayer({
        id: editingPlayer.value.id,
        name: playerData.name,
        rating: playerData.rating,
      })
    } else {
      // Create new player
      await createPlayer({
        name: playerData.name,
        rating: playerData.rating,
      })
    }
    await refetch()
    closeModal()
  } catch (err) {
    console.error('Error saving player:', err)
    alert('Failed to save player. Please try again.')
  }
}

const closeModal = () => {
  showCreateModal.value = false
  editingPlayer.value = null
}
</script>

<template>
  <!-- Authentication Required State -->
  <div v-if="!isAuthenticated" class="auth-required">
    <div class="auth-prompt">
      <h3>🔒 Authentication Required</h3>
      <p>Please sign in to manage your players.</p>
      <p>You'll be able to create, edit, and organize your football players once logged in.</p>
    </div>
  </div>

  <!-- Players Management (Authenticated) -->
  <div v-else class="players-view">
    <div class="players-view__header">
      <h2 class="players-view__title">Players Management</h2>
      <button @click="showCreateModal = true" class="btn btn--primary">+ Add Player</button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <div class="loading__spinner"></div>
      <p>Loading players...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error">
      <p>Error loading players: {{ error.message }}</p>
      <button @click="() => refetch()" class="btn">Try Again</button>
    </div>

    <!-- Players Grid -->
    <div v-else class="players-grid">
      <div v-if="players?.length === 0" class="empty-state">
        <h3>No players yet</h3>
        <p>Create your first player to get started!</p>
        <button @click="showCreateModal = true" class="btn btn--primary">Create Player</button>
      </div>

      <PlayerCard
        v-for="player in players"
        :key="player.id"
        :player="player"
        @edit="handleEditPlayer"
        @delete="handleDeletePlayer"
      />
    </div>

    <!-- Create/Edit Player Modal -->
    <PlayerModal
      v-if="showCreateModal || editingPlayer"
      :player="editingPlayer"
      @close="closeModal"
      @save="handleSavePlayer"
    />
  </div>
</template>

<style scoped>
.players-view {
  padding: var(--space-lg) 0;
}

.players-view__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xl);
  flex-wrap: wrap;
  gap: var(--space-md);
}

.players-view__title {
  font-size: 2rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.players-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-lg);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xl);
  color: var(--text-secondary);
}

.loading__spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-primary);
  border-top: 3px solid var(--accent-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: var(--space-md);
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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xl);
  color: var(--error);
  gap: var(--space-md);
}

.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xl);
  text-align: center;
  color: var(--text-secondary);
  gap: var(--space-md);
}

.empty-state h3 {
  color: var(--text-primary);
  margin: 0;
}

.auth-required {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding: var(--space-2xl);
}

.auth-prompt {
  text-align: center;
  color: var(--text-secondary);
  max-width: 500px;
}

.auth-prompt h3 {
  color: var(--text-primary);
  font-size: 1.5rem;
  margin-bottom: var(--space-lg);
}

.auth-prompt p {
  margin-bottom: var(--space-md);
  line-height: 1.6;
}

@media (max-width: 768px) {
  .players-view__header {
    flex-direction: column;
    align-items: stretch;
  }

  .players-grid {
    grid-template-columns: 1fr;
  }
}
</style>
