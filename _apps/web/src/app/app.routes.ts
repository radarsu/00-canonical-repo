import type { Routes } from "@angular/router";
import { authGuard } from "./core/auth.guard";

export const APP_ROUTES: Routes = [
    {
        path: `login`,
        title: `Login`,
        loadComponent: async () => import(`./pages/login.component`).then((m) => m.LoginComponent),
    },
    {
        path: ``,
        pathMatch: `full`,
        title: `Notes`,
        canActivate: [authGuard],
        loadComponent: async () => import(`./pages/notes.component`).then((m) => m.NotesComponent),
    },
    { path: `**`, redirectTo: `` },
];
