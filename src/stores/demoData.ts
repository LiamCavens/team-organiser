import { defineStore } from 'pinia'
import starter from '../../data/starter-brazil-2002.json'

type StarterData = {
  team: { name: string }
  players: Array<{ name: string; rating: number }>
}

const starterData = starter as StarterData

export type DemoTeam = {
  id: number
  name: string
  players: Array<{ id: number; name: string; rating: number }>
  playerCount: number
  createdAt: string
  updatedAt: string
}

export type DemoPlayer = {
  id: number
  name: string
  rating: number
  teams: Array<{ id: number; name: string }>
  teamCount: number
  createdAt: string
  updatedAt: string
}

function nowIso() {
  return new Date().toISOString()
}

export const useDemoDataStore = defineStore('demoData', {
  state: () => {
    const createdAt = nowIso()
    const teamId = 1

    const players: DemoPlayer[] = starterData.players.map((p, idx) => ({
      id: idx + 1,
      name: p.name,
      rating: p.rating,
      teams: [{ id: teamId, name: starterData.team.name }],
      teamCount: 1,
      createdAt,
      updatedAt: createdAt,
    }))

    const team: DemoTeam = {
      id: teamId,
      name: starterData.team.name,
      players: players.map((p) => ({ id: p.id, name: p.name, rating: p.rating })),
      playerCount: players.length,
      createdAt,
      updatedAt: createdAt,
    }

    return {
      team,
      players,
    }
  },

  getters: {
    teams(state): DemoTeam[] {
      return [state.team]
    },
  },
})
