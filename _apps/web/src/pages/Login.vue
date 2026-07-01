<script setup lang="ts">
import { Card, Page } from "@app_/ui";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../composables/useAuth";

const router = useRouter();
const { signIn, signUp } = useAuth();

const mode = ref<"signin" | "signup">("signin");
const busy = ref(false);
const error = ref("");
const name = ref("");
const email = ref("");
const password = ref("");

const toggle = (): void => {
    mode.value = mode.value === "signin" ? "signup" : "signin";
    error.value = "";
};

const submit = async (): Promise<void> => {
    busy.value = true;
    error.value = "";
    try {
        if (mode.value === "signin") {
            await signIn(email.value, password.value);
        } else {
            await signUp(name.value, email.value, password.value);
        }
        await router.push("/");
    } catch (caught) {
        error.value = caught instanceof Error ? caught.message : "Something went wrong";
    } finally {
        busy.value = false;
    }
};
</script>

<template>
    <Page>
        <Card>
            <h1 class="mb-4 text-xl font-semibold">{{ mode === "signin" ? "Sign in" : "Create account" }}</h1>
            <form class="flex flex-col gap-3" @submit.prevent="submit">
                <InputText v-if="mode === 'signup'" v-model="name" placeholder="Name" autocomplete="name" />
                <InputText v-model="email" type="email" placeholder="Email" autocomplete="email" />
                <InputText v-model="password" type="password" placeholder="Password" autocomplete="current-password" />
                <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
                <Button type="submit" :label="mode === 'signin' ? 'Sign in' : 'Sign up'" :loading="busy" />
            </form>
            <button type="button" class="mt-3 text-sm text-primary-600 hover:underline" @click="toggle">
                {{ mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in" }}
            </button>
        </Card>
    </Page>
</template>
