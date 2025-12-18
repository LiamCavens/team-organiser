import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'
import { DefaultApolloClient } from '@vue/apollo-composable'
import type { App } from 'vue'
import { getNetlifyAccessToken, initNetlifyIdentity } from './auth/netlifyIdentity'

// Create HTTP link to GraphQL server
const httpLink = createHttpLink({
  uri:
    import.meta.env.VITE_GRAPHQL_URL ||
    (import.meta.env.PROD ? '/api/graphql' : 'http://localhost:4000'),
})

// Create auth link for adding JWT tokens to requests
const authLink = setContext((_, { headers }) => {
  const isDemoMode = localStorage.getItem('demoMode') === 'true'

  if (isDemoMode) {
    return {
      headers: {
        ...headers,
        authorization: '',
      },
    }
  }

  // Ensure Netlify Identity is set up (no-op after first call)
  initNetlifyIdentity()

  // Prefer Netlify Identity access token when present
  const netlifyToken = getNetlifyAccessToken()

  // Get token from localStorage
  const token = localStorage.getItem('token')
  const chosenToken = netlifyToken || token

  return {
    headers: {
      ...headers,
      authorization: chosenToken ? `Bearer ${chosenToken}` : '',
    },
  }
})

// Create error link to handle authentication errors
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    for (const error of graphQLErrors) {
      if (error.message === 'Authentication required' || error.message.includes('Authentication')) {
        // Clear invalid authentication data
        localStorage.removeItem('token')
        localStorage.removeItem('user')

        console.warn('🔐 Invalid authentication token cleared. Please log in again.')

        // Optionally reload the page to reset the app state
        // window.location.reload()
      }
    }
  }

  if (networkError) {
    console.error('🌐 Network error:', networkError)
  }
})

// Create Apollo Client instance
export const apolloClient = new ApolloClient({
  link: errorLink.concat(authLink.concat(httpLink)),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
})

// Setup function to provide Apollo Client to Vue app
export function setupApollo(app: App) {
  app.provide(DefaultApolloClient, apolloClient)
}
