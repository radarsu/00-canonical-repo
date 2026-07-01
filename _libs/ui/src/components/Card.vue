<!-- Surface card primitive. Replaces the repeated `rounded-xl border bg-surface-0 p-4` literal; the
     styling lives in the `.ui-card` class (styles/shared/components.css). Set `dashed` for the empty state. -->
<script setup lang="ts">
const { dashed = false } = defineProps<{ dashed?: boolean }>();
</script>

<template>
    <div class="ui-card" :class="{ 'ui-card-dashed': dashed }">
        <slot />
    </div>
</template>
