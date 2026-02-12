<script lang="ts" setup>
</script>

<template>
  <div class="header">
    <div class="header-container">
      <a href="/" class="logo">
        <img class="logo-icon" src="../assets/icons/logo.svg" alt="logo" />
        <span class="logo-text">Void Space</span>
      </a>

      <div class="links">
        <a href="/" class="link">文章</a>
        <a href="/tags" class="link">分类</a>
        <a href="/about" class="link">关于我</a>
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

    .logo {
      display: flex;
      align-items: center;
      gap: 8px;

      .logo-icon {
        width: 24px;
        height: 24px;
      }

      .logo-text {
        font-size: 16px;
        font-weight: 500;
        color: var(--vp-c-text-1);
      }
    }

    .links {
      display: flex;
      align-items: center;
      gap: 30px;

      .link {
        font-size: 14px;
        font-weight: 500;
        color: var(--vp-c-text-1);
        text-decoration: none;
        transition: color 0.3s ease;

        &:hover {
          color: var(--vp-c-brand-1);
        }
      }
    }
  }
}
</style>