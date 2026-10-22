<template>
  <div class="schema-table">
    <div class="schema-table__toolbar">
      <div class="schema-table__toolbar-left">
        <slot name="toolbarLeft" />
      </div>
      <div class="schema-table__toolbar-right">
        <slot name="toolbarRight">
          <a-space>
            <SchemaButton
              v-for="btn in topRightButtons"
              :key="btn.key"
              :config="btn"
              @click="onTopButtonClick"
            />
          </a-space>
        </slot>
      </div>
    </div>

    <a-table
      bordered
      :columns="antdColumns"
      :dataSource="dataSource"
      :loading="loading"
      :rowKey="rowKey"
      :pagination="false"
      :scroll="{ x: 'max-content' }"
      :rowSelection="computedRowSelection"
      @change="onTableChange"
    />
  </div>
</template>

<script>
import Vue from 'vue'
import SchemaButton from '@/components/base/SchemaButton.vue'

export default Vue.extend({
  name: 'SchemaTable',
  components: { SchemaButton },
  props: {
    columns: {
      type: Array,
      required: true,
    },
    dataSource: {
      type: Array,
      required: true,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    rowKey: {
      type: String,
      default: 'id',
    },
    topRightButtons: {
      type: Array,
      default: () => [],
    },
    rowRightButtons: {
      type: Array,
      default: () => [],
    },
    enableSelection: {
      type: Boolean,
      default: false,
    },
    selectedRowKeys: {
      type: Array,
      default: () => [],
    },
  },
  computed: {
    antdColumns() {
      const base = this.columns.map((c) => ({
        title: c.title,
        dataIndex: c.dataIndex,
        key: c.key,
        width: c.width,
      }))
      return [
        ...base,
        {
          title: '操作',
          key: 'actions',
          width: 160,
          fixed: 'right',
          customRender: (_text, record) => this.renderRowActions(record),
        },
      ]
    },
    computedRowSelection() {
      if (!this.enableSelection) return null
      return {
        selectedRowKeys: this.selectedRowKeys || [],
        onChange: (keys) => {
          this.$emit('update:selectedRowKeys', keys)
          this.$emit('selection-change', { keys, rows: this.selectedRows(keys) })
        },
      }
    },
  },
  methods: {
    selectedRows(keys) {
      const keySet = new Set(keys)
      return (this.dataSource || []).filter((r) => keySet.has(r && r[this.rowKey]))
    },
    onTopButtonClick(btn) {
      this.$emit('button-click', { button: btn })
    },
    onRowButtonClick(btn, record) {
      this.$emit('button-click', { button: btn, record })
    },
    onCellLinkClick(column, record) {
      this.$emit('cell-link-click', {
        column,
        record,
        value: record ? record[column.dataIndex] : undefined,
      })
    },
    renderRowActions(record) {
      const rowActionsSlot = this.$scopedSlots.rowActions
      if (rowActionsSlot) {
        return rowActionsSlot({ record })
      }
      const buttons = (this.rowRightButtons || []).map((btn) => {
        const button = this.$createElement(SchemaButton, {
          key: btn.key,
          props: { config: btn },
          on: { click: () => this.onRowButtonClick(btn, record) },
        })
        if (btn.confirm) {
          return this.$createElement(
            'a-popconfirm',
            {
              key: `${btn.key}-popconfirm`,
              props: { title: btn.confirm.title },
              on: { confirm: () => this.onRowButtonClick(btn, record) },
            },
            [button],
          )
        }
        return button
      })
      return this.$createElement('a-space', {}, buttons)
    },
    onTableChange(_pagination, _filters, _sorter) {
    },
  },
})
</script>

<style scoped>
.schema-table__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
</style>

