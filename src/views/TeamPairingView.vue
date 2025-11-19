<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { GET_PLAYERS } from '../graphql/queries'
import {
  findBestTeamBalance,
  findRandomizedTeamBalance,
  createMultipleTeamPairs,
  calculateTeamStats,
  type Player,
  type TeamPair,
} from '../utils/teamPairing'

const selectedPlayerIds = ref<number[]>([])
const teamSize = ref(7) // Default to 7v7
const balanceMode = ref('balanced')
const generatedTeams = ref<TeamPair[]>([])

// GraphQL query
const { result, loading, error, refetch } = useQuery(GET_PLAYERS)

const players = computed(() => result.value?.players || [])

const selectedPlayers = computed(() =>
  players.value.filter((player: Player) => selectedPlayerIds.value.includes(player.id)),
)

const availableTeamSizes = computed(() => {
  const maxSize = Math.floor(selectedPlayers.value.length / 2)
  const sizes = []
  for (let i = 2; i <= Math.min(maxSize, 11); i++) {
    sizes.push(i)
  }
  return sizes
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

const resetSelection = () => {
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
    if (balanceMode.value === 'random') {
      // Generate randomized teams with rating variations
      const totalPlayers = playersForPairing.length
      const playersPerMatch = teamSize.value * 2
      const numberOfMatches = Math.floor(totalPlayers / playersPerMatch)

      if (numberOfMatches === 1) {
        // Single match with randomization
        const teamPair = findRandomizedTeamBalance(playersForPairing, 5)
        generatedTeams.value = [teamPair]
      } else {
        // Multiple matches with shuffling
        const shuffled = [...playersForPairing].sort(() => Math.random() - 0.5)
        const pairs = createMultipleTeamPairs(shuffled, numberOfMatches)
        generatedTeams.value = pairs
      }
    } else {
      // Generate balanced teams
      const totalPlayers = playersForPairing.length
      const playersPerMatch = teamSize.value * 2
      const numberOfMatches = Math.floor(totalPlayers / playersPerMatch)

      if (numberOfMatches === 1) {
        // Single match
        const teamPair = findBestTeamBalance(playersForPairing)
        generatedTeams.value = [teamPair]
      } else {
        // Multiple matches
        const pairs = createMultipleTeamPairs(playersForPairing, numberOfMatches)
        generatedTeams.value = pairs
      }
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
    // Always use randomized generation for regeneration
    const totalPlayers = playersForPairing.length
    const playersPerMatch = teamSize.value * 2
    const numberOfMatches = Math.floor(totalPlayers / playersPerMatch)

    if (numberOfMatches === 1) {
      // Single match with strong randomization
      const teamPair = findRandomizedTeamBalance(playersForPairing, 7)
      generatedTeams.value = [teamPair]
    } else {
      // Multiple matches with shuffling
      const shuffled = [...playersForPairing].sort(() => Math.random() - 0.5)
      const pairs = createMultipleTeamPairs(shuffled, numberOfMatches)
      generatedTeams.value = pairs
    }
  } catch (error) {
    console.error('Error regenerating teams:', error)
    alert('Failed to regenerate teams. Please try again.')
  }
}

// Auto-adjust team size when selection changes
const adjustTeamSize = () => {
  const maxSize = Math.floor(selectedPlayers.value.length / 2)
  if (teamSize.value > maxSize) {
    teamSize.value = Math.max(2, maxSize)
  }
}

// Watch for selection changes
computed(() => {
  adjustTeamSize()
  return selectedPlayers.value.length
})
</script>

<template>
  <div class="team-pairing-view">
    <div class="team-pairing-view__header">
      <h2 class="team-pairing-view__title">Team Pairing System</h2>
      <div class="header-actions">
        <button @click="resetSelection" class="btn" :disabled="selectedPlayers.length === 0">
          Reset Selection
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

    <!-- Player Selection -->
    <div class="player-selection">
      <h3 class="section-title">Select Players ({{ selectedPlayers.length }} selected)</h3>

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
        <div
          v-for="player in players"
          :key="player.id"
          :class="['player-selector', { 'player-selector--selected': isSelected(player.id) }]"
          @click="togglePlayer(player)"
        >
          <div class="player-info">
            <span class="player-name">{{ player.name }}</span>
            <span class="player-rating">{{ player.rating }}</span>
          </div>
          <div class="player-teams" v-if="player.teams.length > 0">
            {{ player.teams.map((t: { id: number; name: string }) => t.name).join(', ') }}
          </div>
          <div class="selection-indicator">
            {{ isSelected(player.id) ? '✓' : '+' }}
          </div>
        </div>
      </div>
    </div>

    <!-- Team Configuration -->
    <div v-if="selectedPlayers.length >= 2" class="team-config">
      <h3 class="section-title">Team Configuration</h3>
      <div class="config-options">
        <div class="config-group">
          <label for="team-size" class="config-label">Players per team:</label>
          <select id="team-size" v-model="teamSize" class="config-select">
            <option v-for="size in availableTeamSizes" :key="size" :value="size">
              {{ size }}v{{ size }} ({{ size * 2 }} total players)
            </option>
          </select>
        </div>

        <div class="config-group">
          <label for="balance-mode" class="config-label">Balance mode:</label>
          <select id="balance-mode" v-model="balanceMode" class="config-select">
            <option value="balanced">Most Balanced</option>
            <option value="random">Random Teams</option>
            <option value="rating-spread">Rating Spread</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Generated Teams -->
    <div v-if="generatedTeams.length > 0" class="generated-teams">
      <h3 class="section-title">Generated Teams</h3>

      <div class="teams-container">
        <div v-for="(teamPair, index) in generatedTeams" :key="index" class="team-pair">
          <div class="team-pair__header">
            <h4>Match {{ index + 1 }}</h4>
            <div class="rating-difference">Rating Difference: {{ teamPair.ratingDifference }}</div>
          </div>

          <div class="teams-display">
            <div class="team">
              <h5 class="team-title">Team A</h5>
              <div class="team-stats">
                <span>Total: {{ calculateTeamStats(teamPair.team1).totalRating }}</span>
                <span>Avg: {{ calculateTeamStats(teamPair.team1).averageRating }}</span>
              </div>
              <div class="team-players">
                <div v-for="player in teamPair.team1" :key="player.id" class="team-player">
                  <span>{{ player.name }}</span>
                  <span>{{ player.rating }}</span>
                </div>
              </div>
            </div>

            <div class="vs-divider">VS</div>

            <div class="team">
              <h5 class="team-title">Team B</h5>
              <div class="team-stats">
                <span>Total: {{ calculateTeamStats(teamPair.team2).totalRating }}</span>
                <span>Avg: {{ calculateTeamStats(teamPair.team2).averageRating }}</span>
              </div>
              <div class="team-players">
                <div v-for="player in teamPair.team2" :key="player.id" class="team-player">
                  <span>{{ player.name }}</span>
                  <span>{{ player.rating }}</span>
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
  align-items: center;
  margin-bottom: var(--space-xl);
  flex-wrap: wrap;
  gap: var(--space-md);
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
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--space-lg) 0;
  padding-bottom: var(--space-sm);
  border-bottom: 2px solid var(--accent-primary);
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
  font-weight: 600;
  color: var(--accent-primary);
  font-size: 0.875rem;
}

.player-teams {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: var(--space-xs);
}

.selection-indicator {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--accent-primary);
  width: 30px;
  text-align: center;
}

.team-config {
  margin-bottom: var(--space-2xl);
}

.config-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-lg);
}

.config-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.config-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
}

.config-select {
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 0.875rem;
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

.rating-difference {
  font-size: 0.875rem;
  color: var(--text-muted);
  background: var(--bg-tertiary);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
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
}
</style>
