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
    >
      <template slot="actions" slot-scope="text, record">
        <slot name="rowActions" :record="record">
          <a-space>
            <template v-for="btn in rowRightButtons">
              <a-popconfirm
                v-if="btn.confirm"
                :key="btn.key"
                :title="btn.confirm.title"
                @confirm="() => onRowButtonClick(btn, record)"
              >
                <SchemaButton :config="btn" />
              </a-popconfirm>
              <SchemaButton
                v-else
                :key="btn.key"
                :config="btn"
                @click="() => onRowButtonClick(btn, record)"
              />
            </template>
          </a-space>
        </slot>
      </template>
    </a-table>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import SchemaButton from './SchemaButton.vue'
import type {
  SchemaButtonConfig,
  SchemaTableColumnConfig,
} from '../../renderer/schemaTypes'

export default Vue.extend({
  name: 'SchemaTable',
  components: { SchemaButton },
  props: {
    columns: {
      type: Array as () => SchemaTableColumnConfig[],
      required: true,
    },
    dataSource: {
      type: Array as () => any[],
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
      type: Array as () => SchemaButtonConfig[],
      default: () => [],
    },
    rowRightButtons: {
      type: Array as () => SchemaButtonConfig[],
      default: () => [],
    },
    enableSelection: {
      type: Boolean,
      default: false,
    },
    selectedRowKeys: {
      type: Array as () => (string | number)[],
      default: () => [],
    },
  },
  computed: {
    antdColumns(): any[] {
      const base = this.columns.map((c) => {
        const col: any = {
          title: c.title,
          dataIndex: c.dataIndex,
          key: c.key,
          width: c.width,
        }
        if (c.link) {
          col.customRender = (text: any, record: any) =>
            this.$createElement(
              'a',
              { on: { click: () => this.onCellLinkClick(c, record) } },
              text,
            )
        }
        return col
      })
      return [
        ...base,
        {
          title: '操作',
          key: 'actions',
          width: 160,
          fixed: 'right',
          scopedSlots: { customRender: 'actions' },
        },
      ]
    },
    computedRowSelection(): any {
      if (!this.enableSelection) return null
      return {
        selectedRowKeys: this.selectedRowKeys || [],
        onChange: (keys: (string | number)[]) => {
          this.$emit('update:selectedRowKeys', keys)
          this.$emit('selection-change', { keys, rows: this.selectedRows(keys) })
        },
      }
    },
  },
  methods: {
    selectedRows(keys: (string | number)[]): any[] {
      const keySet = new Set(keys)
      return (this.dataSource || []).filter((r: any) => keySet.has(r && r[this.rowKey]))
    },
    onTopButtonClick(btn: SchemaButtonConfig) {
      this.$emit('button-click', { button: btn })
    },
    onRowButtonClick(btn: SchemaButtonConfig, record: any) {
      this.$emit('button-click', { button: btn, record })
    },
    onCellLinkClick(column: SchemaTableColumnConfig, record: any) {
      this.$emit('cell-link-click', {
        column,
        record,
        value: record ? record[column.dataIndex] : undefined,
      })
    },
    onTableChange(_pagination: any, _filters: any, _sorter: any) {
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

