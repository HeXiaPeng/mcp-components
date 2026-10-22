<template>
  <a-modal
    :title="config.title"
    :visible="visible"
    :width="config.width || 560"
    :okText="config.submitText || '确定'"
    :cancelText="config.cancelText || '取消'"
    @ok="onOk"
    @cancel="onCancel"
  >
    <slot name="body">
      <SchemaForm ref="formRef" :value="formModel" :fields="config.fields" @input="onFormInput" />
    </slot>
    <template slot="footer">
      <slot name="footer">
        <a-button @click="onCancel">{{ config.cancelText || '取消' }}</a-button>
        <a-button type="primary" @click="onOk">{{ config.submitText || '确定' }}</a-button>
      </slot>
    </template>
  </a-modal>
</template>

<script lang="ts">
import Vue from 'vue'
import SchemaForm from '@/components/base/SchemaForm.vue'
import type { SchemaModalConfig } from '@/renderer/schemaTypes'

export default Vue.extend({
  name: 'SchemaModal',
  components: { SchemaForm },
  props: {
    visible: {
      type: Boolean,
      required: true,
    },
    config: {
      type: Object as () => SchemaModalConfig,
      required: true,
    },
    value: {
      type: Object as () => Record<string, any>,
      default: () => ({}),
    },
  },
  data() {
    return {
      formModel: {} as Record<string, any>,
    }
  },
  watch: {
    visible: {
      immediate: true,
      handler(nextVisible: boolean) {
        if (!nextVisible) return
        const nextModel: Record<string, any> = {}
        for (const f of this.config.fields || []) {
          if (Object.prototype.hasOwnProperty.call(this.value, f.key)) {
            nextModel[f.key] = this.value[f.key]
          } else if (Object.prototype.hasOwnProperty.call(f, 'defaultValue')) {
            nextModel[f.key] = (f as any).defaultValue
          } else {
            nextModel[f.key] = undefined
          }
        }
        this.formModel = nextModel
      },
    },
  },
  methods: {
    onFormInput(nextModel: Record<string, any>) {
      this.formModel = nextModel
    },
    onCancel() {
      this.$emit('update:visible', false)
      this.$emit('cancel')
    },
    onOk() {
      const form: any = this.$refs.formRef
      const validate = form && typeof form.validate === 'function' ? form.validate() : Promise.resolve(true)
      validate.then((valid: boolean) => {
        if (!valid) return
        this.$emit('submit', { ...this.formModel })
        this.$emit('update:visible', false)
      })
    },
  },
})
</script>
