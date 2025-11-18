# Football Manager - Prisma & GraphQL Learning Guide

This document explains the key concepts demonstrated in this project to help you understand Prisma and GraphQL.

## 🏗️ Project Architecture

```
├── server/                 # GraphQL server (Apollo Server)
│   ├── index.ts           # Server setup & authentication context
│   ├── schema.ts          # GraphQL type definitions
│   ├── resolvers.ts       # Business logic for GraphQL operations
│   └── prisma.ts          # Database client setup
├── src/graphql/           # GraphQL client-side utilities
│   └── resolvers/
│       └── auth.ts        # Authentication resolvers & utilities
├── scripts/
│   └── seed.ts           # Database seeding script
├── prisma/
│   └── schema.prisma     # Database schema definition
└── data/
    └── mock-data.json    # Test data for seeding
```

## 📚 Key Learning Concepts

### 1. Prisma ORM Fundamentals

**What is Prisma?**

- A type-safe ORM (Object-Relational Mapping) tool
- Generates TypeScript types from your database schema
- Provides an easy-to-use API for database operations

**Key Files:**

- `prisma/schema.prisma` - Defines your database structure
- `server/prisma.ts` - Creates the database client

**Common Operations:**

```typescript
// Create
const user = await prisma.user.create({
  data: { username: 'john', password: 'hashed123' },
})

// Read
const users = await prisma.user.findMany()
const user = await prisma.user.findUnique({ where: { id: 1 } })

// Update
const user = await prisma.user.update({
  where: { id: 1 },
  data: { username: 'jane' },
})

// Delete
await prisma.user.delete({ where: { id: 1 } })

// Relations
const userWithTeams = await prisma.user.findUnique({
  where: { id: 1 },
  include: { teams: true }, // Load related teams
})
```

### 2. GraphQL Fundamentals

**What is GraphQL?**

- A query language for APIs that lets clients request exactly the data they need
- Alternative to REST APIs with more flexibility
- Strongly typed with a schema-first approach

**Key Components:**

**Schema (server/schema.ts):**

```graphql
type User {
  id: Int! # ! means required/non-null
  username: String!
  email: String # Optional field
}

type Query {
  users: [User!]! # Array of required users
}

type Mutation {
  createUser(name: String!): User!
}
```

**Resolvers (server/resolvers.ts):**

```typescript
const resolvers = {
  Query: {
    users: () => prisma.user.findMany(), // How to fetch users
  },
  Mutation: {
    createUser: (_, { name }) => prisma.user.create({ data: { name } }),
  },
}
```

### 3. Database Relationships

This project demonstrates three types of relationships:

**One-to-Many (User → Teams):**

```prisma
model User {
  id    Int    @id @default(autoincrement())
  teams Team[] // One user can have many teams
}

model Team {
  id     Int  @id @default(autoincrement())
  userId Int  // Foreign key
  user   User @relation(fields: [userId], references: [id])
}
```

**Many-to-Many (Teams ↔ Players):**

```prisma
model Team {
  id      Int           @id @default(autoincrement())
  players TeamPlayer[] // Junction table
}

model Player {
  id    Int           @id @default(autoincrement())
  teams TeamPlayer[] // Junction table
}

model TeamPlayer {
  teamId   Int
  playerId Int
  team     Team   @relation(fields: [teamId], references: [id])
  player   Player @relation(fields: [playerId], references: [id])

  @@id([teamId, playerId]) // Composite primary key
}
```

### 4. Authentication & Security

**Password Hashing (src/graphql/resolvers/auth.ts):**

```typescript
// Never store plain text passwords!
const hashedPassword = await bcrypt.hash(password, 10)

// To verify:
const isValid = await bcrypt.compare(inputPassword, storedHash)
```

**JWT Tokens:**

```typescript
// Create token
const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: '7d' })

// Verify token
const decoded = jwt.verify(token, SECRET) // { userId: 123 }
```

**Authorization Pattern:**

```typescript
// Check if user is authenticated
const requireAuth = (context) => {
  if (!context.user) throw new Error('Authentication required')
  return context.user
}

// Check if user owns the resource
const requireOwnership = async (context, entityType, entityId) => {
  const user = requireAuth(context)

  if (user.role === 'ADMIN') return // Admins bypass checks

  const entity = await prisma[entityType].findUnique({
    where: { id: entityId },
    select: { userId: true },
  })

  if (!entity || entity.userId !== user.id) {
    throw new Error('Access denied')
  }
}
```

## 🚀 Getting Started

### 1. Run the Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Create/update database
npx prisma db push

# Seed with test data
npm run seed
```

### 2. Start the GraphQL Server

```bash
npm run server:dev
```

The server will start at `http://localhost:4000` with GraphQL Playground available for testing.

### 3. Test Authentication

In GraphQL Playground, try these operations:

**Login:**

```graphql
mutation {
  login(input: { username: "admin", password: "admin" }) {
    token
    user {
      id
      username
      role
    }
  }
}
```

**Query with Authentication:**

```graphql
# Add this to HTTP headers: {"Authorization": "Bearer YOUR_TOKEN_HERE"}
query {
  me {
    id
    username
    role
  }
  teams {
    id
    name
    playerCount
  }
}
```

## 🔧 Common Development Tasks

### Adding a New Model

1. **Update Prisma Schema:**

```prisma
model Match {
  id       Int      @id @default(autoincrement())
  date     DateTime
  homeTeam Team     @relation("HomeMatches", fields: [homeTeamId], references: [id])
  awayTeam Team     @relation("AwayMatches", fields: [awayTeamId], references: [id])
}
```

2. **Generate Types:**

```bash
npx prisma generate
```

3. **Add GraphQL Types:**

```graphql
type Match {
  id: Int!
  date: String!
  homeTeam: Team!
  awayTeam: Team!
}
```

4. **Create Resolvers:**

```typescript
const resolvers = {
  Query: {
    matches: () => prisma.match.findMany({ include: { homeTeam: true, awayTeam: true } }),
  },
  Mutation: {
    createMatch: (_, { input }) => prisma.match.create({ data: input }),
  },
}
```

### Debugging Common Issues

**"Cannot find module '@prisma/client'"**

```bash
npx prisma generate
```

**"Invalid token" errors**

- Check the Authorization header format: `Bearer YOUR_TOKEN`
- Verify the JWT secret matches between client and server

**Database constraint errors**

- Check foreign key relationships in your schema
- Ensure required fields are provided
- Verify unique constraints aren't violated

## 📖 Further Learning Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [GraphQL Documentation](https://graphql.org/learn/)
- [Apollo Server Documentation](https://www.apollographql.com/docs/apollo-server/)
- [JWT.io](https://jwt.io/) - JWT token debugger
- [bcrypt explained](https://auth0.com/blog/hashing-in-action-understanding-bcrypt/)

## 🎯 Practice Exercises

1. **Add a new field to Player** (e.g., `position: String`)
2. **Create a Match model** that references two teams
3. **Add player statistics** (goals, assists, etc.)
4. **Implement team ownership transfer** between users
5. **Add pagination** to the teams/players queries
6. **Create a "coach" role** with limited permissions

Each exercise will help you practice the core concepts demonstrated in this project!
