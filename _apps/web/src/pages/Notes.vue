<script setup lang="ts">
import type { Note } from "@app_/api-contract";
import { Card, Page } from "@app_/ui";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { apiClient } from "../composables/useApi";
import { useAuth } from "../composables/useAuth";

const router = useRouter();
const { user, signOut } = useAuth();

const notes = ref<Note[]>([]);
const busy = ref(false);
const title = ref("");

onMounted(async () => {
    notes.value = await apiClient.notes.list();
});

const add = async (): Promise<void> => {
    const value = title.value.trim();
    if (!value) {
        return;
    }
    busy.value = true;
    try {
        const note = await apiClient.notes.create({ title: value, body: "" });
        notes.value = [note, ...notes.value];
        title.value = "";
    } finally {
        busy.value = false;
    }
};

const remove = async (note: Note): Promise<void> => {
    await apiClient.notes.remove({ id: note.id });
    notes.value = notes.value.filter((current) => current.id !== note.id);
};

const logout = async (): Promise<void> => {
    await signOut();
    await router.push("/login");
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
            <Button type="submit" label="Add" :loading="busy" :disabled="!title.trim()" />
        </form>

        <div class="flex flex-col gap-2">
            <Card v-for="note in notes" :key="note.id">
                <div class="flex items-start justify-between gap-4">
                    <div>
                        <p class="font-medium">{{ note.title }}</p>
                        <p v-if="note.body" class="text-sm text-surface-500">{{ note.body }}</p>
                    </div>
                    <button type="button" class="text-sm text-red-500 hover:underline" @click="remove(note)">Delete</button>
                </div>
            </Card>
            <Card v-if="notes.length === 0" :dashed="true">
                <p class="text-center text-sm text-surface-500">No notes yet — add your first above.</p>
            </Card>
        </div>
    </Page>
</template>
