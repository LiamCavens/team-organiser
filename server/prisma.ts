/**
 * Prisma Database Client Setup
 *
 * This file creates and exports a Prisma client instance that provides
 * type-safe database access throughout the application.
 *
 * KEY PRISMA CONCEPTS:
 *
 * 1. PRISMA CLIENT: Auto-generated client based on your schema.prisma file
 *    - Provides type-safe database operations
 *    - Handles connection pooling automatically
 *    - Generates TypeScript types for your models
 *
 * 2. SINGLETON PATTERN: We create one client instance and reuse it
 *    - Prevents multiple connection pools
 *    - Better performance and resource management
 *
 * 3. TYPE SAFETY: All database operations are fully typed
 *    - prisma.user.findMany() returns User[]
 *    - prisma.team.create({ data: { name: "..." } }) ensures required fields
 *    - IDE provides autocomplete for available operations and fields
 *
 * COMMON PRISMA OPERATIONS:
 *
 * CREATE: prisma.model.create({ data: { field: value } })
 * READ:   prisma.model.findMany() or prisma.model.findUnique()
 * UPDATE: prisma.model.update({ where: { id }, data: { field: newValue } })
 * DELETE: prisma.model.delete({ where: { id } })
 *
 * RELATIONS: Prisma automatically handles foreign keys and joins
 * - prisma.team.findMany({ include: { players: true } }) // Load related data
 * - prisma.user.create({ data: { teams: { create: [{ name: "..." }] } } }) // Nested creates
 */

import { PrismaClient } from '@prisma/client'

/**
 * Global Prisma Client Instance
 *
 * This client provides access to all database operations defined in your Prisma schema.
 * It's configured to:
 * - Connect to your SQLite database (defined in prisma/schema.prisma)
 * - Provide type-safe operations for User, Team, Player, and TeamPlayer models
 * - Handle connection pooling and query optimization automatically
 *
 * Usage in resolvers:
 * - context.prisma.user.findUnique({ where: { id: 1 } })
 * - context.prisma.team.create({ data: { name: "Lions FC", userId: 1 } })
 * - context.prisma.teamPlayer.create({ data: { teamId: 1, playerId: 2 } })
 */
export const prisma = new PrismaClient({
  // Uncomment for debugging - shows generated SQL queries in console
  // log: ['query', 'info', 'warn', 'error'],
})
