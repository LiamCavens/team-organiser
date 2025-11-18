/**
 * GraphQL Type Definitions (Schema)
 *
 * This file defines the GraphQL schema - essentially the "contract" that describes:
 * 1. What data types exist in your API
 * 2. What operations (queries/mutations) are available
 * 3. What arguments those operations accept
 * 4. What data they return
 *
 * Think of this as the "menu" for your API - it tells clients what they can order.
 *
 * KEY GRAPHQL CONCEPTS:
 *
 * TYPES: Define the shape of your data (like TypeScript interfaces)
 * - type User { id: Int! username: String! }
 *
 * QUERIES: Read operations (like GET requests in REST)
 * - Query { users: [User!]! }
 *
 * MUTATIONS: Write operations (like POST/PUT/DELETE in REST)
 * - Mutation { createUser(name: String!): User! }
 *
 * INPUTS: Complex arguments for mutations
 * - input CreateUserInput { name: String! email: String! }
 *
 * ENUMS: Predefined string values
 * - enum UserRole { ADMIN USER }
 *
 * FIELD MODIFIERS:
 * - String!  = Required (non-null) string
 * - String   = Optional string (can be null)
 * - [String!]! = Required array of required strings
 * - [String] = Optional array of optional strings
 */

export const typeDefs = `#graphql
  # =============================================================================
  # USER AUTHENTICATION TYPES
  # =============================================================================

  """
  User represents a person who can log in and manage teams/players.
  Each user owns their own teams and players (data isolation).
  """
  type User {
    id: Int!              # Unique identifier (primary key)
    username: String!     # Unique username for login
    email: String         # Optional email address
    role: UserRole!       # User's permission level (ADMIN or USER)
    createdAt: String!    # When the user was created
    updatedAt: String!    # When the user was last modified
  }

  """
  UserRole defines the permission levels in the system.
  ADMIN users can see all data, USER can only see their own.
  """
  enum UserRole {
    ADMIN  # Can manage all users' data
    USER   # Can only manage their own data
  }

  """
  AuthPayload is returned when a user successfully logs in or registers.
  Contains both the JWT token and user information.
  """
  type AuthPayload {
    token: String!  # JWT token for subsequent authenticated requests
    user: User!     # The authenticated user's information
  }

  """
  LoginInput contains the credentials needed to authenticate a user.
  """
  input LoginInput {
    username: String!  # The user's username
    password: String!  # The user's password (will be hashed and verified)
  }

  """
  RegisterInput contains the information needed to create a new user account.
  Includes email confirmation for validation.
  """
  input RegisterInput {
    username: String!       # Desired username (must be unique)
    password: String!       # Password (will be hashed before storing)
    email: String!          # Required email address
    confirmEmail: String!   # Email confirmation (must match email)
  }

  """
  ChangePasswordInput allows users to update their password.
  Requires current password for security.
  """
  input ChangePasswordInput {
    currentPassword: String!  # Current password for verification
    newPassword: String!      # New password to set
  }

  # =============================================================================
  # FOOTBALL MANAGER CORE TYPES
  # =============================================================================

  """
  Team represents a football team that can contain multiple players.
  Teams belong to a specific user (owner) and can have many players through
  a many-to-many relationship.
  """
  type Team {
    id: Int!              # Unique identifier (primary key)
    name: String!         # Team name (e.g., "Lions FC")
    players: [Player!]!   # Array of players in this team (resolved via junction table)
    playerCount: Int!     # Number of players in team (computed field)
    user: User!           # The user who owns this team
    userId: Int!          # Foreign key to the owning user
    createdAt: String!    # When the team was created
    updatedAt: String!    # When the team was last modified
  }

  """
  Player represents a football player with a skill rating.
  Players belong to a specific user (owner) and can be in multiple teams
  through a many-to-many relationship.
  """
  type Player {
    id: Int!              # Unique identifier (primary key)
    name: String!         # Player name (e.g., "Cristiano Ronaldo")
    rating: Int!          # Skill rating (typically 1-100)
    teams: [Team!]!       # Array of teams this player is in (resolved via junction table)
    teamCount: Int!       # Number of teams player is in (computed field)
    user: User!           # The user who owns this player
    userId: Int!          # Foreign key to the owning user
    createdAt: String!    # When the player was created
    updatedAt: String!    # When the player was last modified
  }

  # =============================================================================
  # QUERY OPERATIONS (READ DATA)
  # =============================================================================

  """
  Query defines all the read operations available in the API.
  These are like GET endpoints in a REST API.
  """
  type Query {
    # Authentication queries
    """
    Get the currently authenticated user's information.
    Returns null if no user is authenticated.
    """
    me: User

    # Team and player queries (user-specific data)
    """
    Get all teams owned by the current user.
    Admins can see all teams in the system.
    Requires authentication.
    """
    teams: [Team!]!

    """
    Get a specific team by ID.
    Users can only access their own teams, admins can access any team.
    Requires authentication and ownership verification.
    """
    team(id: Int!): Team

    """
    Get all players owned by the current user.
    Admins can see all players in the system.
    Requires authentication.
    """
    players: [Player!]!

    """
    Get a specific player by ID.
    Users can only access their own players, admins can access any player.
    Requires authentication and ownership verification.
    """
    player(id: Int!): Player

    """
    Get all players that are NOT currently in the specified team.
    Useful for showing available players when adding to a team.
    Requires authentication and team ownership.
    """
    playersNotInTeam(teamId: Int!): [Player!]!

    """
    Get all teams that a specific player is currently in.
    Requires authentication and player ownership.
    """
    teamsForPlayer(playerId: Int!): [Team!]!
  }

  # =============================================================================
  # MUTATION OPERATIONS (WRITE DATA)
  # =============================================================================

  """
  Mutation defines all the write operations available in the API.
  These are like POST/PUT/DELETE endpoints in a REST API.
  """
  type Mutation {
    # Authentication mutations
    """
    Authenticate a user with username and password.
    Returns a JWT token and user information on success.
    """
    login(input: LoginInput!): AuthPayload!

    """
    Create a new user account.
    Returns a JWT token and user information on success.
    """
    register(input: RegisterInput!): AuthPayload!

    """
    Change the current user's password.
    Requires current password for security verification.
    """
    changePassword(input: ChangePasswordInput!): Boolean!

    # Team mutations
    """
    Create a new team owned by the current user.
    Requires authentication.
    """
    createTeam(name: String!): Team!

    """
    Update an existing team's name.
    Requires authentication and ownership of the team.
    """
    updateTeam(id: Int!, name: String!): Team!

    """
    Delete a team permanently.
    Also removes all player-team relationships for this team.
    Requires authentication and ownership of the team.
    """
    deleteTeam(id: Int!): Boolean!

    # Player mutations
    """
    Create a new player owned by the current user.
    Requires authentication.
    """
    createPlayer(name: String!, rating: Int!): Player!

    """
    Update an existing player's name and/or rating.
    Both fields are optional - you can update just one.
    Requires authentication and ownership of the player.
    """
    updatePlayer(id: Int!, name: String, rating: Int): Player!

    """
    Delete a player permanently.
    Also removes all team-player relationships for this player.
    Requires authentication and ownership of the player.
    """
    deletePlayer(id: Int!): Boolean!

    # Team-player relationship mutations (Many-to-Many operations)
    """
    Add a player to a team (create relationship).
    Both the player and team must be owned by the current user.
    If the relationship already exists, this operation is idempotent (no error).
    """
    addPlayerToTeam(playerId: Int!, teamId: Int!): Team!

    """
    Remove a player from a team (delete relationship).
    The player and team records remain, only the relationship is removed.
    Requires ownership of the team.
    """
    removePlayerFromTeam(playerId: Int!, teamId: Int!): Team!
  }
`
