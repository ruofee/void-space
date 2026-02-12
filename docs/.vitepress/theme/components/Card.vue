<script lang="ts" setup>
defineProps<{
  content: string
}>()
</script>

<template>
  <div class="custom-card">
    <div class="card-content">{{ content }}</div>
  </div>
</template>

<style scoped>
.custom-card {
  padding: 1.5rem;
  margin: 1rem 0;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.card-content {
  color: white;
  font-size: 1.1rem;
  line-height: 1.6;
}
</style>
