/**
 * Authentication Resolvers
 *
 * This file handles all authentication-related GraphQL operations.
 * It demonstrates key security concepts including:
 *
 * 1. PASSWORD HASHING: Never store plain text passwords
 * 2. JWT TOKENS: Stateless authentication using JSON Web Tokens
 * 3. AUTHORIZATION: Checking if users can perform specific actions
 * 4. INPUT VALIDATION: Ensuring data integrity and security
 *
 * KEY SECURITY CONCEPTS:
 *
 * BCRYPT: A hashing library designed for passwords
 * - Uses salt to prevent rainbow table attacks
 * - Computationally expensive to slow down brute force attacks
 * - One-way function: you can hash but not "unhash"
 *
 * JWT (JSON Web Token): Stateless authentication tokens
 * - Contains encoded user information (userId)
 * - Signed with a secret key to prevent tampering
 * - Has expiration date for security
 * - No need to store sessions on server
 *
 * AUTHENTICATION vs AUTHORIZATION:
 * - Authentication: "Who are you?" (login with username/password)
 * - Authorization: "What can you do?" (checking permissions)
 */

import { PrismaClient } from '@prisma/client'
import type { User } from '@prisma/client'
import bcrypt from 'bcryptjs' // Library for secure password hashing
import jwt from 'jsonwebtoken' // Library for creating and verifying JWT tokens

// Create Prisma client for database operations
const prisma = new PrismaClient()

// JWT Configuration
// WARNING: In production, use a strong secret key and store it securely!
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'
const JWT_EXPIRES_IN = '7d' // Tokens expire after 7 days

// TypeScript interfaces for type safety
interface LoginInput {
  username: string
  password: string
}

interface RegisterInput {
  username: string
  password: string
  email: string // Required email
  confirmEmail: string // Email confirmation
}

interface AuthPayload {
  token: string // JWT token for future requests
  user: User // User information
}

interface Context {
  user?: User // Current authenticated user (if any)
}

/**
 * Generate JWT Token
 *
 * Creates a signed JWT token containing the user's ID.
 * This token will be sent to the client and included in future requests
 * to prove the user's identity.
 *
 * @param userId - The user's database ID
 * @returns Signed JWT token string
 */
const generateToken = (userId: number): string => {
  return jwt.sign(
    { userId }, // Payload: what data to encode in the token
    JWT_SECRET, // Secret: used to sign and verify the token
    { expiresIn: JWT_EXPIRES_IN }, // Options: when the token expires
  )
}

/**
 * Authentication Resolvers Object
 *
 * This object contains all the resolver functions for authentication operations.
 * Each resolver function corresponds to a GraphQL operation defined in the schema.
 */
