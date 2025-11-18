import { gql } from '@apollo/client/core'

// Authentication Queries & Mutations
export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        username
        email
        role
        createdAt
      }
    }
  }
`

export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        id
        username
        email
        role
        createdAt
      }
    }
  }
`

export const CHANGE_PASSWORD_MUTATION = gql`
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input)
  }
`

// Team Queries
export const GET_TEAMS = gql`
  query GetTeams {
    teams {
      id
      name
      players {
        id
        name
        rating
      }
      playerCount
      createdAt
      updatedAt
    }
  }
`

export const GET_TEAM = gql`
  query GetTeam($id: Int!) {
    team(id: $id) {
      id
      name
      players {
        id
        name
        rating
      }
      playerCount
      createdAt
      updatedAt
    }
  }
`

// Player Queries
export const GET_PLAYERS = gql`
  query GetPlayers {
    players {
      id
      name
      rating
      teams {
        id
        name
      }
      teamCount
      createdAt
      updatedAt
    }
  }
`

export const GET_PLAYERS_NOT_IN_TEAM = gql`
  query GetPlayersNotInTeam($teamId: Int!) {
    playersNotInTeam(teamId: $teamId) {
      id
      name
      rating
      teams {
        id
        name
      }
      teamCount
    }
  }
`

export const GET_TEAMS_FOR_PLAYER = gql`
  query GetTeamsForPlayer($playerId: Int!) {
    teamsForPlayer(playerId: $playerId) {
      id
      name
      playerCount
    }
  }
`

// Team Mutations
export const CREATE_TEAM = gql`
  mutation CreateTeam($name: String!) {
    createTeam(name: $name) {
      id
      name
      players {
        id
        name
        rating
      }
      playerCount
      createdAt
      updatedAt
    }
  }
`

export const UPDATE_TEAM = gql`
  mutation UpdateTeam($id: Int!, $name: String!) {
    updateTeam(id: $id, name: $name) {
      id
      name
      players {
        id
        name
        rating
      }
      playerCount
      createdAt
      updatedAt
    }
  }
`

export const DELETE_TEAM = gql`
  mutation DeleteTeam($id: Int!) {
    deleteTeam(id: $id)
  }
`

// Player Mutations
export const CREATE_PLAYER = gql`
  mutation CreatePlayer($name: String!, $rating: Int!) {
    createPlayer(name: $name, rating: $rating) {
      id
      name
      rating
      teams {
        id
        name
      }
      teamCount
      createdAt
      updatedAt
    }
  }
`

export const UPDATE_PLAYER = gql`
  mutation UpdatePlayer($id: Int!, $name: String, $rating: Int) {
    updatePlayer(id: $id, name: $name, rating: $rating) {
      id
      name
      rating
      teams {
        id
        name
      }
      teamCount
      createdAt
      updatedAt
    }
  }
`

export const DELETE_PLAYER = gql`
  mutation DeletePlayer($id: Int!) {
    deletePlayer(id: $id)
  }
`

export const ADD_PLAYER_TO_TEAM = gql`
  mutation AddPlayerToTeam($playerId: Int!, $teamId: Int!) {
    addPlayerToTeam(playerId: $playerId, teamId: $teamId) {
      id
      name
      players {
        id
        name
        rating
      }
      playerCount
    }
  }
`

export const REMOVE_PLAYER_FROM_TEAM = gql`
  mutation RemovePlayerFromTeam($playerId: Int!, $teamId: Int!) {
    removePlayerFromTeam(playerId: $playerId, teamId: $teamId) {
      id
      name
      players {
        id
        name
        rating
      }
      playerCount
    }
  }
`
