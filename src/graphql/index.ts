// GraphQL module exports
export * from './fragments'
export * from './queries'

// Re-export commonly used fragments for convenience
export {
  USER_CORE_FRAGMENT,
  USER_BASIC_FRAGMENT,
  PLAYER_CORE_FRAGMENT,
  PLAYER_COMPLETE_FRAGMENT,
  TEAM_CORE_FRAGMENT,
  TEAM_COMPLETE_FRAGMENT,
} from './fragments'
