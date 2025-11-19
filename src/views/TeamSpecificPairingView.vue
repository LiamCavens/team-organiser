<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery } from '@vue/apollo-composable'
import { useDraggable } from '@vueuse/core'
import { GET_TEAM } from '../graphql/queries'
import {
  findBestTeamBalance,
  findRandomizedTeamBalance,
  calculateTeamStats,
  type Player,
  type TeamPair,
} from '../utils/teamPairing'

const route = useRoute()
const router = useRouter()

// Get team ID from route params
const teamId = computed(() => parseInt(route.params.teamId as string))

// State for pairing
const selectedPlayerIds = ref<number[]>([])
const generatedTeams = ref<TeamPair[]>([])
const editableTeams = ref<{
  team1: Player[]
  team2: Player[]
  substituteInfo?: TeamPair['substituteInfo']
} | null>(null)
const draggedPlayer = ref<Player | null>(null)
const isDragging = ref(false)

// GraphQL query to get team data
const { result, loading, error, refetch } = useQuery(
  GET_TEAM,
  { id: teamId },
  {
    enabled: computed(() => !!teamId.value && !isNaN(teamId.value)),
  },
)

const team = computed(() => result.value?.team || null)
const players = computed(() => team.value?.players || [])

// Auto-select all players initially
const initializeSelection = () => {
  if (players.value.length > 0 && selectedPlayerIds.value.length === 0) {
    selectedPlayerIds.value = players.value.map((p: Player) => p.id)
  }
}

// Watch for players data and auto-select
computed(() => {
  initializeSelection()
  return players.value.length
})

const selectedPlayers = computed(() =>
  players.value.filter((player: Player) => selectedPlayerIds.value.includes(player.id)),
)

// Calculate game format based on selected players
const gameFormat = computed(() => {
  const count = selectedPlayers.value.length
  if (count < 2) return { playersPerSide: 0, format: 'Not enough players' }

  const playersPerSide = Math.floor(count / 2)
  const hasSubstitute = count % 2 === 1

  if (hasSubstitute) {
    return {
      playersPerSide,
      format: `${playersPerSide}v${playersPerSide} + 1 substitute`,
      substitute: true,
    }
  }

  return {
    playersPerSide,
    format: `${playersPerSide}v${playersPerSide}`,
    substitute: false,
  }
})

const isSelected = (playerId: number): boolean => {
  return selectedPlayerIds.value.includes(playerId)
}

const togglePlayer = (player: Player) => {
  const index = selectedPlayerIds.value.indexOf(player.id)
  if (index > -1) {
    selectedPlayerIds.value.splice(index, 1)
  } else {
    selectedPlayerIds.value.push(player.id)
  }
}

const selectAll = () => {
  selectedPlayerIds.value = players.value.map((p: Player) => p.id)
}

const clearSelection = () => {
  selectedPlayerIds.value = []
  generatedTeams.value = []
}

const generateTeams = () => {
  if (selectedPlayers.value.length < 2) return

  const playersForPairing: Player[] = selectedPlayers.value.map((p: Player) => ({
    id: p.id,
    name: p.name,
    rating: p.rating,
  }))

  try {
    const teamPair = findBestTeamBalance(playersForPairing)
    generatedTeams.value = [teamPair]

    // Initialize editable teams
    editableTeams.value = {
      team1: [...teamPair.team1],
      team2: [...teamPair.team2],
      substituteInfo: teamPair.substituteInfo,
    }
  } catch (error) {
    console.error('Error generating teams:', error)
    alert('Failed to generate teams. Please try again.')
  }
}

const regenerateTeams = () => {
  if (selectedPlayers.value.length < 2) return

  const playersForPairing: Player[] = selectedPlayers.value.map((p: Player) => ({
    id: p.id,
    name: p.name,
    rating: p.rating,
  }))

  try {
    // Use randomized generation with ±5 rating variation for more diverse teams
    const teamPair = findRandomizedTeamBalance(playersForPairing, 5)
    generatedTeams.value = [teamPair]

    // Update editable teams
    editableTeams.value = {
      team1: [...teamPair.team1],
      team2: [...teamPair.team2],
      substituteInfo: teamPair.substituteInfo,
    }
  } catch (error) {
    console.error('Error regenerating teams:', error)
    alert('Failed to regenerate teams. Please try again.')
  }
}

