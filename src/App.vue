<script setup lang="ts">
import HelloWorld from './components/HelloWorld.vue'

console.log("[App.vue]", `Hello world from Electron ${process.versions.electron}!`)
</script>

<template>

</template>

<style>
.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
