import { inject } from "@angular/core";
import { type CanActivateFn, Router } from "@angular/router";
import { AuthService } from "./auth.service";

// Gate protected routes on a live session. Resolves the session once (Better Auth cookie) and redirects to
// /login when there's none.
export const authGuard: CanActivateFn = async () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    const user = auth.user() ?? (await auth.refresh());
    return user ? true : router.createUrlTree([`/login`]);
};