const goBack = () => {
  router.push('/')
}

// Helper functions for substitute highlighting
const isSubstitutePlayer = (teamPair: TeamPair, player: Player) => {
  if (!teamPair.substituteInfo) {
    return false
  }
  return teamPair.substituteInfo.substitutePair.substitute.id === player.id
}

// Drag and drop handlers
const handleDragStart = (event: DragEvent, player: Player) => {
  if (!event.dataTransfer) return

  draggedPlayer.value = player
  isDragging.value = true
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', player.id.toString())

  // Add a custom drag image
  const dragElement = event.target as HTMLElement
  dragElement.style.opacity = '0.5'
}

const handleDragEnd = (event: DragEvent) => {
  const dragElement = event.target as HTMLElement
  dragElement.style.opacity = '1'
  isDragging.value = false
  draggedPlayer.value = null
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  event.dataTransfer!.dropEffect = 'move'
}

const handleDrop = (event: DragEvent, targetTeam: 'team1' | 'team2') => {
  event.preventDefault()

  if (!draggedPlayer.value || !editableTeams.value) return

  const sourceTeam = editableTeams.value.team1.find((p) => p.id === draggedPlayer.value!.id)
    ? 'team1'
    : 'team2'

  // Don't do anything if dropping on the same team
  if (sourceTeam === targetTeam) return

  // Remove player from source team
  if (sourceTeam === 'team1') {
    editableTeams.value.team1 = editableTeams.value.team1.filter(
      (p) => p.id !== draggedPlayer.value!.id,
    )
  } else {
    editableTeams.value.team2 = editableTeams.value.team2.filter(
      (p) => p.id !== draggedPlayer.value!.id,
    )
  }

  // Add player to target team
  if (targetTeam === 'team1') {
    editableTeams.value.team1.push(draggedPlayer.value)
  } else {
    editableTeams.value.team2.push(draggedPlayer.value)
  }

  // Update substitute info if the substitute or rotation player was moved
  updateSubstituteInfo()
}

// Update substitute information after drag and drop
const updateSubstituteInfo = () => {
  if (!editableTeams.value?.substituteInfo) return

  const { substitutePair } = editableTeams.value.substituteInfo
  const substitutePlayer = substitutePair.substitute

  // Find which team the substitute is now in
  const substituteInTeam1 = editableTeams.value.team1.find((p) => p.id === substitutePlayer.id)
  const substituteInTeam2 = editableTeams.value.team2.find((p) => p.id === substitutePlayer.id)

  if (substituteInTeam1) {
    // Substitute is in team 1, update team with sub
    editableTeams.value.substituteInfo.teamWithSub = 1
  } else if (substituteInTeam2) {
    // Substitute is in team 2, update team with sub
    editableTeams.value.substituteInfo.teamWithSub = 2
  }
}

// Reset to original generated teams
const resetTeams = () => {
  if (generatedTeams.value.length > 0) {
    const originalTeam = generatedTeams.value[0]!
    editableTeams.value = {
      team1: [...originalTeam.team1],
      team2: [...originalTeam.team2],
      substituteInfo: originalTeam.substituteInfo,
    }
  }
}
</script>

