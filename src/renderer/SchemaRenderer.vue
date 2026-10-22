<template>
  <div>
    <slot name="beforeNodes" />
    <template v-for="node in schema.nodes">
      <slot :name="`beforeNode-${node.id}`" />
      <a-card
        v-if="node.type === 'table'"
        :key="node.id"
        class="schema-card"
        :bordered="false"
      >
        <div class="schema-card__head">
          <div class="schema-card__title">{{ node.title || '' }}</div>
        </div>
        <SchemaTable
          :columns="node.columns"
          :dataSource="tables[node.id].rows"
          :loading="tables[node.id].loading"
          :rowKey="node.rowKey || 'id'"
          :topRightButtons="node.topRightButtons || []"
          :rowRightButtons="node.rowRightButtons || []"
          :enableSelection="Boolean(getNodeMeta(node).enableSelection)"
          :selectedRowKeys="getSelectedRowKeys(node)"
          @button-click="(payload) => onTableButton(node.id, payload)"
          @update:selectedRowKeys="(keys) => onSelectionChange(node, keys)"
        >
          <template #toolbarLeft>
            <slot :name="`table-toolbarLeft-${node.id}`" :node="node" />
          </template>
          <template #toolbarRight>
            <slot :name="`table-toolbarRight-${node.id}`" :node="node">
              <a-space>
                <SchemaButton
                  v-for="btn in node.topRightButtons || []"
                  :key="btn.key"
                  :config="btn"
                  @click="onTopButtonDirect(node, btn)"
                />
              </a-space>
            </slot>
          </template>
          <template #rowActions="{ record }">
            <slot :name="`table-rowActions-${node.id}`" :node="node" :record="record">
              <a-space>
                <template v-for="btn in node.rowRightButtons || []">
                  <a-popconfirm
                    v-if="btn.confirm"
                    :key="btn.key"
                    :title="btn.confirm.title"
                    @confirm="() => onRowButtonDirect(node, btn, record)"
                  >
                    <SchemaButton :config="btn" />
                  </a-popconfirm>
                  <SchemaButton
                    v-else
                    :key="btn.key"
                    :config="btn"
                    @click="() => onRowButtonDirect(node, btn, record)"
                  />
                </template>
              </a-space>
            </slot>
          </template>
        </SchemaTable>
      </a-card>

      <a-card
        v-else-if="node.type === 'form'"
        :key="node.id"
        class="schema-card"
        :bordered="false"
      >
        <div class="schema-card__head">
          <div class="schema-card__title">{{ node.title || '' }}</div>
          <a-space v-if="node.buttons && node.buttons.length">
            <slot :name="`form-buttons-${node.id}`" :node="node">
              <SchemaButton
                v-for="btn in node.buttons"
                :key="btn.key"
                :config="btn"
                @click="() => onFormButton(btn.action)"
              />
            </slot>
          </a-space>
        </div>
        <slot :name="`form-before-${node.id}`" :node="node" />
        <SchemaForm
          :value="getStateObject(node.modelStateKey)"
          :fields="resolveFieldOptions(node)"
          :effects="node.effects || []"
          @input="(next) => setStateObject(node.modelStateKey, next)"
        >
          <slot :name="`form-body-${node.id}`" :node="node" />
        </SchemaForm>
        <slot :name="`form-after-${node.id}`" :node="node" />
      </a-card>

      <SchemaModal
        v-else-if="node.type === 'modalForm'"
        :key="node.id"
        :visible="getVisible(node.visibleStateKey)"
        :config="resolveModalConfig(node)"
        :value="getModalValue(node.valueStateKey)"
        @update:visible="(v) => onModalVisibleChange(node.visibleStateKey, node.valueStateKey, v)"
        @submit="(values) => onModalSubmit(node.id, node.onSubmitAction, values)"
      >
        <template #body>
          <slot :name="`modal-body-${node.id}`" :node="node">
            <SchemaForm
              ref="formRef"
              :value="getModalFormModel(node)"
              :fields="resolveModalFieldOptions(node)"
              @input="(next) => onModalFormInput(node, next)"
            />
          </slot>
        </template>
      </SchemaModal>

      <div v-else-if="node.type === 'custom'" :key="node.id" style="display: contents;">
        <slot :name="`custom-${node.id}`" :node="node" />
      </div>
      <slot :name="`afterNode-${node.id}`" :node="node" />
    </template>
    <slot name="afterNodes" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import SchemaForm from '@/components/base/SchemaForm.vue'
import SchemaButton from '@/components/base/SchemaButton.vue'
import SchemaTable from '@/components/base/SchemaTable.vue'
import SchemaModal from '@/components/base/SchemaModal.vue'
import type { PageSchema, SchemaRuntime } from '@/runtime/types'

