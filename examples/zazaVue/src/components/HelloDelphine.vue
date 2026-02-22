<script setup lang="ts">
defineProps<{
  message: string
}>()
</script>

<template>
  <div style="border:1px solid #ccc; padding:8px">
    👋 {{ message }}
  </div>
</template>
