export interface Player {
  id: number
  name: string
  rating: number
}

export interface TeamPair {
  team1: Player[]
  team2: Player[]
  ratingDifference: number
}

/**
 * Balance teams by distributing players to minimize rating difference
 */
export function balanceTeams(players: Player[]): TeamPair {
  if (players.length < 2) {
    throw new Error('Need at least 2 players to create teams')
  }

  // Sort players by rating (highest first)
  const sortedPlayers = [...players].sort((a, b) => b.rating - a.rating)
  
  const team1: Player[] = []
  const team2: Player[] = []
  
  let team1Rating = 0
  let team2Rating = 0
  
  // Distribute players using a greedy approach
  for (const player of sortedPlayers) {
    if (team1Rating <= team2Rating) {
      team1.push(player)
      team1Rating += player.rating
    } else {
      team2.push(player)
      team2Rating += player.rating
    }
  }
  
  const ratingDifference = Math.abs(team1Rating - team2Rating)
  
  return {
    team1,
    team2,
    ratingDifference
  }
}

/**
 * Generate multiple balanced team combinations and return the best one
 */
export function findBestTeamBalance(players: Player[], iterations = 100): TeamPair {
  if (players.length < 2) {
    throw new Error('Need at least 2 players to create teams')
  }

  let bestBalance = balanceTeams(players)
  
  // Try different shuffles to find better balance
  for (let i = 0; i < iterations; i++) {
    const shuffled = shuffleArray([...players])
    const balance = balanceTeams(shuffled)
    
    if (balance.ratingDifference < bestBalance.ratingDifference) {
      bestBalance = balance
    }
  }
  
  return bestBalance
}

/**
 * Create multiple team pairs from a pool of players
 */
export function createMultipleTeamPairs(players: Player[], pairCount: number): TeamPair[] {
  if (players.length < pairCount * 2) {
    throw new Error(`Need at least ${pairCount * 2} players to create ${pairCount} team pairs`)
  }

  const shuffled = shuffleArray([...players])
  const pairs: TeamPair[] = []
  
  const playersPerPair = Math.floor(players.length / pairCount)
  
  for (let i = 0; i < pairCount; i++) {
    const startIndex = i * playersPerPair
    const endIndex = i === pairCount - 1 ? players.length : (i + 1) * playersPerPair
    const pairPlayers = shuffled.slice(startIndex, endIndex)
    
    if (pairPlayers.length >= 2) {
      pairs.push(findBestTeamBalance(pairPlayers, 50))
    }
  }
  
  return pairs
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = shuffled[i]!
    shuffled[i] = shuffled[j]!
    shuffled[j] = temp
  }
  return shuffled
}

/**
 * Calculate team statistics
 */
export function calculateTeamStats(players: Player[]) {
  if (players.length === 0) {
    return {
      totalRating: 0,
      averageRating: 0,
      playerCount: 0,
      minRating: 0,
      maxRating: 0
    }
  }
  
  const totalRating = players.reduce((sum, player) => sum + player.rating, 0)
  const ratings = players.map(p => p.rating)
  
  return {
    totalRating,
    averageRating: Math.round(totalRating / players.length),
    playerCount: players.length,
    minRating: Math.min(...ratings),
    maxRating: Math.max(...ratings)
  }
}