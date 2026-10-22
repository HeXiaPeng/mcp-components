<template>
  <SchemaRenderer v-if="runtime" :schema="schema" :runtime="runtime" />
</template>

<script>
import Vue from 'vue'
import { initialMcpServers } from './mock'
import SchemaRenderer from '@/renderer/SchemaRenderer.vue'
import schema from './pageSchema.json'
import { createSchemaRuntime } from '@/runtime/createRuntime'
import { createFetchRequestAdapter } from '@/runtime/adapters/request'
import { createMemoryDataSource } from '@/runtime/adapters/memoryDataSource'

function formatNow() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default Vue.extend({
  name: 'McpServersPage',
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
    const ds = createMemoryDataSource({
      initialRows: initialMcpServers,
      filter(row, filter) {
        const keyword = filter && filter.keyword ? String(filter.keyword).trim() : ''
        const status = filter && filter.status ? String(filter.status).trim() : ''
        const matchKeyword =
          !keyword ||
          row.name.includes(keyword) ||
          row.command.includes(keyword) ||
          row.args.includes(keyword)
        const matchStatus = !status || row.status === status
        return matchKeyword && matchStatus
      },
    })

    this.runtime = createSchemaRuntime(this.schema, {
      request,
      dataSources: {
        mcpServers: ds,
      },
      notify: {
        success: (msg) => this.$message.success(msg),
        error: (msg) => this.$message.error(msg),
        loading: (msg, durationSeconds) => this.$message.loading(msg, durationSeconds),
        info: (title, content) => this.$info({ title, content }),
      },
      onCustomAction: async ({ actionId, payload, runtime }) => {
        if (actionId === 'mcpServers.openEdit') {
          const record = payload && payload.record ? payload.record : null
          runtime.setState('ui.editing', record ? { ...record } : null)
          runtime.setState('ui.editVisible', true)
          return
        }
        if (actionId === 'mcpServers.applyQuery') {
          runtime.setState('ui.queryFilter', payload && payload.values ? payload.values : {})
          runtime.setState('ui.queryVisible', false)
          await runtime.dispatch({ actionId: 'mcpServers.refresh' })
          return
        }
        if (actionId === 'mcpServers.submitCreate') {
          const values = payload && payload.values ? payload.values : (payload || {})
          const now = formatNow()
          const seq = String(Date.now()).slice(-3)
          const fullValues = {
            ...values,
            id: `MCP-${seq}`,
            status: 'stopped',
            toolsCount: 0,
            createdAt: now,
            lastUsedAt: now,
            description: values.description || '',
          }
          await ds.create({ values: fullValues })
          runtime.notify.success('新增 MCP 服务器成功')
          runtime.setState('ui.createVisible', false)
          await runtime.dispatch({ actionId: 'mcpServers.refresh' })
          return
        }
        if (actionId === 'mcpServers.submitEdit') {
          const values = payload && payload.values ? payload.values : (payload || {})
          const record = runtime.getState('ui.editing')
          const id = record && record.id ? String(record.id) : ''
          if (!id) {
            runtime.notify.error('编辑缺少记录 id')
            return
          }
          await ds.update({ id, values: { ...values, lastUsedAt: formatNow() } })
          runtime.notify.success('更新成功')
          runtime.setState('ui.editing', null)
          runtime.setState('ui.editVisible', false)
          await runtime.dispatch({ actionId: 'mcpServers.refresh' })
          return
        }
        if (actionId === 'mcpServers.toggleStatus') {
          const record = payload && payload.record ? payload.record : null
          if (!record) return
          const nextStatus =
            record.status === 'running' ? 'stopped' : record.status === 'stopped' ? 'running' : 'stopped'
          await ds.update({
            id: record.id,
            values: { status: nextStatus, lastUsedAt: formatNow() },
          })
          runtime.notify.success(nextStatus === 'running' ? '服务器已启动' : '服务器已停止')
          await runtime.dispatch({ actionId: 'mcpServers.refresh' })
          return
        }
        if (actionId === 'mcpServers.restart') {
          const record = payload && payload.record ? payload.record : null
          if (!record) return
          await ds.update({
            id: record.id,
            values: { status: 'running', lastUsedAt: formatNow() },
          })
          runtime.notify.success('服务器已重启')
          await runtime.dispatch({ actionId: 'mcpServers.refresh' })
          return
        }
      },
    })
  },
})
</script>

<style scoped>
</style>
