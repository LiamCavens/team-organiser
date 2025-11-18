import { gql } from '@apollo/client/core'

// User fragments
export const USER_CORE_FRAGMENT = gql`
  fragment UserCore on User {
    id
    username
    email
    role
    createdAt
    updatedAt
  }
`

export const USER_BASIC_FRAGMENT = gql`
  fragment UserBasic on User {
    id
    username
    role
  }
`

// Player fragments
export const PLAYER_CORE_FRAGMENT = gql`
  fragment PlayerCore on Player {
    id
    name
    rating
    createdAt
    updatedAt
  }
`

export const PLAYER_WITH_TEAMS_FRAGMENT = gql`
  fragment PlayerWithTeams on Player {
    ...PlayerCore
    teams {
      ...TeamCore
    }
  }
  ${PLAYER_CORE_FRAGMENT}
`

export const PLAYER_BASIC_FRAGMENT = gql`
  fragment PlayerBasic on Player {
    id
    name
    rating
  }
`

// Team fragments
export const TEAM_CORE_FRAGMENT = gql`
  fragment TeamCore on Team {
    id
    name
    createdAt
    updatedAt
  }
`

export const TEAM_WITH_PLAYERS_FRAGMENT = gql`
  fragment TeamWithPlayers on Team {
    ...TeamCore
    players {
      ...PlayerCore
    }
  }
  ${TEAM_CORE_FRAGMENT}
  ${PLAYER_CORE_FRAGMENT}
`

export const TEAM_BASIC_FRAGMENT = gql`
  fragment TeamBasic on Team {
    id
    name
  }
`

// Complete fragments for full object details
export const PLAYER_COMPLETE_FRAGMENT = gql`
  fragment PlayerComplete on Player {
    ...PlayerCore
    teams {
      ...TeamBasic
    }
    user {
      ...UserBasic
    }
  }
  ${PLAYER_CORE_FRAGMENT}
  ${TEAM_BASIC_FRAGMENT}
  ${USER_BASIC_FRAGMENT}
`

export const TEAM_COMPLETE_FRAGMENT = gql`
  fragment TeamComplete on Team {
    ...TeamCore
    players {
      ...PlayerCore
    }
    user {
      ...UserBasic
    }
  }
  ${TEAM_CORE_FRAGMENT}
  ${PLAYER_CORE_FRAGMENT}
  ${USER_BASIC_FRAGMENT}
`

// Utility fragments for specific use cases
export const TEAM_STATS_FRAGMENT = gql`
  fragment TeamStats on Team {
    id
    name
    players {
      id
      rating
    }
  }
`

export const PLAYER_STATS_FRAGMENT = gql`
  fragment PlayerStats on Player {
    id
    name
    rating
    teams {
      id
      name
    }
  }
`
