import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'
import { DefaultApolloClient } from '@vue/apollo-composable'
import type { App } from 'vue'

// Create HTTP link to GraphQL server
const httpLink = createHttpLink({
  uri: 'http://localhost:4000',
})

// Create auth link for adding JWT tokens to requests (optional)
const authLink = setContext((_, { headers }) => {
  // Get token from localStorage
  const token = localStorage.getItem('token')

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  }
})

// Create Apollo Client instance
export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
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