export default Vue.extend({
  name: 'SchemaRenderer',
  components: {
    SchemaForm,
    SchemaButton,
    SchemaTable,
    SchemaModal,
  },
  props: {
    schema: {
      type: Object as () => PageSchema,
      required: true,
    },
    runtime: {
      type: Object as () => SchemaRuntime,
      required: true,
    },
  },
  data() {
    return {
      modalFormModels: {} as Record<string, Record<string, any>>,
    }
  },
  computed: {
    tables(): any {
      return this.runtime.tables
    },
  },
  methods: {
    getNodeMeta(node: any): any {
      return node && node.meta && typeof node.meta === 'object' ? node.meta : {}
    },
    getFieldOptionsResolver(): ((field: any) => any) | undefined {
      return (this.runtime as any).resolveFieldOptions
    },
    getSelectedRowKeys(node: any): (string | number)[] {
      const meta = this.getNodeMeta(node)
      if (meta.selectedRowKeysStateKey && typeof meta.selectedRowKeysStateKey === 'string') {
        const v = this.runtime.getState(meta.selectedRowKeysStateKey)
        return Array.isArray(v) ? v : []
      }
      return []
    },
    onSelectionChange(node: any, keys: (string | number)[]) {
      const meta = this.getNodeMeta(node)
      if (meta.selectedRowKeysStateKey && typeof meta.selectedRowKeysStateKey === 'string') {
        this.runtime.setState(meta.selectedRowKeysStateKey, keys)
      }
      this.runtime.dispatch({
        actionId: meta.onSelectionChangeActionId,
        payload: { keys },
      }).catch(() => {})
    },
    resolveFieldOptions(node: any): any[] {
      return (node.fields || []).map((f: any) => this.resolveSingleField(f))
    },
    resolveModalFieldOptions(node: any): any[] {
      const modal = node.modal || {}
      return (modal.fields || []).map((f: any) => this.resolveSingleField(f))
    },
    resolveModalConfig(node: any): any {
      const base = node.modal || {}
      const fields = (base.fields || []).map((f: any) => this.resolveSingleField(f))
      return { ...base, fields }
    },
    resolveSingleField(field: any): any {
      if (!field) return field
      const resolver = this.getFieldOptionsResolver()
      if (typeof resolver !== 'function') return field
      const resolved = resolver(field)
      return resolved && typeof resolved === 'object' ? resolved : field
    },
    getVisible(key: string): boolean {
      return Boolean(this.runtime.getState(key))
    },
    setVisible(key: string, value: boolean) {
      this.runtime.setState(key, value)
    },
    onModalVisibleChange(visibleKey: string, valueKey: string | undefined, visible: boolean) {
      this.setVisible(visibleKey, visible)
      if (!visible && valueKey) this.runtime.setState(valueKey, null)
    },
    getModalValue(key?: string): Record<string, any> {
      if (!key) return {}
      const v = this.runtime.getState(key)
      if (!v || typeof v !== 'object') return {}
      return v
    },
    getModalFormModel(node: any): Record<string, any> {
      return this.modalFormModels[node.id] || {}
    },
    onModalFormInput(node: any, next: Record<string, any>) {
      this.$set(this.modalFormModels, node.id, next)
    },
    getStateObject(key: string): Record<string, any> {
      const v = this.runtime.getState(key)
      if (!v || typeof v !== 'object') return {}
      return v
    },
    setStateObject(key: string, value: Record<string, any>) {
      this.runtime.setState(key, value)
    },
    onFormButton(actionId: string) {
      if (!actionId) return
      this.runtime.dispatch({ actionId, payload: undefined }).catch((e) => {
        const msg = e && e.message ? e.message : '操作失败'
        ;(this as any).$message.error(msg)
      })
    },
    onTopButtonDirect(node: any, btn: any) {
      if (!btn || !btn.action) return
      this.runtime.dispatch({ actionId: String(btn.action), payload: { button: btn } }).catch((e) => {
        const msg = e && e.message ? e.message : '操作失败'
        ;(this as any).$message.error(msg)
      })
    },
    onRowButtonDirect(node: any, btn: any, record: any) {
      if (!btn || !btn.action) return
      this.runtime.dispatch({ actionId: String(btn.action), payload: { button: btn, record } }).catch((e) => {
        const msg = e && e.message ? e.message : '操作失败'
        ;(this as any).$message.error(msg)
      })
    },
    onTableButton(tableId: string, payload: any) {
      const btn = payload && payload.button ? payload.button : undefined
      if (!btn || !btn.action) return
      this.runtime.dispatch({ actionId: String(btn.action), payload }).catch((e) => {
        const msg = e && e.message ? e.message : '操作失败'
        ;(this as any).$message.error(msg)
      })
    },
    onModalSubmit(modalId: string, actionId: string, values: Record<string, any>) {
      const mergedValues = {
        ...(this.modalFormModels[modalId] || {}),
        ...(values || {}),
      }
      const payload = {
        modalId,
        values: mergedValues,
        record: this.getModalValue(`ui.editing`),
      }
      this.$set(this.modalFormModels, modalId, {})
      this.runtime.dispatch({ actionId, payload }).catch((e) => {
        const msg = e && e.message ? e.message : '提交失败'
        ;(this as any).$message.error(msg)
      })
    },
  },
})
</script>

<style scoped>
.schema-card {
  border-radius: 10px;
}
.schema-card__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 12px;
}
.schema-card__title {
  font-size: 18px;
  font-weight: 600;
  color: #1f1f1f;
}
</style>
