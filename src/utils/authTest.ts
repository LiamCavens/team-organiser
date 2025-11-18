import { apolloClient } from '../apollo'
import { gql } from '@apollo/client/core'

// Test authentication by trying to create a team
const CREATE_TEAM_MUTATION = gql`
  mutation CreateTeam($input: CreateTeamInput!) {
    createTeam(input: $input) {
      id
      name
      description
    }
  }
`

export async function testAuthentication() {
  console.log('🧪 Testing authentication...')

  // Check if we have a token
  const token = localStorage.getItem('token')
  const user = localStorage.getItem('user')

  console.log('📋 Auth status:')
  console.log('  Token:', token ? `${token.substring(0, 20)}...` : 'None')
  console.log('  User:', user ? JSON.parse(user) : 'None')

  if (!token) {
    console.log('❌ No token found. Please login first.')
    return false
  }

  try {
    // Try to create a test team
    const result = await apolloClient.mutate({
      mutation: CREATE_TEAM_MUTATION,
      variables: {
        input: {
          name: 'Test Team Auth',
          description: 'Testing authentication',
        },
      },
    })

    console.log('✅ Authentication successful! Team created:', result.data)
    return true
  } catch (error) {
    const apolloError = error as {
      message: string
      networkError?: unknown
      graphQLErrors?: unknown[]
    }
    console.log('❌ Authentication failed:')
    console.log('  Error:', apolloError.message)
    console.log('  Network error:', apolloError.networkError)
    console.log('  GraphQL errors:', apolloError.graphQLErrors)

    // Check Apollo Client headers
    const client = apolloClient
    console.log('🔍 Apollo Client configuration:')
    console.log('  URI:', client.link)

    return false
  }
}

// Add to window for easy testing in console
if (typeof window !== 'undefined') {
  interface WindowWithTestAuth extends Window {
    testAuth?: typeof testAuthentication
  }
  ;(window as WindowWithTestAuth).testAuth = testAuthentication
}
