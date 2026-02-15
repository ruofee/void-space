<script lang="ts" setup>
defineProps<{
  href: string
  text: string
}>()
</script>

<template>
  <a :href="href" class="back-button">
    <img class="back-icon" src="../assets/icons/back.svg" alt="back" />
    {{ text }}
  </a>
</template>

<style lang="scss" scoped>
.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--vp-c-text-1);
  text-decoration: none;
  transition: color 0.3s ease;

  &:hover {
    color: var(--vp-c-brand-1);
  }

  .back-icon {
    width: 14px;
    height: 14px;
  }
}
</style>
