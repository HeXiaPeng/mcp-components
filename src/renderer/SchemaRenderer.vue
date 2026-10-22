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

<script>
import Vue from 'vue'
import SchemaForm from '@/components/base/SchemaForm.vue'
import SchemaButton from '@/components/base/SchemaButton.vue'
import SchemaTable from '@/components/base/SchemaTable.vue'
import SchemaModal from '@/components/base/SchemaModal.vue'

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
      type: Object,
      required: true,
    },
    runtime: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      modalFormModels: {},
    }
  },
  computed: {
    tables() {
      return this.runtime.tables
    },
  },
  methods: {
    getNodeMeta(node) {
      return node && node.meta && typeof node.meta === 'object' ? node.meta : {}
    },
    getFieldOptionsResolver() {
      return this.runtime.resolveFieldOptions
    },
    getSelectedRowKeys(node) {
      const meta = this.getNodeMeta(node)
      if (meta.selectedRowKeysStateKey && typeof meta.selectedRowKeysStateKey === 'string') {
        const v = this.runtime.getState(meta.selectedRowKeysStateKey)
        return Array.isArray(v) ? v : []
      }
      return []
    },
    onSelectionChange(node, keys) {
      const meta = this.getNodeMeta(node)
      if (meta.selectedRowKeysStateKey && typeof meta.selectedRowKeysStateKey === 'string') {
        this.runtime.setState(meta.selectedRowKeysStateKey, keys)
      }
      this.runtime.dispatch({
        actionId: meta.onSelectionChangeActionId,
        payload: { keys },
      }).catch(() => {})
    },
    resolveFieldOptions(node) {
      return (node.fields || []).map((f) => this.resolveSingleField(f))
    },
    resolveModalFieldOptions(node) {
      const modal = node.modal || {}
      return (modal.fields || []).map((f) => this.resolveSingleField(f))
    },
    resolveModalConfig(node) {
      const base = node.modal || {}
      const fields = (base.fields || []).map((f) => this.resolveSingleField(f))
      return { ...base, fields }
    },
    resolveSingleField(field) {
      if (!field) return field
      const resolver = this.getFieldOptionsResolver()
      if (typeof resolver !== 'function') return field
      const resolved = resolver(field)
      return resolved && typeof resolved === 'object' ? resolved : field
    },
    getVisible(key) {
      return Boolean(this.runtime.getState(key))
    },
    setVisible(key, value) {
      this.runtime.setState(key, value)
    },
    onModalVisibleChange(visibleKey, valueKey, visible) {
      this.setVisible(visibleKey, visible)
      if (!visible && valueKey) this.runtime.setState(valueKey, null)
    },
    getModalValue(key) {
      if (!key) return {}
      const v = this.runtime.getState(key)
      if (!v || typeof v !== 'object') return {}
      return v
    },
    getModalFormModel(node) {
      return this.modalFormModels[node.id] || {}
    },
    onModalFormInput(node, next) {
      this.$set(this.modalFormModels, node.id, next)
    },
    getStateObject(key) {
      const v = this.runtime.getState(key)
      if (!v || typeof v !== 'object') return {}
      return v
    },
    setStateObject(key, value) {
      this.runtime.setState(key, value)
    },
    onFormButton(actionId) {
      if (!actionId) return
      this.runtime.dispatch({ actionId, payload: undefined }).catch((e) => {
        const msg = e && e.message ? e.message : '操作失败'
        this.$message.error(msg)
      })
    },
    onTopButtonDirect(node, btn) {
      if (!btn || !btn.action) return
      this.runtime.dispatch({ actionId: String(btn.action), payload: { button: btn } }).catch((e) => {
        const msg = e && e.message ? e.message : '操作失败'
        this.$message.error(msg)
      })
    },
    onRowButtonDirect(node, btn, record) {
      if (!btn || !btn.action) return
      this.runtime.dispatch({ actionId: String(btn.action), payload: { button: btn, record } }).catch((e) => {
        const msg = e && e.message ? e.message : '操作失败'
        this.$message.error(msg)
      })
    },
    onTableButton(tableId, payload) {
      const btn = payload && payload.button ? payload.button : undefined
      if (!btn || !btn.action) return
      this.runtime.dispatch({ actionId: String(btn.action), payload }).catch((e) => {
        const msg = e && e.message ? e.message : '操作失败'
        this.$message.error(msg)
      })
    },
    onModalSubmit(modalId, actionId, values) {
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
        this.$message.error(msg)
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