<template>
  <div class="team-pairing-view">
    <div class="team-pairing-view__header">
      <div class="header-left">
        <button @click="goBack" class="btn btn--secondary">← Back to Teams</button>
        <h2 class="team-pairing-view__title">Generate Teams: {{ team?.name || 'Loading...' }}</h2>
      </div>
      <div class="header-actions">
        <button @click="selectAll" class="btn" :disabled="loading">Select All</button>
        <button @click="clearSelection" class="btn" :disabled="selectedPlayers.length === 0">
          Clear Selection
        </button>
        <button
          @click="generateTeams"
          class="btn btn--primary"
          :disabled="selectedPlayers.length < 2"
        >
          Generate Teams
        </button>
        <button
          v-if="generatedTeams.length > 0"
          @click="regenerateTeams"
          class="btn btn--accent"
          :disabled="selectedPlayers.length < 2"
        >
          🎲 Mix Teams
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <div class="loading__spinner"></div>
      <p>Loading team data...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error">
      <p>Error loading team: {{ error.message }}</p>
      <button @click="() => refetch()" class="btn">Try Again</button>
    </div>

    <!-- Team not found -->
    <div v-else-if="!team" class="error">
      <p>Team not found</p>
      <button @click="goBack" class="btn">Go Back</button>
    </div>

    <!-- Team Pairing Interface -->
    <div v-else class="pairing-content">
      <!-- Game Format Info -->
      <div class="game-format-card">
        <h3 class="section-title">Game Format</h3>
        <div class="format-info">
          <div class="format-display">
            <span class="format-text">{{ gameFormat.format }}</span>
            <span class="player-count">{{ selectedPlayers.length }} players selected</span>
          </div>
        </div>
      </div>

      <!-- Player Selection -->
      <div class="player-selection">
        <h3 class="section-title">
          Select Players ({{ selectedPlayers.length }}/{{ players.length }})
        </h3>

        <div v-if="players.length === 0" class="empty-state">
          <p>No players in this team. Add players first to generate teams.</p>
        </div>

        <div v-else class="players-grid">
          <div
            v-for="player in players"
            :key="player.id"
            :class="['player-selector', { 'player-selector--selected': isSelected(player.id) }]"
            @click="togglePlayer(player)"
          >
            <div class="player-info">
              <span class="player-name">{{ player.name }}</span>
              <span class="player-rating">Rating: {{ player.rating }}</span>
            </div>
            <div class="selection-indicator">
              {{ isSelected(player.id) ? '✓' : '+' }}
            </div>
          </div>
        </div>
      </div>

      <!-- Generated Teams -->
      <div v-if="generatedTeams.length > 0" class="generated-teams">
        <div class="teams-header">
          <h3 class="section-title">Generated Teams</h3>
          <div class="teams-actions">
            <button v-if="editableTeams" @click="resetTeams" class="btn btn--secondary">
              Reset Teams
            </button>
            <span v-if="editableTeams" class="drag-hint"
              >💡 Drag players between teams to adjust</span
            >
          </div>
        </div>

        <div class="teams-container">
          <div v-for="(teamPair, index) in generatedTeams" :key="index" class="team-pair">
            <div class="team-pair__header">
              <h4>{{ gameFormat.format }}</h4>
              <button
                v-if="generatedTeams.length > 0"
                @click="regenerateTeams"
                class="btn btn--accent"
                :disabled="selectedPlayers.length < 2"
              >
                🎲 Mix Teams
              </button>
            </div>

            <div class="teams-display">
              <div class="team" @dragover="handleDragOver" @drop="(e) => handleDrop(e, 'team1')">
                <h5 class="team-title">Team A</h5>
                <div class="team-stats">
                  <span
                    >Total:
                    {{
                      editableTeams
                        ? calculateTeamStats(editableTeams.team1).totalRating
                        : calculateTeamStats(teamPair.team1).totalRating
                    }}</span
                  >
                  <span
                    >Avg:
                    {{
                      editableTeams
                        ? calculateTeamStats(editableTeams.team1).averageRating
                        : calculateTeamStats(teamPair.team1).averageRating
                    }}</span
                  >
                </div>
                <div class="team-players">
                  <div
                    v-for="player in editableTeams ? editableTeams.team1 : teamPair.team1"
                    :key="player.id"
                    :class="[
                      'team-player',
                      'draggable-player',
                      {
                        'substitute-highlight': editableTeams
                          ? editableTeams.substituteInfo &&
                            editableTeams.substituteInfo.substitutePair.substitute.id === player.id
                          : isSubstitutePlayer(teamPair, player),
                        'is-dragging': draggedPlayer && draggedPlayer.id === player.id,
                      },
                    ]"
                    draggable="true"
                    @dragstart="(e) => handleDragStart(e, player)"
                    @dragend="handleDragEnd"
                  >
                    <span>{{ player.name }}</span>
                    <span
                      v-if="
                        editableTeams
                          ? editableTeams.substituteInfo &&
                            editableTeams.substituteInfo.substitutePair.substitute.id === player.id
                          : isSubstitutePlayer(teamPair, player)
                      "
                      class="rotation-indicator"
                      >🔄</span
                    >
                    <span>{{ player.rating }}</span>
                    <!-- <span class="drag-handle">⋮⋮</span> -->
                  </div>
                </div>
              </div>

              <div class="vs-divider">VS</div>

              <div class="team" @dragover="handleDragOver" @drop="(e) => handleDrop(e, 'team2')">
                <h5 class="team-title">Team B</h5>
                <div class="team-stats">
                  <span
                    >Total:
                    {{
                      editableTeams
                        ? calculateTeamStats(editableTeams.team2).totalRating
                        : calculateTeamStats(teamPair.team2).totalRating
                    }}</span
                  >
                  <span
                    >Avg:
                    {{
                      editableTeams
                        ? calculateTeamStats(editableTeams.team2).averageRating
                        : calculateTeamStats(teamPair.team2).averageRating
                    }}</span
                  >
                </div>
                <div class="team-players">
                  <div
                    v-for="player in editableTeams ? editableTeams.team2 : teamPair.team2"
                    :key="player.id"
                    :class="[
                      'team-player',
                      'draggable-player',
                      {
                        'substitute-highlight': editableTeams
                          ? editableTeams.substituteInfo &&
                            editableTeams.substituteInfo.substitutePair.substitute.id === player.id
                          : isSubstitutePlayer(teamPair, player),
                        'is-dragging': draggedPlayer && draggedPlayer.id === player.id,
                      },
                    ]"
                    draggable="true"
                    @dragstart="(e) => handleDragStart(e, player)"
                    @dragend="handleDragEnd"
                  >
                    <span>{{ player.name }}</span>
                    <span>{{ player.rating }}</span>
                    <span
                      v-if="
                        editableTeams
                          ? editableTeams.substituteInfo &&
                            editableTeams.substituteInfo.substitutePair.substitute.id === player.id
                          : isSubstitutePlayer(teamPair, player)
                      "
                      class="substitute-indicator"
                      >📥</span
                    >
                    <span class="drag-handle">⋮⋮</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.team-pairing-view {
  padding: var(--space-lg) 0;
}

