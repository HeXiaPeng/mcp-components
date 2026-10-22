<template>
  <AppLayout>
    <router-view />
  </AppLayout>
</template>

<script lang="ts">
import Vue from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'

export default Vue.extend({
  name: 'App',
  components: { AppLayout },
})
</script>
