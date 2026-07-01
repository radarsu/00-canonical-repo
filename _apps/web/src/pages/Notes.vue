<script setup lang="ts">
import type { Note } from "@app_/api-contract";
import { Card, Page } from "@app_/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { apiClient } from "../composables/useApi";
import { useAuth } from "../composables/useAuth";

const router = useRouter();
const { user, signOut } = useAuth();
const queryClient = useQueryClient();
const title = ref("");

// Server state via vue-query: the query owns the list + its loading/error, mutations invalidate the key so
// the list refetches. No manual ref juggling — this is the house pattern for request/response data.
const { data: notes } = useQuery({ queryKey: [`notes`], queryFn: () => apiClient.notes.list() });

const create = useMutation({
    mutationFn: (value: string) => apiClient.notes.create({ title: value, body: `` }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`notes`] }),
});

const destroy = useMutation({
    mutationFn: (note: Note) => apiClient.notes.remove({ id: note.id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`notes`] }),
});

const add = async (): Promise<void> => {
    const value = title.value.trim();
    if (!value) {
        return;
    }
    await create.mutateAsync(value);
    title.value = ``;
};

const logout = async (): Promise<void> => {
    await signOut();
    await router.push(`/login`);
};
</script>

<template>
    <Page>
        <header class="mb-4 flex items-center justify-between">
            <h1 class="text-xl font-semibold">Notes</h1>
            <div class="flex items-center gap-3 text-sm">
                <span class="text-surface-500">{{ user?.email }}</span>
                <button type="button" class="text-primary-600 hover:underline" @click="logout">Sign out</button>
            </div>
        </header>

        <form class="mb-4 flex gap-2" @submit.prevent="add">
            <InputText v-model="title" class="flex-1" placeholder="New note title…" />
            <Button type="submit" label="Add" :loading="create.isPending.value" :disabled="!title.trim()" />
        </form>

        <div class="flex flex-col gap-2">
            <Card v-for="note in notes ?? []" :key="note.id">
                <div class="flex items-start justify-between gap-4">
                    <div>
                        <p class="font-medium">{{ note.title }}</p>
                        <p v-if="note.body" class="text-sm text-surface-500">{{ note.body }}</p>
                    </div>
                    <button type="button" class="text-sm text-red-500 hover:underline" @click="destroy.mutate(note)">Delete</button>
                </div>
            </Card>
            <Card v-if="(notes ?? []).length === 0" :dashed="true">
                <p class="text-center text-sm text-surface-500">No notes yet — add your first above.</p>
            </Card>
        </div>
    </Page>
</template>
