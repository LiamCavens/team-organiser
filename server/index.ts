/**
 * GraphQL Server Entry Point
 *
 * This file sets up the main GraphQL server using Apollo Server.
 * Key concepts covered:
 *
 * 1. APOLLO SERVER: A GraphQL server implementation that handles HTTP requests
 *    and converts them to GraphQL operations (queries/mutations)
 *
 * 2. CONTEXT: A mechanism to pass shared data (like database connections,
 *    user authentication) to all GraphQL resolvers
 *
 * 3. AUTHENTICATION: JWT token-based auth that extracts user info from headers
 *    and makes it available to resolvers for authorization decisions
 */

import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { typeDefs } from './schema.ts'
import { resolvers } from './resolvers.ts'
import { prisma } from './prisma.ts'
import { verifyToken, getUser } from '../src/graphql/resolvers/auth.ts'
import type { User } from '@prisma/client'

/**
 * Context Interface
 *
 * The Context is an object passed to every GraphQL resolver function.
 * It contains shared resources like:
 * - prisma: Database client for performing CRUD operations
 * - user: Currently authenticated user (if any) for authorization
 *
 * Think of Context as a "shared toolbox" that all resolvers can use
 */
export interface Context {
  prisma: typeof prisma // Prisma client instance for database operations
  user?: User // Optional authenticated user (undefined if not logged in)
}

/**
 * Server Startup Function
 *
 * This function demonstrates the typical GraphQL server setup process:
 * 1. Create Apollo Server instance with schema and resolvers
 * 2. Define context function to run on every request
 * 3. Start the server and listen for HTTP requests
 */
async function startServer() {
  // STEP 1: Create Apollo Server
  // The server needs two main things:
  // - typeDefs: GraphQL schema defining available operations and types
  // - resolvers: Functions that execute when GraphQL operations are called
  const server = new ApolloServer<Context>({
    typeDefs, // What operations are available? (from schema.ts)
    resolvers, // How do we execute those operations? (from resolvers.ts)
  })

  // STEP 2: Start server with context function
  // The context function runs before every GraphQL operation
  // It's where we extract authentication info and prepare shared resources
  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 }, // Listen on port 4000

    // CONTEXT FUNCTION: Runs on every request to prepare shared data
    context: async ({ req }) => {
      let user: User | undefined

      // AUTHENTICATION FLOW:
      // 1. Extract Authorization header from HTTP request
      // 2. Check if it contains a Bearer token
      // 3. Verify the JWT token and extract user ID
      // 4. Load user from database using Prisma
      // 5. Add user to context for resolvers to use

      const authHeader = req.headers.authorization || ''
      console.log('🔍 SERVER AUTH DEBUG:', {
        hasAuthHeader: !!authHeader,
        authHeaderPreview: authHeader ? `${authHeader.substring(0, 20)}...` : 'None',
      })

      if (authHeader.startsWith('Bearer ')) {
        try {
          // Extract token (remove 'Bearer ' prefix)
          const token = authHeader.substring(7)
          console.log('🎫 Token extracted:', token ? `${token.substring(0, 30)}...` : 'Empty')

          // Verify JWT and extract payload (contains userId)
          const decoded = verifyToken(token)
          console.log('✅ Token verified successfully, decoded:', decoded)

          // Load full user object from database
          const foundUser = await getUser(decoded.userId)
          console.log(
            '👤 User lookup result:',
            foundUser ? `${foundUser.username} (${foundUser.role})` : 'Not found',
          )
          user = foundUser || undefined // Handle null return
        } catch (error) {
          // Token is invalid, but we don't throw here to allow public queries
          // Some operations might not require authentication
          console.warn('❌ Invalid token provided:', error)
        }
      }

      console.log(
        '📋 Final context user:',
        user ? `${user.username} (ID: ${user.id})` : 'undefined',
      )

      // Return context object that all resolvers will receive
      return {
        prisma, // Database client for CRUD operations
        user, // Authenticated user (or undefined if not logged in)
      }
    },
  })

  console.log(`🚀 Server ready at ${url}`)
  console.log(`🔐 Authentication enabled - use Authorization: Bearer <token> header`)
  console.log(`📖 GraphQL Playground available at ${url} for testing queries`)
}

/**
 * Start the server and handle any startup errors
 *
 * This demonstrates proper error handling for async operations.
 * If the server fails to start, we log the error and exit the process.
 */
startServer().catch((error) => {
  console.error('❌ Error starting server:', error)
  process.exit(1) // Exit with error code
})
