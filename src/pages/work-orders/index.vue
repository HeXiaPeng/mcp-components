<template>
  <SchemaRenderer v-if="runtime" :schema="schema" :runtime="runtime" />
</template>

<script lang="ts">
import Vue from 'vue'
import { initialWorkOrders, type WorkOrderItem } from './mock'
import SchemaRenderer from '@/renderer/SchemaRenderer.vue'
import schema from './pageSchema.json'
import { createSchemaRuntime } from '@/runtime/createRuntime'
import { createFetchRequestAdapter } from '@/runtime/adapters/request'
import { createMemoryDataSource } from '@/runtime/adapters/memoryDataSource'
import type { SchemaRuntime } from '@/runtime/types'

export default Vue.extend({
  name: 'WorkOrdersPage',
  components: {
    SchemaRenderer,
  },
  data() {
    return {
      schema: schema as any,
      runtime: null as SchemaRuntime | null,
    }
  },
  created() {
    const request = createFetchRequestAdapter()
    const ds = createMemoryDataSource<WorkOrderItem>({
      initialRows: initialWorkOrders,
      filter(row, filter) {
        const keyword = filter && filter.keyword ? String(filter.keyword).trim() : ''
        const status = filter && filter.status ? String(filter.status).trim() : ''
        const matchKeyword = !keyword || row.code.includes(keyword) || row.title.includes(keyword)
        const matchStatus = !status || row.status.includes(status)
        return matchKeyword && matchStatus
      },
    })

    this.runtime = createSchemaRuntime(this.schema as any, {
      request,
      dataSources: {
        workOrders: ds,
      },
      notify: {
        success: (msg) => (this as any).$message.success(msg),
        error: (msg) => (this as any).$message.error(msg),
        loading: (msg, durationSeconds) => (this as any).$message.loading(msg, durationSeconds),
        info: (title, content) => (this as any).$info({ title, content }),
      },
      onCustomAction: async ({ actionId, payload, runtime }) => {
        if (actionId === 'workOrders.openEdit') {
          const record = payload && payload.record ? payload.record : null
          runtime.setState('ui.editing', record ? { ...record } : null)
          runtime.setState('ui.editVisible', true)
          return
        }
        if (actionId === 'workOrders.applyQuery') {
          runtime.setState('ui.queryFilter', payload && payload.values ? payload.values : {})
          runtime.setState('ui.queryVisible', false)
          await runtime.dispatch({ actionId: 'workOrders.refresh' })
        }
      },
    })
  },
})
</script>

<style scoped>
</style>
