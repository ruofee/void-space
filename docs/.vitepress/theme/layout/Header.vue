<script lang="ts" setup>
import { useRoute } from 'vitepress'
import { computed } from 'vue'

const route = useRoute()

const navLinks = [
  { text: '文章', href: '/', match: (path: string) => path === '/' || path.startsWith('/article/') },
  { text: '分类', href: '/tags', match: (path: string) => path.startsWith('/tags') },
  { text: '关于我', href: '/about', match: (path: string) => path.startsWith('/about') },
]

const activePath = computed(() => route.path)
</script>

<template>
  <div class="header">
    <div class="header-container">
      <a href="/" class="logo">
        <img class="logo-icon" src="../assets/icons/logo.svg" alt="logo" />
        <span class="logo-text">Void Space</span>
      </a>

      <div class="links">
        <a
          v-for="link in navLinks"
          :key="link.href"
          :href="link.href"
          :class="['link', { active: link.match(activePath) }]"
        >
          {{ link.text }}
        </a>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  justify-content: center;
  height: 56px;
  border-bottom: 1px solid var(--vp-c-divider);
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.7);

  .header-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    max-width: 1200px;
    padding: 0 24px;

    .logo {
      display: flex;
      align-items: center;
      gap: 8px;

      .logo-icon {
        width: 24px;
        height: 24px;
      }

      .logo-text {
        font-size: 1rem;
        font-weight: 500;
        color: var(--vp-c-text-1);
      }
    }

    .links {
      display: flex;
      align-items: center;
      gap: 30px;

      .link {
        font-size: 1rem;
        font-weight: 500;
        color: var(--vp-c-text-2);
        text-decoration: none;
        transition: color 0.3s ease;

        &:hover {
          color: var(--vp-c-brand-1);
        }

        &.active {
          color: var(--vp-c-brand-1);
          font-weight: 600;
        }
      }
    }
  }
}
</style>