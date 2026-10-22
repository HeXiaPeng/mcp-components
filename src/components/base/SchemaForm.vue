<template>
  <a-form-model ref="formRef" :model="innerModel" layout="vertical">
    <a-row v-if="hasColLayout" :gutter="16">
      <template v-for="field in computedFields">
        <a-col
          :key="field.key"
          :span="getFieldCol(field)"
          :style="getFieldStyle(field)"
        >
          <SchemaInput
            :value="innerModel[field.key]"
            :config="field"
            @input="(v) => onFieldInput(field.key, v)"
          />
        </a-col>
      </template>
    </a-row>
    <template v-else>
      <SchemaInput
        v-for="field in computedFields"
        :key="field.key"
        :value="innerModel[field.key]"
        :config="field"
        @input="(v) => onFieldInput(field.key, v)"
      />
    </template>
    <slot />
  </a-form-model>
</template>

<script>
import Vue from 'vue'
import SchemaInput from '@/components/base/SchemaInput.vue'
import { applyLinkage } from '@/utils/linkage'

function applyTemplate(tpl, value, model) {
  return tpl.replace(/\{value\}/g, String(value ?? '')).replace(/\{(\w+)\}/g, (_, k) => String(model[k] ?? ''))
}

export default Vue.extend({
  name: 'SchemaForm',
  components: { SchemaInput },
  props: {
    value: {
      type: Object,
      default: () => ({}),
    },
    fields: {
      type: Array,
      required: true,
    },
    effects: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      innerModel: {},
    }
  },
  computed: {
    computedFields() {
      return applyLinkage(this.fields || [], this.innerModel)
    },
    hasColLayout() {
      return (this.computedFields || []).some((f) => typeof (f && f.col) === 'number' || typeof (f && f.span) === 'number')
    },
  },
  watch: {
    value: {
      immediate: true,
      deep: true,
      handler(nextVal) {
        this.innerModel = { ...(nextVal || {}) }
      },
    },
  },
  methods: {
    getFieldCol(field) {
      if (field && typeof field.col === 'number') return field.col
      if (field && typeof field.span === 'number') return field.span
      return 24
    },
    getFieldStyle(_field) {
      return undefined
    },
    validate() {
      const form = this.$refs.formRef
      if (!form || typeof form.validate !== 'function') return Promise.resolve(true)
      return new Promise((resolve) => {
        form.validate((valid) => resolve(valid))
      })
    },
    setFieldsValue(partial) {
      this.innerModel = { ...this.innerModel, ...partial }
      this.$emit('input', { ...this.innerModel })
    },
    resetFields() {
      const form = this.$refs.formRef
      if (form && typeof form.resetFields === 'function') form.resetFields()
      this.innerModel = {}
      this.$emit('input', {})
    },
    onFieldInput(key, value) {
      this.innerModel = { ...this.innerModel, [key]: value }
      this.runEffects(key, value)
      this.$emit('input', { ...this.innerModel })
    },
    runEffects(key, value) {
      const matched = (this.effects || []).filter((e) => e.on === key)
      if (matched.length === 0) return

      const nextPatch = {}
      for (const eff of matched) {
        if (eff.type === 'mirror') {
          nextPatch[eff.target] = value
          continue
        }
        if (eff.type === 'template' && eff.template) {
          nextPatch[eff.target] = applyTemplate(eff.template, value, this.innerModel)
        }
      }
      this.innerModel = { ...this.innerModel, ...nextPatch }
    },
  },
})
</script>

