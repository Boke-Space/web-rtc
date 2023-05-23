import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { ComponentName, ComponentPath } from './type'
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
                path: ComponentPath.Home,
                name: ComponentName.Home,
                component: () => import(`@/views/${ComponentName.Home}/index.vue`)
            },
            {
                path: ComponentPath.Pull,
                name: ComponentPath.Pull,
                component: () => import(`@/views/${ComponentName.Pull}/index.vue`)
            },
            {
                path: ComponentPath.Push,
                name: ComponentPath.Push,
                component: () => import(`@/views/${ComponentName.Push}/index.vue`)
            }
        ]
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
