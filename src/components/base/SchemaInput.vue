<template>
  <a-form-model-item
    v-if="computedVisible"
    :label="config.label"
    :prop="config.key"
    :rules="rules"
  >
    <template v-if="computedInputType === 'radio' && computedOptions.length">
      <a-radio-group
        :disabled="config.disabled"
        :value="value"
        @change="onRadioChange"
      >
        <a-radio v-for="opt in computedOptions" :key="String(opt.value)" :value="opt.value">
          {{ opt.label }}
        </a-radio>
      </a-radio-group>
    </template>
    <template v-else-if="computedInputType === 'select'">
      <a-select
        :placeholder="config.placeholder || '请选择'"
        :disabled="config.disabled"
        :value="value === '' ? undefined : value"
        allowClear
        style="width: 100%"
        @change="onSelectChange"
      >
        <a-select-option
          v-for="opt in computedOptions"
          :key="String(opt.value)"
          :value="opt.value"
        >
          <span v-if="opt.description">{{ opt.label }} - {{ opt.description }}</span>
          <span v-else>{{ opt.label }}</span>
        </a-select-option>
      </a-select>
    </template>
    <template v-else>
      <a-input
        :placeholder="config.placeholder"
        :disabled="config.disabled"
        :value="value"
        @input="onInput"
      />
    </template>
  </a-form-model-item>
</template>

<script lang="ts">
import Vue from 'vue'
import type { SchemaInputConfig } from '@/renderer/schemaTypes'

export default Vue.extend({
  name: 'SchemaInput',
  props: {
    value: {
      type: [String, Number],
      default: undefined,
    },
    config: {
      type: Object as () => SchemaInputConfig & {
        inputType?: string
        options?: Array<{ label: string; value: string | number; description?: string }>
      },
      required: true,
    },
  },
  computed: {
    computedVisible(): boolean {
      return this.config.visible !== false
    },
    computedInputType(): string {
      const t = (this.config as any).inputType
      return t === 'radio' || t === 'select' ? t : 'input'
    },
    computedOptions(): Array<{ label: string; value: string | number; description?: string }> {
      const opts = (this.config as any).options
      if (Array.isArray(opts)) return opts
      return []
    },
    rules(): any[] | undefined {
      if (!this.config.required) return undefined
      const inputType = this.computedInputType
      const trigger = inputType === 'input' ? 'blur' : 'change'
      const validator = (_rule: any, val: any, callback: (err?: Error) => void) => {
        const empty = val === undefined || val === null || val === ''
        if (empty) callback(new Error(`请${inputType === 'input' ? '输入' : '选择'}${this.config.label}`))
        else callback()
      }
      return [{ required: true, validator, trigger }]
    },
  },
  methods: {
    onInput(e: any) {
      const next = e && e.target ? e.target.value : e
      this.$emit('input', next)
    },
    onRadioChange(e: any) {
      const next = e && e.target ? e.target.value : e
      this.$emit('input', next)
    },
    onSelectChange(val: any) {
      this.$emit('input', val === undefined ? '' : val)
    },
  },
})
</script>

