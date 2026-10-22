<template>
  <a-button :type="config.type || 'default'" :danger="config.danger" @click="onClick">
    <slot>{{ config.text }}</slot>
  </a-button>
</template>

<script lang="ts">
import Vue from 'vue'
import type { SchemaButtonConfig } from '../../renderer/schemaTypes'

export default Vue.extend({
  name: 'SchemaButton',
  props: {
    config: {
      type: Object as () => SchemaButtonConfig,
      required: true,
    },
  },
  methods: {
    onClick() {
      this.$emit('click', this.config)
    },
  },
})
</script>

