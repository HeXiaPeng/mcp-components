<template>
  <div class="card-demo-page">
    <SchemaCard :config="filterCardConfig">
      <SchemaForm
        ref="filterForm"
        :value="query"
        :fields="filterFields"
        @input="onQueryInput"
      />
      <template #footer>
        <a-button @click="onReset">重置</a-button>
        <a-button type="primary" :loading="loading" @click="onSearch">查询</a-button>
      </template>
    </SchemaCard>

    <SchemaCard
      class="card-demo-page__table"
      :config="tableCardConfig"
      @extra-click="onSearch"
    >
      <SchemaTable
        :columns="columns"
        :dataSource="filteredRows"
        :loading="loading"
        :rowRightButtons="rowButtons"
        @button-click="onTableButtonClick"
      />
    </SchemaCard>
  </div>
</template>

<script>
import Vue from 'vue'
import {
  SchemaCard,
  SchemaForm,
  SchemaTable,
} from 'schema-ui-vue2-runtime'
import { initialWorkOrders } from './mock'

const filterFields = [
  { key: 'code', label: '工单号', placeholder: '请输入工单号', col: 6 },
  { key: 'title', label: '标题', placeholder: '请输入标题关键字', col: 6 },
  {
    key: 'status',
    label: '状态',
    inputType: 'select',
    placeholder: '请选择状态',
    col: 6,
    options: [
      { label: '待处理', value: '待处理' },
      { label: '处理中', value: '处理中' },
      { label: '已完成', value: '已完成' },
    ],
  },
  { key: 'owner', label: '处理人', placeholder: '请输入处理人', col: 6 },
]

const columns = [
  { key: 'code', title: '工单号', dataIndex: 'code', width: 150, link: true },
  { key: 'title', title: '标题', dataIndex: 'title', width: 260 },
  { key: 'status', title: '状态', dataIndex: 'status', width: 120 },
  { key: 'owner', title: '处理人', dataIndex: 'owner', width: 120 },
  { key: 'createdAt', title: '创建时间', dataIndex: 'createdAt', width: 170 },
]

const rowButtons = [
  { key: 'detail', text: '查看', type: 'link', placement: 'rowRight', action: 'order.detail' },
]

export default Vue.extend({
  name: 'CardDemoPage',
  components: { SchemaCard, SchemaForm, SchemaTable },
  data() {
    return {
      filterFields,
      columns,
      rowButtons,
      query: {},
      activeQuery: {},
      loading: false,
    }
  },
  computed: {
    filterCardConfig() {
      return { title: '筛选条件' }
    },
    tableCardConfig() {
      return { title: `工单列表` }
    },
    filteredRows() {
      const q = this.activeQuery
      const code = String(q.code || '').trim()
      const title = String(q.title || '').trim()
      const status = String(q.status || '')
      const owner = String(q.owner || '').trim()
      return initialWorkOrders.filter(
        (row) =>
          (!code || row.code.includes(code)) &&
          (!title || row.title.includes(title)) &&
          (!status || row.status === status) &&
          (!owner || row.owner.includes(owner)),
      )
    },
  },
  methods: {
    onQueryInput(values) {
      this.query = { ...values }
    },
    onSearch() {
      this.loading = true
      window.setTimeout(() => {
        this.activeQuery = { ...this.query }
        this.loading = false
        const message = this.$message
        message.success(`查询完成，共 ${this.filteredRows.length} 条`)
      }, 300)
    },
    onReset() {
      const form = this.$refs.filterForm
      if (form && typeof form.resetFields === 'function') form.resetFields()
      this.query = {}
      this.activeQuery = {}
    },
    onTableButtonClick(payload) {
      if (payload.button.action === 'order.detail') {
        const message = this.$message
        message.info(`查看工单 ${payload.record.code}：${payload.record.title}`)
      }
    },
  },
})
</script>

<style scoped>
.card-demo-page__table {
  margin-top: 16px;
}


</style>
