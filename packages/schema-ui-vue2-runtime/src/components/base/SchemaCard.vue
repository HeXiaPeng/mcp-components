<template>
  <a-card
    class="schema-card"
    :bordered="config.bordered !== false"
    :hoverable="Boolean(config.hoverable)"
  >
    <template v-if="hasTitle" slot="title">
      <slot name="title">{{ config.title }}</slot>
    </template>
    <template v-if="hasExtra" slot="extra">
      <slot name="extra">
        <a @click="onExtraClick">{{ config.extraText }}</a>
      </slot>
    </template>

    <slot />

    <div v-if="$slots.footer" class="schema-card__footer">
      <slot name="footer" />
    </div>
  </a-card>
</template>

<script>
import Vue from 'vue'

export default Vue.extend({
  name: 'SchemaCard',
  props: {
    config: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    hasTitle() {
      return Boolean(this.config.title) || Boolean(this.$slots.title)
    },
    hasExtra() {
      return Boolean(this.config.extraText) || Boolean(this.$slots.extra)
    },
  },
  methods: {
    onExtraClick() {
      this.$emit('extra-click', this.config)
    },
  },
})
</script>

<style scoped>
.schema-card ::v-deep .ant-card-head {
  min-height: 0;
  padding: 0 24px;
  background-color: #003366;
  color: #ffffff;
}

.schema-card ::v-deep .ant-card-head-title,
.schema-card ::v-deep .ant-card-extra {
  padding-top: 0;
  padding-bottom: 0;
}

.schema-card__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}
</style>
