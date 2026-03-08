<template>
  <div class="not-found">
    <div class="not-found-container">
      <div class="code">404</div>
      <div class="divider"></div>
      <div class="message">页面不存在</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.not-found {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 56px - 64px - 120px);

  .not-found-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;

    .code {
      font-size: 4rem;
      font-weight: 700;
      color: var(--vp-c-text-1);
    }

    .divider {
      width: 64px;
      height: 1px;
      background-color: var(--vp-c-divider);
    }

    .message {
      font-size: 1.1rem;
      color: var(--vp-c-text-3);
    }
  }
}
</style>
