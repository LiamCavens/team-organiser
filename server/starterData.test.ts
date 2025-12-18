import { PrismaClient } from '@prisma/client'
import { ensureStarterDataForUser } from './starterData'

// Minimal, fast, DB-backed test.
// Run locally by setting DATABASE_URL to a test Postgres DB (or Neon branch).

async function main() {
  const prisma = new PrismaClient()

  // Create a temporary user
  const user = await prisma.user.create({
    data: {
      username: `starter_test_${Date.now()}`,
      email: `starter_test_${Date.now()}@example.com`,
      password: 'TEST',
      role: 'USER',
    },
  })

  // First provisioning should create data
  await ensureStarterDataForUser({ prisma, userId: user.id })
  const teamCount1 = await prisma.team.count({ where: { userId: user.id } })
  const playerCount1 = await prisma.player.count({ where: { userId: user.id } })

  if (teamCount1 === 0 || playerCount1 === 0) {
    throw new Error('Starter provisioning did not create expected data')
  }

  // Second provisioning should be idempotent (no duplicates)
  await ensureStarterDataForUser({ prisma, userId: user.id })
  const teamCount2 = await prisma.team.count({ where: { userId: user.id } })
  const playerCount2 = await prisma.player.count({ where: { userId: user.id } })

  if (teamCount2 !== teamCount1 || playerCount2 !== playerCount1) {
    throw new Error('Starter provisioning is not idempotent')
  }

  // Cleanup
  await prisma.user.delete({ where: { id: user.id } })
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
