/**
 * Database Seeding Script
 *
 * This script populates the database with initial data for development and testing.
 * It demonstrates several important concepts:
 *
 * 1. SECURE PASSWORD HANDLING: Using bcrypt to hash passwords before storing
 * 2. DATA RELATIONSHIPS: Creating users, teams, and players with proper foreign keys
 * 3. MANY-TO-MANY RELATIONSHIPS: Randomly assigning players to teams via junction table
 * 4. TRANSACTION SAFETY: Clearing existing data and rebuilding from scratch
 *
 * SEEDING BEST PRACTICES:
 *
 * - Use external JSON files for data (easy to modify without code changes)
 * - Hash passwords with bcrypt (same security as production)
 * - Create realistic test data (useful for UI development)
 * - Clear existing data first (idempotent - can run multiple times)
 * - Provide clear console output (debugging and monitoring)
 */

import { PrismaClient, UserRole } from '@prisma/client'
import fs from 'fs/promises' // File system operations (reading JSON)
import path from 'path' // Path utilities
import { fileURLToPath } from 'url' // ES module utilities
import bcrypt from 'bcryptjs' // Password hashing

// ES module path utilities (needed because we use "type": "module")
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create Prisma client for database operations
const prisma = new PrismaClient()

/**
 * TypeScript Interfaces for Mock Data
 *
 * These define the structure of our mock data JSON file.
 * TypeScript will ensure our JSON matches these interfaces.
 */

interface MockUser {
  username: string // Login username
  password: string // Plain text password (will be hashed)
  email?: string // Optional email
  role: 'ADMIN' | 'USER' // User permission level
}

interface MockPlayer {
  name: string // Player name
  rating: number // Skill rating (1-100)
}

interface MockTeam {
  name: string // Team name
}

interface MockData {
  users: MockUser[] // Array of users to create
  players: MockPlayer[] // Array of players to create
  teams: MockTeam[] // Array of teams to create
}

/**
 * Main Seeding Function
 *
 * This function orchestrates the entire database seeding process:
 * 1. Read mock data from JSON file
 * 2. Clear existing data (for clean rebuild)
 * 3. Create users with hashed passwords
 * 4. Create teams and players owned by users
 * 5. Randomly assign players to teams (many-to-many relationships)
 *
 * The seeding process is designed to be:
 * - IDEMPOTENT: Can run multiple times safely
 * - REALISTIC: Creates data useful for development/testing
 * - SECURE: Hashes passwords just like in production
 * - OBSERVABLE: Provides detailed console output
 */
async function main() {
  try {
    console.log('🌱 Starting database seeding...')

    // STEP 1: Read mock data from external JSON file
    // This separates data from code, making it easy to modify test data
    const dataPath = path.join(__dirname, '../data/mock-data.json')
    const rawData = await fs.readFile(dataPath, 'utf-8')
    const mockData: MockData = JSON.parse(rawData)

    console.log(
      `📊 Found ${mockData.users.length} users, ${mockData.players.length} players, and ${mockData.teams.length} teams to seed`,
    )

    // STEP 2: Clear existing data for clean rebuild
    // Order matters! Delete relationships first, then entities
    // This prevents foreign key constraint violations
    console.log('🧹 Clearing existing data...')
    await prisma.teamPlayer.deleteMany() // Many-to-many relationships first
    await prisma.player.deleteMany() // Then entities that reference users
    await prisma.team.deleteMany()
    await prisma.user.deleteMany() // Users last (other entities depend on them)

    // STEP 3: Create users with secure password hashing
    console.log('👥 Creating users...')
    const createdUsers = []
    for (const userData of mockData.users) {
      // SECURITY: Hash password with bcrypt before storing
      // bcrypt.hash(password, saltRounds) - 10 rounds is good for development
      // Higher rounds = more secure but slower (production might use 12-15)
      const hashedPassword = await bcrypt.hash(userData.password, 10)

      const user = await prisma.user.create({
        data: {
          username: userData.username,
          password: hashedPassword, // Store hashed, never plain text!
          email: userData.email,
          role: userData.role as UserRole, // TypeScript type casting
        },
      })
      createdUsers.push(user)
      console.log(`  ✅ Created user: ${user.username} (${user.role})`)
    }

    // Get admin user for seeding data
    const adminUser = createdUsers.find((u) => u.role === 'ADMIN')
    if (!adminUser) {
      throw new Error('No admin user found for seeding')
    }

    // Seed teams for admin user
    console.log('🏆 Creating teams...')
    const createdTeams = []
    for (const teamData of mockData.teams) {
      const team = await prisma.team.create({
        data: {
          name: teamData.name,
          userId: adminUser.id,
        },
      })
      createdTeams.push(team)
      console.log(`  ✅ Created team: ${team.name} for ${adminUser.username}`)
    }

    // Seed players for admin user
    console.log('⚽ Creating players...')
    const createdPlayers = []
    for (const playerData of mockData.players) {
      const player = await prisma.player.create({
        data: {
          name: playerData.name,
          rating: playerData.rating,
          userId: adminUser.id,
        },
      })
      createdPlayers.push(player)
      console.log(
        `  ✅ Created player: ${player.name} (Rating: ${player.rating}) for ${adminUser.username}`,
      )
    }

    // Optionally assign some players to teams randomly
    console.log('🔗 Randomly assigning players to teams...')
    const shuffledPlayers = [...createdPlayers].sort(() => Math.random() - 0.5)

    for (let i = 0; i < Math.min(15, shuffledPlayers.length); i++) {
      const player = shuffledPlayers[i]
      const randomTeam = createdTeams[Math.floor(Math.random() * createdTeams.length)]

      await prisma.teamPlayer.create({
        data: {
          teamId: randomTeam.id,
          playerId: player.id,
        },
      })
      console.log(`  ✅ Assigned ${player.name} to ${randomTeam.name}`)
    }

    console.log('🎉 Database seeding completed successfully!')
    console.log(`📈 Summary:`)
    console.log(`   - ${createdUsers.length} users created`)
    console.log(`   - ${createdTeams.length} teams created`)
    console.log(`   - ${createdPlayers.length} players created`)
    console.log(`   - Random team assignments completed`)
    console.log('\n🔐 Login credentials:')
    console.log('   Admin: username=admin, password=admin')
    console.log('   User1: username=coach1, password=password123')
    console.log('   User2: username=manager2, password=password123')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error('❌ Seed script failed:', e)
  process.exit(1)
})
