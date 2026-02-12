<script lang="ts" setup>
</script>

<template>
  <div class="footer">
    <div class="footer-container">
      <div class="footer-left">© 2026 void space. All rights reserved.</div>

      <div class="footer-right">
        <a href="https://github.com/ruofee" target="_blank">
          <img class="github-icon" src="../assets/icons/github.svg" alt="github" />
        </a>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.footer {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 116px;
  border-top: 1px solid var(--vp-c-divider);

  .footer-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    max-width: 1200px;

    .footer-left {
      font-size: 14px;
      color: var(--vp-c-text-3);
    }

    .footer-right {
      display: flex;
      align-items: center;

      .github-icon {
        width: 24px;
        height: 24px;
      }
    }
  }
}

</style>
