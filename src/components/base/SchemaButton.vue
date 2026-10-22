<template>
  <a-button :type="config.type || 'default'" :danger="config.danger" @click="onClick">
    <slot>{{ config.text }}</slot>
  </a-button>
</template>

<script>
import Vue from 'vue'

export default Vue.extend({
  name: 'SchemaButton',
  props: {
    config: {
      type: Object,
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

