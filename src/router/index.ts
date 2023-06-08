import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { routerName, routerPath } from './type'
import Layout from '@/layout/index.vue'

const routes: Array<RouteRecordRaw> = [
    { 
        path: '/', 
        redirect: '/home' 
    },
    {
        path: '/',
        component: Layout,
        children: [
            {
                path: routerPath.Home,
                name: routerName.Home,
                component: () => import(`@/views/${routerName.Home}/index.vue`)
            },
            {
                path: routerPath.Pull,
                name: routerName.Pull,
                component: () => import(`@/views/${routerName.Pull}/index.vue`)
            },
            {
                path: routerPath.Push,
                name: routerName.Push,
                component: () => import(`@/views/${routerName.Push}/index.vue`)
            },
            {
                path: routerPath.Attend,
                name: routerName.Attend,
                component: () => import(`@/views/${routerName.Attend}/index.vue`)
            },
            {
                path: routerPath.Conference,
                name: routerName.Conference,
                component: () => import(`@/views/${routerName.Conference}/index.vue`)
            },
            {
                path: routerPath.Test,
                name: routerName.Test,
                component: () => import(`@/views/${routerName.Test}/index.vue`)
            },
        ]
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
