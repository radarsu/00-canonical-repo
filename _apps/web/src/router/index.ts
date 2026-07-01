import { createRouter, createWebHistory, type RouteLocationRaw, type RouteRecordRaw } from "vue-router";
import { useAuth } from "../composables/useAuth";

declare module "vue-router" {
    interface RouteMeta {
        title?: string;
    }
}

// Gate the protected route on a live session: resolve it once (Better Auth cookie) and redirect to /login
// when there's none.
const requireAuth = async (): Promise<boolean | RouteLocationRaw> => {
    const { user, refresh } = useAuth();
    const current = user.value ?? (await refresh());
    return current ? true : `/login`;
};

const routes: RouteRecordRaw[] = [
    {
        path: `/login`,
        name: `login`,
        meta: { title: `Login` },
        component: () => import(`../pages/Login.vue`),
    },
    {
        path: `/`,
        name: `notes`,
        meta: { title: `Notes` },
        beforeEnter: requireAuth,
        component: () => import(`../pages/Notes.vue`),
    },
    { path: `/:pathMatch(.*)*`, redirect: `/` },
];

export const router = createRouter({
    history: createWebHistory(),
    routes,
});

// Mirror each route's `title` into the browser tab.
router.afterEach((to) => {
    document.title = to.meta.title ? `${to.meta.title} · Canonical Repo` : `Canonical Repo`;
});
