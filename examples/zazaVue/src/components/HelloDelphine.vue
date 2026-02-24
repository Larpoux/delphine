<script setup lang="ts">
defineProps<{
  message: string
}>()
</script>

<template>
  <div style="border: 1px solid #ccc; padding: 8px">
    <h2>VueJS</h2>
    👋 {{ message }}
  </div>
</template>
