<template>
    <h1>This is a Sample plugin for Obsidian</h1>
    <h2>Hello, {{ name }}!</h2>
    <TSX :name="name" />
    <SFC :name="name" />
    <Func />
    <button @click="handleClick">Click me {{ count }}</button>
</template>

<script setup lang="tsx">
import TSX from "./TsxChild";
import SFC from "./SfcChild.vue";
import { inject, ref } from "vue";
const name = inject<string>("name")!;

const Func = () => <h1>Hello, {name} (from function tsx child)</h1>;
let count = ref(0);
const handleClick = () => {
    count.value++;
};
</script>

<style scoped>
h2 {
    color: lightcoral;
}
</style>