export const authResolvers = {
  Mutation: {
    /**
     * Login Mutation
     *
     * Authenticates a user with username and password.
     *
     * SECURITY FLOW:
     * 1. Find user by username in database
     * 2. Compare provided password with stored hashed password
     * 3. If valid, generate JWT token
     * 4. Return token and user info
     *
     * @param _ - Parent object (not used in root resolvers)
     * @param input - Login credentials from GraphQL mutation
     * @returns AuthPayload with token and user data
     */
    login: async (_: unknown, { input }: { input: LoginInput }): Promise<AuthPayload> => {
      const { username, password } = input

      // STEP 1: Find user in database
      // Using Prisma's findUnique to search by username
      const user = await prisma.user.findUnique({
        where: { username }, // SQL: WHERE username = ?
      })

      if (!user) {
        // Security note: Same error for invalid username or password
        // This prevents attackers from knowing if a username exists
        throw new Error('Invalid username or password')
      }

      // STEP 2: Verify password using bcrypt
      // bcrypt.compare() hashes the input password and compares with stored hash
      const isValidPassword = await bcrypt.compare(password, user.password)
      if (!isValidPassword) {
        throw new Error('Invalid username or password')
      }

      // STEP 3: Generate JWT token
      const token = generateToken(user.id)

      // STEP 4: Return successful authentication
      return {
        token, // Client stores this and sends it in Authorization header
        user, // Client can use this to show user info immediately
      }
    },

    /**
     * Register Mutation
     *
     * Creates a new user account with secure password handling.
     *
     * REGISTRATION FLOW:
     * 1. Check if username is already taken
     * 2. Hash the password securely
     * 3. Create user record in database
     * 4. Generate JWT token for immediate login
     * 5. Return token and user info
     *
     * @param _ - Parent object (not used)
     * @param input - Registration data from GraphQL mutation
     * @returns AuthPayload with token and new user data
     */
    register: async (_: unknown, { input }: { input: RegisterInput }): Promise<AuthPayload> => {
      const { username, password, email, confirmEmail } = input

      // STEP 1: Input validation

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw new Error('Please provide a valid email address')
      }

      // Validate email confirmation
      if (email !== confirmEmail) {
        throw new Error('Email addresses do not match')
      }

      // Validate username (minimum length, allowed characters)
      if (username.length < 3) {
        throw new Error('Username must be at least 3 characters long')
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        throw new Error('Username can only contain letters, numbers, underscores, and hyphens')
      }

      // Validate password strength
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long')
      }

      // STEP 2: Check if username already exists
      const existingUser = await prisma.user.findUnique({
        where: { username },
      })

      if (existingUser) {
        throw new Error('User with this username already exists')
      }

      // STEP 3: Check if email already exists
      const existingEmail = await prisma.user.findFirst({
        where: { email },
      })

      if (existingEmail) {
        throw new Error('User with this email already exists')
      }

      // STEP 4: Hash password with bcrypt
      // Salt rounds = 10 is a good balance of security vs performance
      // Higher numbers = more secure but slower
      const hashedPassword = await bcrypt.hash(password, 10)

      // STEP 5: Create user in database
      const user = await prisma.user.create({
        data: {
          username,
          password: hashedPassword, // Store hashed password, NEVER plain text!
          email,
          role: 'USER', // Default role for new users
        },
      })

      // STEP 6: Generate JWT token for immediate login
      const token = generateToken(user.id)

      return {
        token,
        user,
      }
    },

    /**
     * Change Password Mutation
     *
     * Allows authenticated users to change their password.
     *
     * SECURITY MEASURES:
     * 1. Require authentication (user must be logged in)
     * 2. Verify current password before allowing change
     * 3. Hash new password before storing
     *
     * @param _ - Parent object (not used)
     * @param input - Current and new password
     * @param context - Contains authenticated user info
     * @returns Boolean indicating success
     */
    changePassword: async (
      _: unknown,
      { input }: { input: { currentPassword: string; newPassword: string } },
      context: Context,
    ): Promise<boolean> => {
      // STEP 1: Require authentication
      if (!context.user) {
        throw new Error('Not authenticated')
      }

      const { currentPassword, newPassword } = input

      // STEP 2: Verify current password
      // This prevents unauthorized password changes if someone gets access
      // to a user's session/token
      const isValidPassword = await bcrypt.compare(currentPassword, context.user.password)
      if (!isValidPassword) {
        throw new Error('Current password is incorrect')
      }

      // STEP 3: Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10)

      // STEP 4: Update password in database
      await prisma.user.update({
        where: { id: context.user.id },
        data: { password: hashedNewPassword },
      })

      return true
    },
  },

  Query: {
    /**
     * Me Query
     *
     * Returns the currently authenticated user's information.
     * Useful for getting user details after login or checking auth status.
     *
     * @param _ - Parent object (not used)
     * @param __ - Arguments (not used)
     * @param context - Contains authenticated user info
     * @returns Current user or null if not authenticated
     */
    me: async (_: unknown, __: unknown, context: Context): Promise<User | null> => {
      return context.user || null
    },
  },
}

/**
 * Token Verification Utility
 *
 * Verifies and decodes JWT tokens sent by clients.
 * Used by the server's context function to authenticate requests.
 *
 * @param token - JWT token string from Authorization header
 * @returns Decoded payload containing userId
 * @throws Error if token is invalid, expired, or tampered with
 */
export const verifyToken = (token: string): { userId: number } => {
  try {
    // jwt.verify() checks:
    // 1. Token signature is valid (not tampered with)
    // 2. Token hasn't expired
    // 3. Token was signed with our secret
    return jwt.verify(token, JWT_SECRET) as { userId: number }
  } catch {
    // Don't expose specific error details for security
    throw new Error('Invalid token')
  }
}

/**
 * User Lookup Utility
 *
 * Fetches user information from database by ID.
 * Used after token verification to load full user data into context.
 *
 * @param userId - User's database ID from verified JWT token
 * @returns User object or null if not found
 */
export const getUser = async (userId: number): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { id: userId },
    // Note: In a production app, you might want to exclude sensitive fields:
    // select: { id: true, username: true, email: true, role: true, createdAt: true, updatedAt: true }
    // This would exclude the password hash from the returned user object
  })
}
