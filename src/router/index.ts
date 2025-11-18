import { createRouter, createWebHistory } from 'vue-router'
import TeamsView from '../views/TeamsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'teams',
      component: TeamsView,
    },
    {
      path: '/players',
      name: 'players',
      component: () => import('../views/PlayersView.vue'),
    },
    {
      path: '/pairing',
      name: 'pairing',
      component: () => import('../views/TeamPairingView.vue'),
    },
  ],
})

export default router