.team-pairing-view__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-xl);
  flex-wrap: wrap;
  gap: var(--space-md);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.team-pairing-view__title {
  font-size: 2rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--space-lg) 0;
  padding-bottom: var(--space-sm);
  border-bottom: 2px solid var(--accent-primary);
}

.teams-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-lg);
  gap: var(--space-md);
}

.teams-actions {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.drag-hint {
  font-size: 0.875rem;
  color: var(--text-muted);
  font-style: italic;
}

.game-format-card {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  margin-bottom: var(--space-xl);
  border: 1px solid var(--border-primary);
}

.format-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.format-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.format-text {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--accent-primary);
}

.player-count {
  font-size: 1rem;
  color: var(--text-secondary);
}

.substitute-info {
  padding: var(--space-sm);
  background: var(--accent-primary-light);
  border-radius: var(--radius-md);
  border-left: 4px solid var(--accent-primary);
}

.substitute-note {
  font-size: 0.875rem;
  color: var(--text-primary);
}

.player-selection {
  margin-bottom: var(--space-2xl);
}

.players-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-md);
}

.player-selector {
  padding: var(--space-md);
  border: 2px solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.player-selector:hover {
  border-color: var(--accent-primary);
  background: var(--bg-tertiary);
}

.player-selector--selected {
  border-color: var(--accent-primary);
  background: var(--accent-primary-light);
}

.player-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.player-name {
  font-weight: 600;
  color: var(--text-primary);
}

.player-rating {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.selection-indicator {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--accent-primary);
  width: 30px;
  text-align: center;
}

.teams-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
}

