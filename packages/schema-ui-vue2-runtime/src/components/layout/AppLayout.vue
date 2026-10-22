<template>
  <a-layout class="app-layout">
    <AppSider :items="menuItems" />
    <a-layout class="app-main">
      <a-layout-content class="app-content">
        <slot />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script>
import Vue from 'vue'
import AppSider from './AppSider.vue'
import { appMenuItems } from '../../layout/menu'

export default Vue.extend({
  name: 'AppLayout',
  components: { AppSider },
  data() {
    return {
      menuItems: appMenuItems,
    }
  },
})
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: #f5f6f8;
}
.app-content {
  padding: 16px;
}
.app-main {
  background: transparent;
}
</style>
