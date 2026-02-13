<script lang="ts" setup>
</script>

<template>
  <div class="footer">
    <div class="footer-container">
      <div class="footer-left">© 2026 void space. All rights reserved.</div>

      <div class="footer-right">
        <a href="https://github.com/ruofee" target="_blank">
          <img class="icon" src="../assets/icons/github.svg" alt="github" />
        </a>

        <a href="https://www.zhihu.com/people/chen-ruo-feng-e" target="_blank">
          <img class="icon" src="../assets/icons/zhihu.svg" alt="zhihu" />
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
      gap: 20px;

      .icon {
        width: 20px;
        height: 20px;
      }
    }
  }
}

</style>
