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

<script>
import Vue from 'vue'

export default Vue.extend({
  name: 'SchemaInput',
  props: {
    value: {
      type: [String, Number],
      default: undefined,
    },
    config: {
      type: Object,
      required: true,
    },
  },
  computed: {
    computedVisible() {
      return this.config.visible !== false
    },
    computedInputType() {
      const t = this.config.inputType
      return t === 'radio' || t === 'select' ? t : 'input'
    },
    computedOptions() {
      const opts = this.config.options
      if (Array.isArray(opts)) return opts
      return []
    },
    rules() {
      if (!this.config.required) return undefined
      const inputType = this.computedInputType
      const trigger = inputType === 'input' ? 'blur' : 'change'
      const validator = (_rule, val, callback) => {
        const empty = val === undefined || val === null || val === ''
        if (empty) callback(new Error(`请${inputType === 'input' ? '输入' : '选择'}${this.config.label}`))
        else callback()
      }
      return [{ required: true, validator, trigger }]
    },
  },
  methods: {
    onInput(e) {
      const next = e && e.target ? e.target.value : e
      this.$emit('input', next)
    },
    onRadioChange(e) {
      const next = e && e.target ? e.target.value : e
      this.$emit('input', next)
    },
    onSelectChange(val) {
      this.$emit('input', val === undefined ? '' : val)
    },
  },
})
</script>

