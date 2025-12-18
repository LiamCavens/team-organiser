import jwt from 'jsonwebtoken'
import type { PrismaClient } from '@prisma/client'

type DecodedNetlifyIdentity = {
  sub?: string
  email?: string
  user_metadata?: { full_name?: string; name?: string }
  app_metadata?: { roles?: string[] }
  exp?: number
  iss?: string
}

function getBearerToken(authHeader: string): string | null {
  if (!authHeader) return null
  if (!authHeader.toLowerCase().startsWith('bearer ')) return null
  const token = authHeader.slice(7).trim()
  return token.length ? token : null
}

function getNetlifyIdentitySecret(): string {
  // On Netlify, Identity signs JWTs with the "Identity JWT Secret".
  // You must add this as an env var in Netlify site settings.
  const secret = process.env.NETLIFY_IDENTITY_JWT_SECRET
  if (!secret) {
    throw new Error(
      'Missing NETLIFY_IDENTITY_JWT_SECRET env var. Set it in Netlify site settings (Identity JWT Secret).',
    )
  }
  return secret
}

export async function getOrCreateUserFromNetlifyIdentity(args: {
  authHeader: string
  prisma: PrismaClient
}) {
  const token = getBearerToken(args.authHeader)
  if (!token) return null

  let decoded: DecodedNetlifyIdentity
  try {
    decoded = jwt.verify(token, getNetlifyIdentitySecret()) as DecodedNetlifyIdentity
  } catch {
    return null
  }

  const netlifySub = decoded.sub
  if (!netlifySub) return null

  // Preferred username: full name -> name -> email local-part -> netlify sub
  const fallbackUsername = decoded.email?.split('@')[0] || netlifySub
  const username =
    decoded.user_metadata?.full_name || decoded.user_metadata?.name || fallbackUsername

  const email = decoded.email

  // NOTE: We keep your existing Prisma User model.
  // For Netlify Identity users we store a random password hash (unused) and map by email.
  // This keeps resolvers working without large refactors.

  const existing = email
    ? await args.prisma.user.findFirst({ where: { email } })
    : await args.prisma.user.findFirst({ where: { username } })

  if (existing) return existing

  // Create a placeholder password - not used (Netlify Identity handles password auth)
  const placeholderPassword = 'NETLIFY_IDENTITY_MANAGED'

  const created = await args.prisma.user.create({
    data: {
      username,
      email: email ?? null,
      password: placeholderPassword,
      role: 'USER',
    },
  })

  return created
}
