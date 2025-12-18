import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import type { PrismaClient } from '@prisma/client'

type StarterData = {
  team: { name: string }
  players: Array<{ name: string; rating: number }>
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export async function ensureStarterDataForUser(args: { prisma: PrismaClient; userId: number }) {
  // Idempotency guard: if user already has any teams or players, do nothing.
  const [teamCount, playerCount] = await Promise.all([
    args.prisma.team.count({ where: { userId: args.userId } }),
    args.prisma.player.count({ where: { userId: args.userId } }),
  ])

  if (teamCount > 0 || playerCount > 0) return

  const filePath = path.resolve(__dirname, '../data/starter-brazil-2002.json')
  const raw = await fs.readFile(filePath, 'utf-8')
  const starter = JSON.parse(raw) as StarterData

  // Create team
  const team = await args.prisma.team.create({
    data: {
      name: starter.team.name,
      userId: args.userId,
    },
  })

  // Create players (owned by the user)
  const createdPlayers = await Promise.all(
    starter.players.map((p) =>
      args.prisma.player.create({
        data: {
          name: p.name,
          rating: p.rating,
          userId: args.userId,
        },
      }),
    ),
  )

  // Put all players in the team
  for (const player of createdPlayers) {
    await args.prisma.teamPlayer.upsert({
      where: {
        teamId_playerId: {
          teamId: team.id,
          playerId: player.id,
        },
      },
      update: {},
      create: {
        teamId: team.id,
        playerId: player.id,
      },
    })
  }
}
