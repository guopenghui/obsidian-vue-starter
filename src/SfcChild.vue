<template>
    <h2>Hello, {{ name }} (from sfc child)</h2>
</template>

<script setup lang="ts">
defineProps<{
    name: string;
}>();
</script>

<style></style>
