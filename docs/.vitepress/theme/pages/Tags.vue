<script lang="ts" setup>
import { data } from '../composables/articles.data'

import PageTitle from '../components/PageTitle.vue';

const tags = data?.tags || []
</script>

<template>
  <div class="tags">
    <div class="tags-container">
      <PageTitle title="分类" :description="`共 ${tags.length} 个分类`" />

      <div class="tags-list">
        <a :href="`/tags/${tag.name}`" v-for="tag in tags" :key="tag">
          <div class="tag">
            <div class="tag-container">
              <div class="name">{{ tag.name }}</div>
              <div class="count">共 {{ tag.count }} 篇文章</div>
            </div>
          </div>
        </a>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.tags {
  display: flex;
  justify-content: center;
}

.tags-container {
  width: 100%;
  max-width: 1000px;

  .tags-list {
    display: grid;
    grid-template-columns: repeat(4, minmax(160px, 1fr));
    gap: 24px;
    margin-top: 64px;

    .tag {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 0 20px;
      border-radius: 4px;
      background-color: var(--vp-c-bg-soft);
      transition: background-color 0.3s ease;
      cursor: pointer;

      &:hover {
        background-color: var(--vp-c-brand-soft);
      }

      .tag-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 220px;
        height: 50px;

        .name {
          font-size: 1rem;
          font-weight: 500;
          color: var(--vp-c-text-1);
        }

        .count {
          font-size: 0.8rem;
          color: var(--vp-c-text-3);
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .tags {
    .tags-container {
      max-width: 100%;

      .tags-list {
        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));

        .tag {
          .count {
            display: none;
          }
        }
      }
    }
  }
}
</style>
