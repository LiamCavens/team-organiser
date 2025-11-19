export interface Player {
  id: number
  name: string
  rating: number
}

export interface SubstitutePair {
  substitute: Player
  rotationPlayer: Player
}

export interface TeamPair {
  team1: Player[]
  team2: Player[]
  ratingDifference: number
  substituteInfo?: {
    teamWithSub: 1 | 2
    substitutePair: SubstitutePair
  }
}

/**
 * Balance teams by distributing players to minimize rating difference
 */
export function balanceTeams(players: Player[]): TeamPair {
  if (players.length < 2) {
    throw new Error('Need at least 2 players to create teams')
  }

  const isOddNumber = players.length % 2 === 1
  let playersToBalance = [...players]
  let substitutePlayer: Player | null = null

  // If odd number, remove one player to be the substitute
  if (isOddNumber) {
    // Sort by rating to find a good substitute candidate (middle range)
    const sortedByRating = [...players].sort((a, b) => b.rating - a.rating)
    const middleIndex = Math.floor(sortedByRating.length / 2)
    substitutePlayer = sortedByRating[middleIndex] || null
    playersToBalance = players.filter((p) => p.id !== substitutePlayer?.id)
  }

  // Sort players by rating (highest first) for balancing
  const sortedPlayers = playersToBalance.sort((a, b) => b.rating - a.rating)

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

  // Handle substitute assignment
  let substituteInfo: TeamPair['substituteInfo'] = undefined

  if (substitutePlayer && isOddNumber) {
    // Determine which team gets the substitute (the one with lower total rating)
    const teamWithSub: 1 | 2 = team1Rating <= team2Rating ? 1 : 2
    const targetTeam = teamWithSub === 1 ? team1 : team2

    // Add substitute to the team
    targetTeam.push(substitutePlayer)

    // Find the best rotation partner (player with closest rating in the same team)
    const rotationPlayer = findClosestRatingPlayer(
      substitutePlayer,
      targetTeam.filter((p) => p.id !== substitutePlayer.id),
    )

    if (rotationPlayer) {
      substituteInfo = {
        teamWithSub,
        substitutePair: {
          substitute: substitutePlayer,
          rotationPlayer,
        },
      }
    }
  }

  const ratingDifference = Math.abs(team1Rating - team2Rating)

  return {
    team1,
    team2,
    ratingDifference,
    substituteInfo,
  }
}

/**
 * Find the player with the closest rating to the target player
 */
function findClosestRatingPlayer(targetPlayer: Player, players: Player[]): Player | null {
  if (players.length === 0) return null

  return players.reduce((closest, current) => {
    const targetRating = targetPlayer.rating
    const currentDiff = Math.abs(current.rating - targetRating)
    const closestDiff = Math.abs(closest.rating - targetRating)

    return currentDiff < closestDiff ? current : closest
  })
}

/**
 * Apply random rating variation to players (±5 points) to add randomization
 */
function randomizePlayerRatings(players: Player[], variation = 5): Player[] {
  return players.map((player) => ({
    ...player,
    rating: Math.max(1, Math.min(100, player.rating + getRandomVariation(variation))),
  }))
}

/**
 * Get a random variation between -variation and +variation
 */
function getRandomVariation(variation: number): number {
  return Math.floor(Math.random() * (variation * 2 + 1)) - variation
}

/**
 * Generate multiple balanced team combinations and return the best one
 */
export function findBestTeamBalance(players: Player[], iterations = 100): TeamPair {
  if (players.length < 2) {
    throw new Error('Need at least 2 players to create teams')
  }

  let bestBalance = balanceTeams(players)

  // Try different shuffles and rating variations to find better balance
  for (let i = 0; i < iterations; i++) {
    // Apply random rating variations for this iteration
    const randomizedPlayers = randomizePlayerRatings(players)
    const shuffled = shuffleArray(randomizedPlayers)
    const balance = balanceTeams(shuffled)

    if (balance.ratingDifference < bestBalance.ratingDifference) {
      bestBalance = balance
    }
  }

  return bestBalance
}

/**
 * Generate randomized teams with higher variation for more diverse team compositions
 */
export function findRandomizedTeamBalance(
  players: Player[],
  ratingVariation = 5,
  iterations = 150,
): TeamPair {
  if (players.length < 2) {
    throw new Error('Need at least 2 players to create teams')
  }

  // Apply initial randomization to base ratings
  const randomizedPlayers = randomizePlayerRatings(players, ratingVariation)

  let bestBalance = balanceTeams(randomizedPlayers)

  // Try multiple iterations with different randomizations
  for (let i = 0; i < iterations; i++) {
    // Apply fresh randomization for each iteration
    const freshRandomizedPlayers = randomizePlayerRatings(players, ratingVariation)
    const shuffled = shuffleArray(freshRandomizedPlayers)
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
      maxRating: 0,
    }
  }

  const totalRating = players.reduce((sum, player) => sum + player.rating, 0)
  const ratings = players.map((p) => p.rating)

  return {
    totalRating,
    averageRating: Math.round(totalRating / players.length),
    playerCount: players.length,
    minRating: Math.min(...ratings),
    maxRating: Math.max(...ratings),
  }
}
