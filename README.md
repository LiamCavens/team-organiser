# Team Organiser

A full-stack football team management application built with Vue 3, TypeScript, GraphQL, and Prisma. Create teams, manage players, and generate balanced team pairings for games.

## Features

- 🏆 **Team Management**: Create and organize multiple teams
- 👥 **Player Management**: Add players with ratings and team assignments
- ⚖️ **Smart Team Pairing**: Generate balanced teams based on player ratings
- 🎯 **Team-Specific Pairing**: Create balanced teams from individual team rosters
- 🔐 **User Authentication**: Secure JWT-based authentication system
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile

## Tech Stack

- **Frontend**: Vue 3 + TypeScript + Vite
- **Backend**: Node.js + Express + Apollo Server (GraphQL)
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT tokens with bcryptjs
- **Styling**: CSS with custom variables

## Prerequisites

- Node.js ^20.19.0 || >=22.12.0
- npm or yarn package manager

## Quick Start

### 1. Clone & Install

```sh
git clone <repository-url>
cd football-manager
npm install
```

### 2. Database Setup

Initialize the database:

```sh
npx prisma generate
npx prisma db push
```

### 3. Seed Database (Optional)

Populate with sample data:

```sh
npm run seed
```

This creates test users, teams, and players with realistic ratings.

### 4. Start Development Servers

**Terminal 1 - Backend Server:**

```sh
npm run server:dev
```

**Terminal 2 - Frontend Development:**

```sh
npm run dev
```

The application will be available at `http://localhost:5173` (or next available port).

## Available Scripts

### Development

- `npm run dev` - Start Vite development server with hot reload
- `npm run server` - Start GraphQL server (production mode)
- `npm run server:dev` - Start GraphQL server with watch mode

### Database

- `npm run seed` - Seed database with sample data
- `npm run seed:reset` - Reset and reseed database

### Build & Deploy

- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run type-check` - Run TypeScript type checking

### Code Quality

- `npm run lint` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier

## Environment Configuration

Create a `.env` file in the root directory:

```env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="your-secret-key"
```

## Database Schema

The application uses Prisma with SQLite:

- **Users**: Authentication and data ownership
- **Teams**: User-owned team collections
- **Players**: User-owned player profiles with ratings
- **TeamPlayer**: Many-to-many relationship between teams and players

## API Endpoints

- **GraphQL Playground**: `http://localhost:4000/graphql`
- **Frontend**: `http://localhost:5173`

## Project Structure

```
├── src/
│   ├── components/          # Reusable Vue components
│   ├── views/              # Page-level components
│   ├── graphql/            # GraphQL queries and fragments
│   ├── utils/              # Utility functions (team pairing logic)
│   └── router/             # Vue Router configuration
├── server/
│   ├── resolvers/          # GraphQL resolvers
│   ├── schema.ts           # GraphQL type definitions
│   └── index.ts           # Apollo Server setup
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── dev.db            # SQLite database file
└── scripts/
    └── seed.ts           # Database seeding script
```

## Key Features Explained

### Team Pairing Algorithm

- Generates balanced teams based on player ratings
- Minimizes rating differences between teams
- Handles odd numbers with substitute players
- Supports various game formats (5v5, 7v7, etc.)

### Authentication System

- JWT-based authentication
- User-scoped data isolation
- Automatic token validation
- Secure password hashing

### Responsive Design

- Mobile-first approach
- Flexible grid layouts
- Touch-friendly interfaces

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Browser DevTools

- Chromium-based browsers:
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
