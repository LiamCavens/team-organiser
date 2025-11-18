/**
 * GraphQL Resolvers
 *
 * This file contains all the resolver functions that execute when GraphQL operations are called.
 * Resolvers are the "business logic" of your GraphQL API - they determine how to fetch or modify data.
 *
 * KEY RESOLVER CONCEPTS:
 *
 * 1. RESOLVER SIGNATURE: (parent, args, context, info) => result
 *    - parent: The parent object (useful for nested resolvers)
 *    - args: Arguments passed to the GraphQL operation
 *    - context: Shared data (database client, authenticated user, etc.)
 *    - info: Metadata about the query (rarely used)
 *
 * 2. AUTHORIZATION: Checking if a user can perform an operation
 *    - Authentication: "Who are you?" (handled in context)
 *    - Authorization: "What can you do?" (handled in resolvers)
 *
 * 3. FIELD RESOLVERS: Functions that resolve individual fields on types
 *    - User.teams -> function that loads teams for a user
 *    - Team.players -> function that loads players for a team
 *
 * 4. MANY-TO-MANY RELATIONSHIPS: Handled via junction tables
 *    - Teams and Players have a many-to-many relationship
 *    - TeamPlayer table stores the relationships
 *    - Prisma provides type-safe ways to query these relationships
 */

import type { Context } from './index'
import type { Team, Player, User, PrismaClient } from '@prisma/client'
import { authResolvers } from '../src/graphql/resolvers/auth'

/**
 * Extended Prisma Client Type
 *
 * Prisma generates types for your main models but not always for junction tables.
 * This type extension ensures we have proper TypeScript support for the TeamPlayer
 * junction table operations.
 *
 * This is necessary because the many-to-many relationship between Team and Player
 * is stored in a separate TeamPlayer table with additional fields like joinedAt.
 */
type PrismaClientWithTeamPlayer = PrismaClient & {
  teamPlayer: {
    findMany: (args?: {
      where?: { teamId?: number; playerId?: number }
      include?: { player?: boolean; team?: boolean }
    }) => Promise<
      Array<{
        teamId: number
        playerId: number
        joinedAt: Date
        player?: Player
        team?: Team
      }>
    >
    count: (args?: { where?: { teamId?: number; playerId?: number } }) => Promise<number>
    upsert: (args: {
      where: { teamId_playerId: { teamId: number; playerId: number } }
      update: Record<string, unknown>
      create: { teamId: number; playerId: number }
    }) => Promise<{ teamId: number; playerId: number; joinedAt: Date }>
    delete: (args: {
      where: { teamId_playerId: { teamId: number; playerId: number } }
    }) => Promise<{ teamId: number; playerId: number; joinedAt: Date }>
  }
}

/**
 * Extended Types with Relationship Data
 *
 * These types represent how our models look when we include related data.
 * For example, a Team might include its players array when fully loaded.
 */
export type TeamWithRelations = Team & {
  players?: Player[] // Players in this team (loaded via TeamPlayer junction)
  playerCount?: number // Computed field: number of players in team
  user?: User // The user who owns this team
}

export type PlayerWithRelations = Player & {
  teams?: Team[] // Teams this player is in (loaded via TeamPlayer junction)
  teamCount?: number // Computed field: number of teams player is in
  user?: User // The user who owns this player
}

/**
 * AUTHORIZATION MIDDLEWARE FUNCTIONS
 *
 * These functions handle security and access control for the API.
 * Now simplified to only require auth for fetching user-specific data.
 */

/**
 * Require Authentication (Only for user-specific queries)
 *
 * Only used for operations that need to fetch user-specific data.
 *
 * @param context - GraphQL context containing user info
 * @returns The authenticated user
 * @throws Error if user is not authenticated
 */
const requireAuth = (context: Context): User => {
  if (!context.user) {
    console.log('🚨 REQUIRE_AUTH: No user in context, throwing authentication error')
    throw new Error('Authentication required')
  }
  console.log('✅ REQUIRE_AUTH: User authenticated successfully:', context.user.username)
  return context.user
}

