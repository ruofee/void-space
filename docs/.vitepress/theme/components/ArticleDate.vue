<script lang="ts" setup>
const props = defineProps<{
  date: string
  time: string
}>()
</script>

<template>
  <div class="article_date">
    <div class="item">
      <img class="icon" src="../assets/icons/date.svg" alt="calendar" />
      {{ props.date }}
    </div>

    <div class="item">
      <img class="icon" src="../assets/icons/time.svg" alt="calendar" />
      {{ props.time }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.article_date {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 0.8rem;

  .icon {
    width: 14px;
    height: 14px;
  }

  .item {
    display: flex;
    align-items: center;
    gap: 6px;
  }
}
</style>
