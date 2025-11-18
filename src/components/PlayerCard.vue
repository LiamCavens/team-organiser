<template>
  <div class="player-card card">
    <div class="player-card__header">
      <h3 class="player-card__name">{{ player.name }}</h3>
      <div class="player-card__actions">
        <button @click="$emit('edit', player)" class="btn btn--small" title="Edit player">
          ✏️
        </button>
        <button @click="$emit('delete', player)" class="btn btn--small btn--danger" title="Delete player">
          🗑️
        </button>
      </div>
    </div>

    <div class="player-card__rating">
      <div class="rating-display">
        <span class="rating-label">Rating</span>
        <div class="rating-value">
          <span class="rating-number">{{ player.rating }}</span>
          <div class="rating-bar">
            <div 
              class="rating-fill" 
              :style="{ width: `${player.rating}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <div class="player-card__teams">
      <h4 class="teams-title">Teams</h4>
      <div v-if="player.teams.length === 0" class="empty-teams">
        Not in any teams
      </div>
      <div v-else class="teams-list">
        <div 
          v-for="team in displayTeams" 
          :key="team.id" 
          class="team-badge"
        >
          {{ team.name }}
        </div>
        <div v-if="player.teams.length > maxDisplayTeams" class="more-teams">
          +{{ player.teams.length - maxDisplayTeams }} more
        </div>
      </div>
    </div>

    <div class="player-card__stats">
      <div class="stat">
        <span class="stat__label">Teams:</span>
        <span class="stat__value">{{ player.teams.length }}</span>
      </div>
      <div class="stat">
        <span class="stat__label">Performance:</span>
        <span class="stat__value" :class="performanceClass">{{ performanceLabel }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Team {
  id: number
  name: string
}

interface Player {
  id: number
  name: string
  rating: number
  teams: Team[]
  teamCount?: number
  createdAt: string
  updatedAt: string
}

const props = defineProps<{
  player: Player
}>()

defineEmits<{
  edit: [player: Player]
  delete: [player: Player]
}>()

const maxDisplayTeams = 3

const displayTeams = computed(() => 
  props.player.teams.slice(0, maxDisplayTeams)
)

const performanceLabel = computed(() => {
  const rating = props.player.rating
  if (rating >= 90) return 'Excellent'
  if (rating >= 80) return 'Very Good'
  if (rating >= 70) return 'Good'
  if (rating >= 60) return 'Average'
  if (rating >= 50) return 'Below Average'
  return 'Poor'
})

const performanceClass = computed(() => {
  const rating = props.player.rating
  if (rating >= 80) return 'performance--excellent'
  if (rating >= 60) return 'performance--good'
  if (rating >= 40) return 'performance--average'
  return 'performance--poor'
})
</script>

<style scoped>
.player-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.player-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.player-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-md);
}

.player-card__name {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  flex: 1;
}

.player-card__actions {
  display: flex;
  gap: var(--space-xs);
}

.player-card__rating {
  padding: var(--space-md) 0;
  border-bottom: 1px solid var(--border-primary);
}

.rating-display {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.rating-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.rating-value {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.rating-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--accent-primary);
  min-width: 40px;
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

.player-card__teams {
  flex: 1;
}

.teams-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0 0 var(--space-sm) 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.empty-teams {
  color: var(--text-muted);
  font-style: italic;
  text-align: center;
  padding: var(--space-md);
}

.teams-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.team-badge {
  padding: var(--space-xs) var(--space-sm);
  background: var(--accent-primary-light);
  color: var(--accent-primary);
  border: 1px solid var(--accent-primary-border);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.more-teams {
  color: var(--text-muted);
  font-size: 0.75rem;
  font-style: italic;
  padding: var(--space-xs) var(--space-sm);
}

.player-card__stats {
  display: flex;
  gap: var(--space-lg);
  padding-top: var(--space-sm);
  border-top: 1px solid var(--border-primary);
}

.stat {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.stat__label {
  font-size: 0.875rem;
  color: var(--text-muted);
  font-weight: 500;
}

.stat__value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
}

.performance--excellent {
  color: var(--success);
}

.performance--good {
  color: var(--accent-primary);
}

.performance--average {
  color: var(--warning);
}

.performance--poor {
  color: var(--error);
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