<script setup lang="ts">
import { computed } from 'vue'

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
  createdAt: string
  updatedAt: string
}

const props = defineProps<{
  team: Team
}>()

defineEmits<{
  edit: [team: Team]
  delete: [team: Team]
  'manage-players': [team: Team]
  'generate-teams': [team: Team]
}>()

const maxDisplayPlayers = 5

const displayPlayers = computed(() => props.team.players.slice(0, maxDisplayPlayers))

const averageRating = computed(() => {
  if (props.team.players.length === 0) return 0
  const total = props.team.players.reduce((sum, player) => sum + player.rating, 0)
  return Math.round(total / props.team.players.length)
})
</script>

<template>
  <div class="team-card card">
    <div class="team-card__header">
      <h3 class="team-card__name">{{ team.name }}</h3>
      <div class="team-card__actions">
        <button @click="$emit('edit', team)" class="btn btn--small" title="Edit team">✏️</button>
        <button
          @click="$emit('delete', team)"
          class="btn btn--small btn--danger"
          title="Delete team"
        >
          🗑️
        </button>
      </div>
    </div>

    <div class="team-card__stats">
      <div class="stat">
        <span class="stat__label">Players:</span>
        <span class="stat__value">{{ team.players.length }}</span>
      </div>
      <div class="stat" v-if="team.players.length > 0">
        <span class="stat__label">Avg Rating:</span>
        <span class="stat__value">{{ averageRating }}</span>
      </div>
    </div>

    <div class="team-card__players">
      <h4 class="players-title">Players</h4>
      <div v-if="team.players.length === 0" class="empty-players">No players assigned</div>
      <div v-else class="players-list">
        <div v-for="player in displayPlayers" :key="player.id" class="player-item">
          <span class="player-name">{{ player.name }}</span>
          <span class="player-rating">{{ player.rating }}</span>
        </div>
        <div v-if="team.players.length > maxDisplayPlayers" class="more-players">
          +{{ team.players.length - maxDisplayPlayers }} more
        </div>
      </div>
    </div>

    <div class="team-card__footer">
      <div class="footer-buttons">
        <button @click="$emit('manage-players', team)" class="btn btn--primary">
          Manage Players
        </button>
        <button
          @click="$emit('generate-teams', team)"
          class="btn btn--secondary"
          :disabled="team.players.length < 2"
          title="Generate balanced teams from this squad"
        >
          Generate Teams
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.team-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  transition:
    transform var(--transition-fast),
    box-shadow var(--transition-fast);
}

.team-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.team-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-center;
  gap: var(--space-md);
}

.team-card__name {
  line-height: 1.5rem;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  flex: 1;
}

.team-card__actions {
  display: flex;
  gap: var(--space-xs);
}

.team-card__stats {
  display: flex;
  gap: var(--space-lg);
  padding: var(--space-sm) 0;
  border-bottom: 1px solid var(--border-primary);
}

.stat {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.stat__label {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat__value {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--accent-primary);
}

.team-card__players {
  flex: 1;
}

.players-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0 0 var(--space-sm) 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.empty-players {
  color: var(--text-muted);
  font-style: italic;
  text-align: center;
  padding: var(--space-md);
}

.players-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.player-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-xs) var(--space-sm);
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  transition: background-color var(--transition-fast);
}

.player-item:hover {
  background: var(--bg-surface);
}

.player-name {
  font-weight: 500;
  color: var(--text-primary);
}

.player-rating {
  font-weight: 600;
  color: var(--accent-primary);
  font-size: 0.875rem;
}

.more-players {
  color: var(--text-muted);
  font-size: 0.875rem;
  text-align: center;
  padding: var(--space-sm);
  font-style: italic;
}

.team-card__footer {
  margin-top: auto;
}

.footer-buttons {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.footer-buttons .btn {
  width: 100%;
}

.btn--secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
}

.btn--secondary:hover:not(:disabled) {
  background: var(--bg-surface);
  border-color: var(--accent-primary);
}

.btn--secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--small {
  padding: var(--space-xs) var(--space-sm);
  font-size: 0.75rem;
  min-width: auto;
}

.btn--danger {
  color: var(--error);
}

.btn--danger:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: var(--error);
}
</style>