/**
 * MAIN RESOLVERS OBJECT
 *
 * This object contains all the resolver functions organized by GraphQL operation type.
 * The structure matches your GraphQL schema exactly.
 */
export const resolvers = {
  /**
   * QUERY RESOLVERS
   *
   * These handle read operations - fetching data from the database.
   * All queries implement user-scoped data access (users see only their own data,
   * unless they're admins who can see everything).
   */
  Query: {
    // Authentication queries
    me: authResolvers.Query.me,

    /**
     * Teams Query
     *
     * Fetches teams based on authentication status:
     * - If authenticated: Returns user's teams only
     * - If not authenticated: Returns empty array (must login to see teams)
     *
     * @param context - Contains authenticated user info (required for personal data)
     * @returns Array of user's teams
     */
    teams: async (_: unknown, __: unknown, context: Context): Promise<Team[]> => {
      const user = requireAuth(context) // Now required for viewing teams

      if (user.role === 'ADMIN') {
        // Admin can see all teams
        return context.prisma.team.findMany()
      }

      // Regular users see only their teams
      return context.prisma.team.findMany({
        where: { userId: user.id },
      })
    },

    /**
     * Team Query (Single)
     *
     * Fetches a specific team by ID with ownership verification.
     *
     * @param id - Team ID to fetch
     * @param context - Contains authenticated user info (required)
     * @returns Team object or null if not found/not owned
     */
    team: async (_: unknown, { id }: { id: number }, context: Context): Promise<Team | null> => {
      const user = requireAuth(context)

      // Admin can see any team
      if (user.role === 'ADMIN') {
        return context.prisma.team.findUnique({
          where: { id },
        })
      }

      // Regular users can only see their own teams
      return context.prisma.team.findUnique({
        where: {
          id,
          userId: user.id, // Ensure ownership
        },
      })
    },

    /**
     * Players Query
     *
     * Fetches players based on authentication status:
     * - If authenticated: Returns user's players only
     * - If not authenticated: Returns empty array (must login to see players)
     *
     * @param context - Contains authenticated user info (required for personal data)
     * @returns Array of user's players
     */
    players: async (_: unknown, __: unknown, context: Context): Promise<Player[]> => {
      const user = requireAuth(context) // Now required for viewing players

      if (user.role === 'ADMIN') {
        // Admin can see all players
        return context.prisma.player.findMany()
      }

      // Regular users see only their players
      return context.prisma.player.findMany({
        where: { userId: user.id },
      })
    },

    player: async (
      _: unknown,
      { id }: { id: number },
      context: Context,
    ): Promise<Player | null> => {
      const user = requireAuth(context)

      // Admin can see any player
      if (user.role === 'ADMIN') {
        return context.prisma.player.findUnique({
          where: { id },
        })
      }

      // Regular users can only see their own players
      return context.prisma.player.findUnique({
        where: {
          id,
          userId: user.id, // Ensure ownership
        },
      })
    },

    playersNotInTeam: async (
      _: unknown,
      { teamId }: { teamId: number },
      context: Context,
    ): Promise<Player[]> => {
      const user = requireAuth(context)

      // Verify user owns the team
      const team = await context.prisma.team.findUnique({
        where: { id: teamId },
        select: { userId: true },
      })

      if (!team || (team.userId !== user.id && user.role !== 'ADMIN')) {
        throw new Error('You can only manage your own teams')
      }

      const playersInTeam = await context.prisma.teamPlayer.findMany({
        where: { teamId },
        select: { playerId: true },
      })

      const playerIdsInTeam = playersInTeam.map((tp) => tp.playerId)

      // Return only user's players (or all for admin)
      const whereCondition =
        user.role === 'ADMIN'
          ? { id: { notIn: playerIdsInTeam } }
          : { id: { notIn: playerIdsInTeam }, userId: user.id }

      return context.prisma.player.findMany({
        where: whereCondition,
      })
    },

    teamsForPlayer: async (
      _: unknown,
      { playerId }: { playerId: number },
      context: Context,
    ): Promise<Team[]> => {
      const user = requireAuth(context)

      // Verify user owns the player
      const player = await context.prisma.player.findUnique({
        where: { id: playerId },
        select: { userId: true },
      })

      if (!player || (player.userId !== user.id && user.role !== 'ADMIN')) {
        throw new Error('You can only manage your own players')
      }

      const extendedPrisma = context.prisma as PrismaClientWithTeamPlayer
      const teamPlayers = await extendedPrisma.teamPlayer.findMany({
        where: { playerId },
        include: { team: true },
      })

      return teamPlayers.map((tp) => tp.team).filter((team): team is Team => team !== null)
    },
  },

  Team: {
    players: async (parent: Team, _: unknown, { prisma }: Context): Promise<Player[]> => {
      const extendedPrisma = prisma as PrismaClientWithTeamPlayer
      const teamPlayers = await extendedPrisma.teamPlayer.findMany({
        where: { teamId: parent.id },
        include: { player: true },
      })
      const players: Player[] = []
      for (const tp of teamPlayers) {
        if (tp.player) {
          players.push(tp.player)
        }
      }
      return players
    },
    playerCount: async (parent: Team, _: unknown, { prisma }: Context): Promise<number> => {
      const extendedPrisma = prisma as PrismaClientWithTeamPlayer
      return await extendedPrisma.teamPlayer.count({
        where: { teamId: parent.id },
      })
    },
    user: async (parent: Team, _: unknown, { prisma }: Context): Promise<User | null> => {
      return prisma.user.findUnique({
        where: { id: parent.userId },
      })
    },
  },

  Player: {
    teams: async (parent: Player, _: unknown, { prisma }: Context): Promise<Team[]> => {
      const extendedPrisma = prisma as PrismaClientWithTeamPlayer
      const teamPlayers = await extendedPrisma.teamPlayer.findMany({
        where: { playerId: parent.id },
        include: { team: true },
      })
      const teams: Team[] = []
      for (const tp of teamPlayers) {
        if (tp.team) {
          teams.push(tp.team)
        }
      }
      return teams
    },
    teamCount: async (parent: Player, _: unknown, { prisma }: Context): Promise<number> => {
      const extendedPrisma = prisma as PrismaClientWithTeamPlayer
      return await extendedPrisma.teamPlayer.count({
        where: { playerId: parent.id },
      })
    },
    user: async (parent: Player, _: unknown, { prisma }: Context): Promise<User | null> => {
      return prisma.user.findUnique({
        where: { id: parent.userId },
      })
    },
  },

  User: {
    // User fields are automatically resolved, no need to define resolvers
  },

  Mutation: {
    // Authentication mutations
    login: authResolvers.Mutation.login,
    register: authResolvers.Mutation.register,
    changePassword: authResolvers.Mutation.changePassword,

    // Team mutations (authentication required)
    createTeam: async (_: unknown, { name }: { name: string }, context: Context): Promise<Team> => {
      const user = requireAuth(context) // Authentication required

      return context.prisma.team.create({
        data: {
          name,
          userId: user.id, // Always assign to authenticated user
        },
      })
    },

    updateTeam: async (
      _: unknown,
      { id, name }: { id: number; name: string },
      context: Context,
    ): Promise<Team> => {
      const user = requireAuth(context)

      // Verify ownership
      const team = await context.prisma.team.findUnique({
        where: { id },
        select: { userId: true },
      })

      if (!team || (team.userId !== user.id && user.role !== 'ADMIN')) {
        throw new Error('You can only update your own teams')
      }

      return context.prisma.team.update({
        where: { id },
        data: { name },
      })
    },

    deleteTeam: async (_: unknown, { id }: { id: number }, context: Context): Promise<boolean> => {
      const user = requireAuth(context)

      // Verify ownership
      const team = await context.prisma.team.findUnique({
        where: { id },
        select: { userId: true },
      })

      if (!team || (team.userId !== user.id && user.role !== 'ADMIN')) {
        throw new Error('You can only delete your own teams')
      }

      await context.prisma.team.delete({ where: { id } })
      return true
    },

    createPlayer: async (
      _: unknown,
      { name, rating }: { name: string; rating: number },
      context: Context,
    ): Promise<Player> => {
      const user = requireAuth(context) // Authentication required

      return context.prisma.player.create({
        data: {
          name,
          rating,
          userId: user.id, // Always assign to authenticated user
        },
      })
    },

    updatePlayer: async (
      _: unknown,
      { id, name, rating }: { id: number; name?: string; rating?: number },
      context: Context,
    ): Promise<Player> => {
      const user = requireAuth(context)

      // Verify ownership
      const player = await context.prisma.player.findUnique({
        where: { id },
        select: { userId: true },
      })

      if (!player || (player.userId !== user.id && user.role !== 'ADMIN')) {
        throw new Error('You can only update your own players')
      }

      const updateData: { name?: string; rating?: number } = {}
      if (name !== undefined) updateData.name = name
      if (rating !== undefined) updateData.rating = rating

      return context.prisma.player.update({
        where: { id },
        data: updateData,
      })
    },

    deletePlayer: async (
      _: unknown,
      { id }: { id: number },
      context: Context,
    ): Promise<boolean> => {
      const user = requireAuth(context)

      // Verify ownership
      const player = await context.prisma.player.findUnique({
        where: { id },
        select: { userId: true },
      })

      if (!player || (player.userId !== user.id && user.role !== 'ADMIN')) {
        throw new Error('You can only delete your own players')
      }

      await context.prisma.player.delete({ where: { id } })
      return true
    },

    addPlayerToTeam: async (
      _: unknown,
      { playerId, teamId }: { playerId: number; teamId: number },
      context: Context,
    ): Promise<Team> => {
      const user = requireAuth(context)

      // Verify user owns both the team and player
      const [team, player] = await Promise.all([
        context.prisma.team.findUnique({
          where: { id: teamId },
          select: { userId: true },
        }),
        context.prisma.player.findUnique({
          where: { id: playerId },
          select: { userId: true },
        }),
      ])

      if (!team || (team.userId !== user.id && user.role !== 'ADMIN')) {
        throw new Error('You can only manage your own teams')
      }

      if (!player || (player.userId !== user.id && user.role !== 'ADMIN')) {
        throw new Error('You can only manage your own players')
      }

      const extendedPrisma = context.prisma as PrismaClientWithTeamPlayer
      await extendedPrisma.teamPlayer.upsert({
        where: {
          teamId_playerId: {
            teamId,
            playerId,
          },
        },
        update: {},
        create: {
          teamId,
          playerId,
        },
      })

      const updatedTeam = await context.prisma.team.findUnique({
        where: { id: teamId },
      })

      if (!updatedTeam) {
        throw new Error(`Team with id ${teamId} not found`)
      }

      return updatedTeam
    },

    removePlayerFromTeam: async (
      _: unknown,
      { playerId, teamId }: { playerId: number; teamId: number },
      context: Context,
    ): Promise<Team> => {
      const user = requireAuth(context)

      // Verify user owns the team
      const team = await context.prisma.team.findUnique({
        where: { id: teamId },
        select: { userId: true },
      })

      if (!team || (team.userId !== user.id && user.role !== 'ADMIN')) {
        throw new Error('You can only manage your own teams')
      }

      const extendedPrisma = context.prisma as PrismaClientWithTeamPlayer
      await extendedPrisma.teamPlayer.delete({
        where: {
          teamId_playerId: {
            teamId,
            playerId,
          },
        },
      })

      const updatedTeam = await context.prisma.team.findUnique({
        where: { id: teamId },
      })

      if (!updatedTeam) {
        throw new Error(`Team with id ${teamId} not found`)
      }

      return updatedTeam
    },
  },
}
