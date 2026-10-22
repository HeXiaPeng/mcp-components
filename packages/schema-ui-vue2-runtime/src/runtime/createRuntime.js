import Vue from 'vue'
import { assertValidPageSchema } from './validate'
import { deepGet, deepSet } from '../utils/deepGetSet'

function applyUrlTemplate(tpl, state) {
  return tpl.replace(/\{([\w.]+)\}/g, (_, k) => encodeURIComponent(String(deepGet(state, k) ?? '')))
}

export function createSchemaRuntime(schema, options) {
  assertValidPageSchema(schema)

  const state = Vue.observable({ ...(schema.initialState || {}) })
  const tablesSeed = {}
  const actionMap = {}

  for (const a of schema.actions || []) actionMap[a.id] = a

  for (const n of schema.nodes || []) {
    if (n.type === 'table') {
      tablesSeed[n.id] = {
        loading: false,
        rows: [],
        filter: undefined,
      }
    }
  }
  const tables = Vue.observable(tablesSeed)

  const runtime = {
    schema,
    state,
    tables,
    getAction(actionId) {
      return actionMap[actionId]
    },
    setState(key, value) {
      deepSet(state, key, value)
    },
    getState(key) {
      return deepGet(state, key)
    },
    async dispatch(args) {
      const action = actionMap[args.actionId]
      if (!action) throw new Error(`未找到 action: ${args.actionId}`)
      await runAction({ runtime, action, payload: args.payload, options })
    },
  }

  const toRefresh = schema.actions.filter((a) => a.type === 'table.refresh')
  for (const a of toRefresh) {
    runtime.dispatch({ actionId: a.id }).catch((e) => {
      options.notify.error(e && e.message ? e.message : '初始化加载失败')
    })
  }

  return runtime
}

async function runAction(args) {
  const { runtime, action, payload, options } = args
  const notify = options.notify

  if (action.type === 'ui.setVisible') {
    const key = action.args && action.args.key ? String(action.args.key) : ''
    const value = action.args && Object.prototype.hasOwnProperty.call(action.args, 'value')
      ? Boolean(action.args.value)
      : true
    if (!key) throw new Error('ui.setVisible 缺少 args.key')
    runtime.setState(key, value)
    return
  }

  if (action.type === 'table.refresh') {
    const tableId = action.args && action.args.tableId ? String(action.args.tableId) : ''
    const dsId = action.args && action.args.dataSourceId ? String(action.args.dataSourceId) : ''
    if (!tableId || !dsId) throw new Error('table.refresh 缺少 tableId/dataSourceId')
    const ds = options.dataSources[dsId]
    if (!ds) throw new Error(`未找到 dataSource: ${dsId}`)

    if (!runtime.tables[tableId]) {
      runtime.tables[tableId] = { loading: false, rows: [], filter: undefined }
    }
    runtime.tables[tableId].loading = true
    try {
      const filterKey = action.args && action.args.filterStateKey ? String(action.args.filterStateKey) : ''
      const filter = filterKey ? runtime.getState(filterKey) : payload
      runtime.tables[tableId].filter = filter
      const rows = await ds.query({ filter })
      runtime.tables[tableId].rows = rows
    } finally {
      runtime.tables[tableId].loading = false
    }
    return
  }

  if (action.type === 'table.deleteRow') {
    const tableId = action.args && action.args.tableId ? String(action.args.tableId) : ''
    const dsId = action.args && action.args.dataSourceId ? String(action.args.dataSourceId) : ''
    const idKey = action.args && action.args.idKey ? String(action.args.idKey) : 'id'
    if (!tableId || !dsId) throw new Error('table.deleteRow 缺少 tableId/dataSourceId')
    const ds = options.dataSources[dsId]
    if (!ds) throw new Error(`未找到 dataSource: ${dsId}`)
    const record = payload && payload.record ? payload.record : undefined
    const id = record ? String(record[idKey] || '') : ''
    if (!id) throw new Error('删除缺少记录 id')
    await ds.remove({ id })
    notify.success('删除成功')
    const refreshId = action.args && action.args.refreshActionId ? String(action.args.refreshActionId) : ''
    if (refreshId) {
      await runtime.dispatch({ actionId: refreshId, payload: undefined }).catch(() => {})
    }
    return
  }

  if (action.type === 'modal.submitToDataSource') {
    const dsId = action.args && action.args.dataSourceId ? String(action.args.dataSourceId) : ''
    const mode = action.args && action.args.mode ? String(action.args.mode) : 'create'
    const visibleKey = action.args && action.args.visibleStateKey ? String(action.args.visibleStateKey) : ''
    const editRecordKey = action.args && action.args.editRecordStateKey ? String(action.args.editRecordStateKey) : ''
    const refreshActionId = action.args && action.args.refreshActionId ? String(action.args.refreshActionId) : ''

    if (!dsId) throw new Error('modal.submitToDataSource 缺少 dataSourceId')
    const ds = options.dataSources[dsId]
    if (!ds) throw new Error(`未找到 dataSource: ${dsId}`)

    const values = payload && payload.values ? payload.values : payload
    if (!values || typeof values !== 'object') throw new Error('提交缺少 values')

    if (mode === 'update') {
      const record = editRecordKey ? runtime.getState(editRecordKey) : payload && payload.record ? payload.record : undefined
      const id = record && record.id ? String(record.id) : ''
      if (!id) throw new Error('更新缺少记录 id')
      await ds.update({ id, values })
      notify.success('更新成功')
      if (editRecordKey) runtime.setState(editRecordKey, null)
    } else {
      await ds.create({ values })
      notify.success('新增成功')
    }

    if (visibleKey) runtime.setState(visibleKey, false)
    if (refreshActionId) await runtime.dispatch({ actionId: refreshActionId }).catch(() => {})
    return
  }

  if (action.type === 'request.fillForm') {
    const urlTemplate = action.args && action.args.urlTemplate ? String(action.args.urlTemplate) : ''
    const targetKey = action.args && action.args.targetStateKey ? String(action.args.targetStateKey) : ''
    const mapToState = action.args && action.args.mapToState ? action.args.mapToState : {}
    if (!urlTemplate) throw new Error('request.fillForm 缺少 urlTemplate')
    if (!targetKey) throw new Error('request.fillForm 缺少 targetStateKey')
    const url = applyUrlTemplate(urlTemplate, runtime.state)
    notify.loading('正在远程查询...', 0.6)
    const data = await options.request.requestJson({ url, method: 'GET' })
    const patch = {}
    for (const k of Object.keys(mapToState)) {
      patch[k] = deepGet(data, mapToState[k])
    }
    const current = runtime.getState(targetKey) || {}
    runtime.setState(targetKey, { ...current, ...patch })
    notify.success('已回填字段')
    return
  }

  if (action.type === 'form.reset') {
    const targetKey = action.args && action.args.targetStateKey ? String(action.args.targetStateKey) : ''
    if (!targetKey) throw new Error('form.reset 缺少 targetStateKey')
    runtime.setState(targetKey, {})
    notify.success('已清空')
    return
  }

  if (action.type === 'custom') {
    if (options.onCustomAction) {
      await options.onCustomAction({ actionId: action.id, payload, runtime })
    }
    return
  }

  throw new Error(`不支持的 action type: ${action.type}`)
}
