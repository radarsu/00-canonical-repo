import { Injectable, signal } from "@angular/core";
import { createAuthClient } from "better-auth/client";
import { environment } from "../../environments/environment";

export type SessionUser = { id: string; email: string; name: string };

// Thin wrapper over the Better Auth browser client. baseURL is the API origin (the client appends the
// default /api/auth basePath); credentials: include so the session cookie is sent cross-origin.
@Injectable({ providedIn: `root` })
export class AuthService {
    private readonly client = createAuthClient({
        baseURL: environment.api.url,
        fetchOptions: { credentials: `include` },
    });

    readonly user = signal<SessionUser | null>(null);

    async refresh(): Promise<SessionUser | null> {
        const { data } = await this.client.getSession();
        const user = data?.user ? { id: data.user.id, email: data.user.email, name: data.user.name } : null;
        this.user.set(user);
        return user;
    }

    async signIn(email: string, password: string): Promise<void> {
        const { error } = await this.client.signIn.email({ email, password });
        if (error) {
            throw new Error(error.message ?? `Sign-in failed`);
        }
        await this.refresh();
    }

    async signUp(name: string, email: string, password: string): Promise<void> {
        const { error } = await this.client.signUp.email({ name, email, password });
        if (error) {
            throw new Error(error.message ?? `Sign-up failed`);
        }
        await this.refresh();
    }

    async signOut(): Promise<void> {
        await this.client.signOut();
        this.user.set(null);
    }
}
