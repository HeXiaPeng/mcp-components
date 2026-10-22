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

<script lang="ts">
import Vue from 'vue'
import SchemaInput from '@/components/base/SchemaInput.vue'
import type { SchemaFormEffect, SchemaInputConfig } from '@/renderer/schemaTypes'
import { applyLinkage } from '@/utils/linkage'

function applyTemplate(tpl: string, value: any, model: Record<string, any>) {
  return tpl.replace(/\{value\}/g, String(value ?? '')).replace(/\{(\w+)\}/g, (_, k) => String(model[k] ?? ''))
}

export default Vue.extend({
  name: 'SchemaForm',
  components: { SchemaInput },
  props: {
    value: {
      type: Object as () => Record<string, any>,
      default: () => ({}),
    },
    fields: {
      type: Array as () => SchemaInputConfig[],
      required: true,
    },
    effects: {
      type: Array as () => SchemaFormEffect[],
      default: () => [],
    },
  },
  data() {
    return {
      innerModel: {} as Record<string, any>,
    }
  },
  computed: {
    computedFields(): SchemaInputConfig[] {
      return applyLinkage(this.fields || [], this.innerModel)
    },
    hasColLayout(): boolean {
      return (this.computedFields || []).some((f: any) => typeof (f && f.col) === 'number' || typeof (f && f.span) === 'number')
    },
  },
  watch: {
    value: {
      immediate: true,
      deep: true,
      handler(nextVal: Record<string, any>) {
        this.innerModel = { ...(nextVal || {}) }
      },
    },
  },
  methods: {
    getFieldCol(field: any): number {
      if (field && typeof field.col === 'number') return field.col
      if (field && typeof field.span === 'number') return field.span
      return 24
    },
    getFieldStyle(_field: any): Record<string, any> | undefined {
      return undefined
    },
    validate(): Promise<boolean> {
      const form: any = this.$refs.formRef
      if (!form || typeof form.validate !== 'function') return Promise.resolve(true)
      return new Promise((resolve) => {
        form.validate((valid: boolean) => resolve(valid))
      })
    },
    setFieldsValue(partial: Record<string, any>) {
      this.innerModel = { ...this.innerModel, ...partial }
      this.$emit('input', { ...this.innerModel })
    },
    resetFields() {
      const form: any = this.$refs.formRef
      if (form && typeof form.resetFields === 'function') form.resetFields()
      this.innerModel = {}
      this.$emit('input', {})
    },
    onFieldInput(key: string, value: any) {
      this.innerModel = { ...this.innerModel, [key]: value }
      this.runEffects(key, value)
      this.$emit('input', { ...this.innerModel })
    },
    runEffects(key: string, value: any) {
      const matched = (this.effects || []).filter((e) => e.on === key)
      if (matched.length === 0) return

      const nextPatch: Record<string, any> = {}
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

