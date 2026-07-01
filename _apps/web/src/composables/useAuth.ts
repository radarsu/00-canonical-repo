import { createAuthClient } from "better-auth/client";
import { ref } from "vue";
import { environment } from "../environments/environment";

export type SessionUser = { id: string; email: string; name: string };

// Thin wrapper over the Better Auth browser client, exposed as a module-level singleton. baseURL is the API
// origin (the client appends the default /api/auth basePath); credentials: include so the session cookie is
// sent cross-origin.
const client = createAuthClient({
    baseURL: environment.api.url,
    fetchOptions: { credentials: `include` },
});

const user = ref<SessionUser | null>(null);

const refresh = async (): Promise<SessionUser | null> => {
    const { data } = await client.getSession();
    user.value = data?.user ? { id: data.user.id, email: data.user.email, name: data.user.name } : null;
    return user.value;
};

const signIn = async (email: string, password: string): Promise<void> => {
    const { error } = await client.signIn.email({ email, password });
    if (error) {
        throw new Error(error.message ?? `Sign-in failed`);
    }
    await refresh();
};

const signUp = async (name: string, email: string, password: string): Promise<void> => {
    const { error } = await client.signUp.email({ name, email, password });
    if (error) {
        throw new Error(error.message ?? `Sign-up failed`);
    }
    await refresh();
};

const signOut = async (): Promise<void> => {
    await client.signOut();
    user.value = null;
};

export function useAuth() {
    return { user, refresh, signIn, signUp, signOut };
}
