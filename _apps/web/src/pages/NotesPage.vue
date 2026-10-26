<script setup lang="ts">
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { ref } from "vue";
import { api } from "../lib/api";

const NOTES = [`notes`];

const queryClient = useQueryClient();
const refresh = () => queryClient.invalidateQueries({ queryKey: NOTES });

const { data: notes, isPending, error } = useQuery({ queryKey: NOTES, queryFn: () => api.notes.list() });

const draft = ref(``);
const { mutate: create, isPending: creating } = useMutation({
    mutationFn: (text: string) => api.notes.create({ text }),
    onSuccess: async () => {
        draft.value = ``;
        await refresh();
    },
});
const { mutate: remove } = useMutation({ mutationFn: (id: string) => api.notes.remove({ id }), onSuccess: refresh });

// One request per Enter: a second press while the first is in flight would add the note twice.
const submit = () => {
    if (draft.value.trim() === `` || creating.value) {
        return;
    }
    create(draft.value);
};
</script>

<template>
    <h1>Notes</h1>
    <form class="compose" @submit.prevent="submit">
        <input v-model="draft" placeholder="Write a note" maxlength="500" />
        <button type="submit" :disabled="creating">Add</button>
    </form>
    <p v-if="isPending">Loading…</p>
    <p v-else-if="error" class="error">{{ error.message }}</p>
    <ul v-else class="notes">
        <li v-for="note in notes" :key="note.id">
            <span>{{ note.text }}</span>
            <time :datetime="note.createdAt">{{ new Date(note.createdAt).toLocaleString() }}</time>
            <button type="button" @click="remove(note.id)">Delete</button>
        </li>
    </ul>
</template>
