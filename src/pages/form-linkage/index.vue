<template>
  <SchemaRenderer v-if="runtime" :schema="schema" :runtime="runtime" />
</template>

<script>
import Vue from 'vue'
import SchemaRenderer from '@/renderer/SchemaRenderer.vue'
import schema from './pageSchema.json'
import { createSchemaRuntime } from '@/runtime/createRuntime'
import { createFetchRequestAdapter } from '@/runtime/adapters/request'

export default Vue.extend({
  name: 'FormLinkagePage',
  components: {
    SchemaRenderer,
  },
  data() {
    return {
      schema: schema,
      runtime: null,
    }
  },
  created() {
    const request = createFetchRequestAdapter()
    this.runtime = createSchemaRuntime(this.schema, {
      request,
      dataSources: {},
      notify: {
        success: (msg) => this.$message.success(msg),
        error: (msg) => this.$message.error(msg),
        loading: (msg, durationSeconds) => this.$message.loading(msg, durationSeconds),
        info: (title, content) => this.$info({ title, content }),
      },
      onCustomAction: async ({ actionId, runtime }) => {
        if (actionId === 'formLinkage.export') {
          const text = JSON.stringify(runtime.getState('ui.form') || {}, null, 2)
          try {
            await navigator.clipboard.writeText(text)
            this.$message.success('已复制到剪贴板')
          } catch {
            this.$message.info(text)
          }
          return
        }
        if (actionId === 'formLinkage.help') {
          this.$info({
            title: '功能说明',
            content: '1) 修改“姓名”会联动生成“简称”。2) 输入用户ID后点“远程查询”，会从远程拉取并回填姓名/邮箱。3) “导出当前数据”会复制 JSON。',
          })
        }
      },
    })
  },
})
</script>

<style scoped>
</style>
