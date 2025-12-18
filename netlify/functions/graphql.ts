import { ApolloServer } from '@apollo/server'
import { startServerAndCreateLambdaHandler, handlers } from '@as-integrations/aws-lambda'
import type { APIGatewayProxyEventV2 } from 'aws-lambda'
import { typeDefs } from '../../server/schema'
import { resolvers } from '../../server/resolvers'
import { prisma } from '../../server/prisma'
import { getOrCreateUserFromNetlifyIdentity } from './lib/netlifyIdentityAuth.js'
import { ensureStarterDataForUser } from '../../server/starterData'

export type GraphQLContext = {
  prisma: typeof prisma
  user?: {
    id: number
    username: string
    role: 'ADMIN' | 'USER'
    email?: string | null
  }
}

const apollo = new ApolloServer<GraphQLContext>({
  typeDefs,
  resolvers,
})

export const handler = startServerAndCreateLambdaHandler(
  apollo,
  handlers.createAPIGatewayProxyEventV2RequestHandler(),
  {
    context: async ({ event }: { event: APIGatewayProxyEventV2 }) => {
      const authHeader =
        (event.headers?.authorization as string | undefined) ||
        (event.headers?.Authorization as string | undefined) ||
        ''

      const user = await getOrCreateUserFromNetlifyIdentity({
        authHeader,
        prisma,
      })

      if (user) {
        await ensureStarterDataForUser({ prisma, userId: user.id })
      }

      return { prisma, user: user ?? undefined }
    },
  },
)
