<template>
  <SchemaRenderer v-if="runtime" :schema="schema" :runtime="runtime">
    <template #table-toolbarLeft-booksTable>
      <div style="color:#595959;font-size:12px;">
        💡 本页所有组件 & 运行时均来自本地源码
        <code style="background:#f0f5ff;padding:2px 6px;border-radius:4px;color:#1677ff;">
          @/components + @/renderer + @/runtime
        </code>
        相对路径引用
      </div>
    </template>
  </SchemaRenderer>
</template>

<script>
import Vue from 'vue'
import { initialBooks } from './mock'
import schema from './pageSchema.json'

import SchemaRenderer from '@/renderer/SchemaRenderer.vue'
import { createSchemaRuntime } from '@/runtime/createRuntime'
import { createFetchRequestAdapter } from '@/runtime/adapters/request'
import { createMemoryDataSource } from '@/runtime/adapters/memoryDataSource'

function todayStr() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default Vue.extend({
  name: 'RuntimeDemoPage',
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
      initialRows: initialBooks,
      filter(row, filter) {
        const keyword = filter && filter.keyword ? String(filter.keyword).trim() : ''
        const category = filter && filter.category ? String(filter.category).trim() : ''
        const inStockRaw = filter && typeof filter.inStock !== 'undefined' ? filter.inStock : ''
        const matchKeyword =
          !keyword || row.title.includes(keyword) || row.author.includes(keyword)
        const matchCategory = !category || row.category === category
        const matchStock = inStockRaw === '' || inStockRaw === null || row.inStock === !!inStockRaw
        return matchKeyword && matchCategory && matchStock
      },
    })

    this.runtime = createSchemaRuntime(this.schema, {
      request,
      dataSources: {
        books: ds,
      },
      notify: {
        success: (msg) => this.$message.success(msg),
        error: (msg) => this.$message.error(msg),
        loading: (msg, durationSeconds) => this.$message.loading(msg, durationSeconds),
        info: (title, content) => this.$info({ title, content }),
      },
      onCustomAction: async ({ actionId, payload, runtime }) => {
        if (actionId === 'books.openEdit') {
          const record = payload && payload.record ? payload.record : null
          runtime.setState('ui.editing', record ? { ...record } : null)
          runtime.setState('ui.editVisible', true)
          return
        }
        if (actionId === 'books.applyQuery') {
          runtime.setState(
            'ui.queryFilter',
            payload && payload.values ? { ...payload.values } : {},
          )
          runtime.setState('ui.queryVisible', false)
          await runtime.dispatch({ actionId: 'books.refresh' })
          return
        }
        if (actionId === 'books.submitCreate') {
          const values = payload && payload.values ? payload.values : payload || {}
          const seq = String(Date.now()).slice(-3)
          const fullValues = {
            id: `BK-${seq}`,
            title: values.title || '',
            author: values.author || '',
            category: values.category || '技术',
            price: Number(values.price) || 0,
            inStock: typeof values.inStock === 'boolean' ? values.inStock : true,
            publishedAt: values.publishedAt || todayStr(),
            description: values.description || '',
          }
          await ds.create({ values: fullValues })
          runtime.notify.success('新增图书成功 ✅')
          runtime.setState('ui.createVisible', false)
          await runtime.dispatch({ actionId: 'books.refresh' })
          return
        }
        if (actionId === 'books.submitEdit') {
          const values = payload && payload.values ? payload.values : payload || {}
          const record = runtime.getState('ui.editing')
          const id = record && record.id ? String(record.id) : ''
          if (!id) {
            runtime.notify.error('编辑缺少记录 id')
            return
          }
          await ds.update({
            id,
            values: {
              title: values.title,
              author: values.author,
              category: values.category,
              price: Number(values.price),
              inStock: typeof values.inStock === 'boolean' ? values.inStock : values.inStock === '' ? record.inStock : !!values.inStock,
              publishedAt: values.publishedAt,
              description: values.description,
            },
          })
          runtime.notify.success('更新图书成功 ✏️')
          runtime.setState('ui.editing', null)
          runtime.setState('ui.editVisible', false)
          await runtime.dispatch({ actionId: 'books.refresh' })
          return
        }
        if (actionId === 'books.toggleStock') {
          const record = payload && payload.record ? payload.record : null
          if (!record) return
          const next = !record.inStock
          await ds.update({ id: record.id, values: { inStock: next } })
          runtime.notify.success(next ? '已标记为有货 📦' : '已标记为缺货 ❌')
          await runtime.dispatch({ actionId: 'books.refresh' })
          return
        }
      },
    })
  },
})
</script>

<style scoped>
</style>