.team-pair {
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  background: var(--bg-secondary);
}

.team-pair__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid var(--border-primary);
}

.team-pair__header h4 {
  margin: 0;
  color: var(--text-primary);
}

.teams-display {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: var(--space-lg);
  align-items: start;
}

.team {
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  padding: var(--space-md);
}

.team-title {
  margin: 0 0 var(--space-sm) 0;
  color: var(--accent-primary);
  font-size: 1rem;
  font-weight: 600;
}

.team-stats {
  display: flex;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
  font-size: 0.875rem;
  color: var(--text-muted);
}

.team-players {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.team-player {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-xs) var(--space-sm);
  background: var(--bg-surface);
  border-radius: var(--radius-sm);
  position: relative;
  transition: all var(--transition-fast);
}

.draggable-player {
  cursor: grab;
  user-select: none;
}

.draggable-player:hover {
  background: var(--bg-tertiary);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.draggable-player:active {
  cursor: grabbing;
}

.is-dragging {
  opacity: 0.5;
  transform: rotate(2deg);
}

.drag-handle {
  color: var(--text-muted);
  font-size: 0.75rem;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.draggable-player:hover .drag-handle {
  opacity: 1;
}

.team {
  transition: all var(--transition-fast);
  border: 2px dashed transparent;
}

.team:hover {
  border-color: var(--accent-primary-border);
  background: var(--accent-primary-light);
}

/* .rotation-highlight {
  background: linear-gradient(
    135deg,
    var(--bg-surface) 0%,
    var(--warning) 20%,
    var(--bg-surface) 100%
  ) !important;
  border: 1px solid var(--warning) !important;
} */

.substitute-highlight {
  background: var(--accent-primary-light) !important;
  border: 1px solid var(--accent-primary) !important;
}

.rotation-indicator,
.substitute-indicator {
  font-size: 0.875rem;
  margin-left: var(--space-xs);
}

.vs-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--accent-primary);
  background: var(--accent-primary-light);
  border-radius: 50%;
  width: 50px;
  height: 50px;
  align-self: center;
}

.substitute-section {
  margin-top: var(--space-lg);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--border-primary);
}

.substitute-info-header {
  text-align: center;
  margin-bottom: var(--space-lg);
}

.substitute-info-header h6 {
  margin: 0 0 var(--space-xs) 0;
  color: var(--accent-primary);
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
}

.substitute-info-header p {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.875rem;
}

.substitute-pairing {
  display: flex;
  justify-content: center;
}

.substitute-pair {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  background: var(--bg-tertiary);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  border: 2px solid var(--accent-primary-border);
}

.rotation-player,
.substitute-player-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
}

.player-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-muted);
}

.rotation-arrow {
  font-size: 1.5rem;
  color: var(--accent-primary);
  font-weight: bold;
}

.substitute-player {
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  max-width: 300px;
  margin: 0 auto;
}

.substitute-player h6 {
  margin: 0 0 var(--space-sm) 0;
  color: var(--accent-primary);
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  text-align: center;
}

.loading,
.error {
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

.empty-state {
  text-align: center;
  padding: var(--space-2xl);
  color: var(--text-muted);
}

@media (max-width: 768px) {
  .team-pairing-view__header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    justify-content: center;
  }

  .players-grid {
    grid-template-columns: 1fr;
  }

  .teams-display {
    grid-template-columns: 1fr;
    gap: var(--space-md);
  }

  .vs-divider {
    justify-self: center;
  }

  .format-display {
    flex-direction: column;
    align-items: flex-start;
  }

  .teams-header {
    flex-direction: column;
    align-items: stretch;
  }

  .teams-actions {
    justify-content: center;
  }

  .drag-hint {
    text-align: center;
  }

  .substitute-pair {
    flex-direction: column;
    gap: var(--space-md);
  }

  .rotation-arrow {
    transform: rotate(90deg);
  }
}
</style>
