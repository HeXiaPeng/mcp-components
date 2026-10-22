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

<script>
import Vue from 'vue'

export default Vue.extend({
  name: 'AppSider',
  props: {
    items: {
      type: Array,
      required: true,
    },
  },
  computed: {
    selectedKeys() {
      return [this.$route.path]
    },
  },
  methods: {
    onMenuClick(info) {
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

