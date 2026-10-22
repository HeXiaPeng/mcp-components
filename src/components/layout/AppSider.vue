<template>
  <a-layout-sider width="220" theme="light" class="app-sider">
    <div class="app-brand">工单系统</div>
    <a-menu mode="inline" :selectedKeys="selectedKeys" @click="onMenuClick">
      <a-menu-item v-for="item in items" :key="item.key">
        {{ item.label }}
      </a-menu-item>
    </a-menu>
  </a-layout-sider>
</template>

<script lang="ts">
import Vue from 'vue'
import type { AppMenuItem } from '@/layout/menu'

export default Vue.extend({
  name: 'AppSider',
  props: {
    items: {
      type: Array as () => AppMenuItem[],
      required: true,
    },
  },
  computed: {
    selectedKeys(): string[] {
      return [this.$route.path]
    },
  },
  methods: {
    onMenuClick(info: any) {
      if (info && info.key && info.key !== this.$route.path) {
        this.$router.push(info.key)
      }
    },
  },
})
</script>

<style scoped>
.app-sider {
  border-right: 1px solid #f0f0f0;
}
.app-brand {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  font-weight: 600;
  color: #1f1f1f;
  letter-spacing: 0.5px;
}
</style>

