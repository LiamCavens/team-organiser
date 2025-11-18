<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { useRouter } from 'vue-router'
import { GET_TEAMS, CREATE_TEAM, UPDATE_TEAM, DELETE_TEAM } from '../graphql/queries'
import TeamCard from '../components/TeamCard.vue'
import TeamModal from '../components/TeamModal.vue'
import TeamPlayersModal from '../components/TeamPlayersModal.vue'
import { useAuth } from '../composables/useAuth'

interface Team {
  id: number
  name: string
  players: Array<{
    id: number
    name: string
    rating: number
  }>
  playerCount?: number
  createdAt: string
  updatedAt: string
}

const showCreateModal = ref(false)
const editingTeam = ref<Team | null>(null)
const managingTeamPlayers = ref<Team | null>(null)

// Router for navigation
const router = useRouter()

// Authentication check
const { isAuthenticated } = useAuth()

// GraphQL queries and mutations - only execute when authenticated
const { result, loading, error, refetch } = useQuery(
  GET_TEAMS,
  {},
  {
    enabled: isAuthenticated,
  },
)
const { mutate: createTeam } = useMutation(CREATE_TEAM)
const { mutate: updateTeam } = useMutation(UPDATE_TEAM)
const { mutate: deleteTeam } = useMutation(DELETE_TEAM)

const teams = computed(() => result.value?.teams || [])

const handleEditTeam = (team: Team) => {
  editingTeam.value = team
}

const handleDeleteTeam = async (team: Team) => {
  if (
    confirm(
      `Are you sure you want to delete "${team.name}"? This will remove all players from the team.`,
    )
  ) {
    try {
      await deleteTeam({ id: team.id })
      await refetch()
    } catch (err) {
      console.error('Error deleting team:', err)
      alert('Failed to delete team. Please try again.')
    }
  }
}

const handleManageTeamPlayers = (team: Team) => {
  managingTeamPlayers.value = team
}

const handleGenerateTeams = (team: Team) => {
  // Navigate to team-specific pairing view
  router.push({
    name: 'TeamPairing',
    params: { teamId: team.id.toString() },
  })
}

const handleSaveTeam = async (teamData: { name: string }) => {
  console.log('🐛 DEBUG: handleSaveTeam called with:', teamData)

  try {
    if (editingTeam.value) {
      console.log('📝 Updating existing team...')
      // Update existing team
      await updateTeam({
        id: editingTeam.value.id,
        name: teamData.name,
      })
    } else {
      console.log('➕ Creating new team...')
      // Create new team (no auth required now)
      await createTeam({ name: teamData.name })
    }
    console.log('✅ Team operation successful')
    await refetch()
    closeModal()
  } catch (err) {
    console.error('❌ Error saving team:', err)
    alert('Failed to save team. Please try again.')
  }
}

const closeModal = () => {
  showCreateModal.value = false
  editingTeam.value = null
}
</script>

<template>
  <!-- Authentication Required State -->
  <div v-if="!isAuthenticated" class="auth-required">
    <div class="auth-prompt">
      <h3>🔒 Authentication Required</h3>
      <p>Please sign in to manage your teams.</p>
      <p>You'll be able to create, edit, and organize your football teams once logged in.</p>
    </div>
  </div>

  <!-- Error State -->
  <div v-else-if="error && !loading" class="error">
    <p>Error loading teams: {{ error.message }}</p>
    <button @click="() => refetch()" class="btn">Try Again</button>
  </div>

  <!-- Teams Management (Authenticated) -->
  <div v-else class="teams-view">
    <div class="teams-view__header">
      <h2 class="teams-view__title">Teams Management</h2>
      <button @click="showCreateModal = true" class="btn btn--primary">+ Add Team</button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <div class="loading__spinner"></div>
      <p>Loading teams...</p>
    </div>

    <!-- Teams Grid -->
    <div v-else class="teams-grid">
      <div v-if="teams?.length === 0" class="empty-state">
        <h3>No teams yet</h3>
        <p>Create your first team to get started!</p>
        <button @click="showCreateModal = true" class="btn btn--primary">Create Team</button>
      </div>

      <TeamCard
        v-for="team in teams"
        :key="team.id"
        :team="team"
        @edit="handleEditTeam"
        @delete="handleDeleteTeam"
        @manage-players="handleManageTeamPlayers"
        @generate-teams="handleGenerateTeams"
      />
    </div>

    <!-- Create/Edit Team Modal -->
    <TeamModal
      v-if="showCreateModal || editingTeam"
      :team="editingTeam"
      @close="closeModal"
      @save="handleSaveTeam"
    />

    <!-- Player Management Modal -->
    <TeamPlayersModal
      v-if="managingTeamPlayers"
      :team="managingTeamPlayers"
      @close="managingTeamPlayers = null"
      @updated="refetch"
    />
  </div>
</template>

<style scoped>
.teams-view {
  padding: var(--space-lg) 0;
}

.teams-view__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xl);
  flex-wrap: wrap;
  gap: var(--space-md);
}

.teams-view__title {
  font-size: 2rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.teams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
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
  .teams-view__header {
    flex-direction: column;
    align-items: stretch;
  }

  .teams-grid {
    grid-template-columns: 1fr;
  }
}
</style>
