import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

function resolveRepoRoot() {
  const flagIdx = process.argv.findIndex((a) => a === '--repo-root' || a === '--repoRoot')
  if (flagIdx >= 0 && process.argv[flagIdx + 1]) {
    return path.resolve(process.argv[flagIdx + 1])
  }
  const eqIdx = process.argv.findIndex((a) => a.startsWith('--repo-root='))
  if (eqIdx >= 0) {
    const val = process.argv[eqIdx].split('=')[1]
    if (val) return path.resolve(val)
  }
  if (process.env.MCP_COMPONENTS_REPO_ROOT) {
    return path.resolve(process.env.MCP_COMPONENTS_REPO_ROOT)
  }
  const here = path.dirname(fileURLToPath(import.meta.url))
  return path.resolve(here, '../../..')
}

function isObject(v) {
  return v != null && typeof v === 'object' && !Array.isArray(v)
}

function deepGet(obj, keyPath) {
  if (!keyPath) return obj
  const parts = keyPath.split('.').filter(Boolean)
  let cur = obj
  for (const p of parts) {
    if (cur == null) return undefined
    cur = cur[p]
  }
  return cur
}

function deepSet(obj, keyPath, value) {
  const parts = keyPath.split('.').filter(Boolean)
  let cur = obj
  for (let i = 0; i < parts.length - 1; i += 1) {
    const p = parts[i]
    if (!isObject(cur[p])) cur[p] = {}
    cur = cur[p]
  }
  cur[parts[parts.length - 1]] = value
}

function jsonPointerGet(root, pointer) {
  const parts = pointer.replace(/^\//, '').split('/').filter(Boolean).map((p) => p.replace(/~1/g, '/').replace(/~0/g, '~'))
  let cur = root
  for (const part of parts) {
    if (cur == null) return { parent: undefined, key: undefined, value: undefined }
    const key = Array.isArray(cur) ? Number(part) : part
    if (Number.isNaN(key) && Array.isArray(cur)) return { parent: undefined, key: undefined, value: undefined }
    const parent = cur
    cur = parent[key]
    if (part === parts[parts.length - 1]) {
      return { parent, key, value: cur }
    }
  }
  return { parent: undefined, key: undefined, value: cur }
}

function applyPatch(schema, ops) {
  const next = JSON.parse(JSON.stringify(schema))
  for (const op of ops) {
    if (!op.path || typeof op.path !== 'string' || !op.path.startsWith('/')) {
      throw new Error('patch path 必须是以 / 开头的 JSON Pointer')
    }
    const { parent, key } = jsonPointerGet(next, op.path)
    if (parent == null) {
      throw new Error(`patch path 无效: ${op.path}`)
    }
    if (op.op === 'remove') {
      if (Array.isArray(parent)) {
        parent.splice(Number(key), 1)
      } else {
        delete parent[key]
      }
      continue
    }
    if (op.op === 'add' || op.op === 'replace') {
      if (Array.isArray(parent)) {
        parent[Number(key)] = op.value
      } else {
        parent[key] = op.value
      }
      continue
    }
    throw new Error(`不支持的 patch op: ${op.op}`)
  }
  return next
}

function validateSchemaBasic(schema) {
  if (!schema || typeof schema !== 'object') return ['schema 必须为对象']
  const errors = []
  if (schema.schemaVersion !== 1) errors.push('schemaVersion 必须为 1')
  if (!schema.pageId || typeof schema.pageId !== 'string') errors.push('pageId 必须为字符串')
  if (!Array.isArray(schema.nodes)) errors.push('nodes 必须为数组')
  if (!Array.isArray(schema.actions)) errors.push('actions 必须为数组')
  return errors
}

// ============================================================
// 🔧 枚举常量：所有字段支持的可选值（AI 写配置时参考）
// ============================================================

const BUTTON_TYPES = ['default', 'primary', 'dashed', 'link']
const BUTTON_PLACEMENTS = ['topRight', 'rowRight']
const NODE_TYPES = ['table', 'modalForm', 'form']
const ACTION_TYPES = [
  'ui.setVisible',
  'table.refresh',
  'table.deleteRow',
  'modal.submitToDataSource',
  'request.fillForm',
  'form.reset',
  'custom',
]
const FORM_EFFECT_TYPES = ['mirror', 'template']
const REQUEST_METHODS = ['GET', 'POST']

// ============================================================
// 📚 模板库：各组件的标准模板（含字段说明 + 示例）
// ============================================================

const SCHEMA_TEMPLATES = {
  button: {
    说明:
      '按钮配置，用于 table 的 topRightButtons / rowRightButtons 或 form 的 buttons 数组',
    必填字段: ['key', 'text', 'placement', 'action'],
    支持类型枚举: {
      type: BUTTON_TYPES,
      placement: BUTTON_PLACEMENTS,
    },
    完整字段结构: {
      key: '唯一标识字符串（必填，同页面内不重复）',
      text: '按钮显示文字（必填）',
      type: "按钮样式（可选）：'default' | 'primary' | 'dashed' | 'link'，默认 'default'",
      placement: "按钮位置（必填）：'topRight' 表格右上角 | 'rowRight' 行内操作",
      action: '点击触发的 actionId（必填，需在 actions[] 中有定义，或页面 onCustomAction 处理）',
      danger: '是否危险按钮（可选，boolean）：true=红色，通常用于删除',
      confirm: '点击前二次确认（可选）：{ title: "确认提示文案" }',
      request:
        '点击后自动发送请求并回填（可选，需搭配 type: request.fillForm 的 action 使用）',
      meta: '任意自定义透传数据（可选，供 onCustomAction 读取）',
    },
    示例集合: {
      新增按钮_顶部_primary: {
        key: 'create',
        text: '新增',
        type: 'primary',
        placement: 'topRight',
        action: 'xxx.openCreate',
      },
      删除按钮_行内_危险带确认: {
        key: 'delete',
        text: '删除',
        placement: 'rowRight',
        action: 'xxx.deleteRow',
        danger: true,
        confirm: { title: '确认删除该条记录吗？此操作不可恢复' },
      },
      查询按钮_顶部_default: {
        key: 'query',
        text: '查询筛选',
        placement: 'topRight',
        action: 'xxx.openQuery',
      },
      编辑按钮_行内: {
        key: 'edit',
        text: '编辑',
        placement: 'rowRight',
        action: 'xxx.openEdit',
      },
      远程查询按钮_带request: {
        key: 'remoteFill',
        text: '远程查询',
        type: 'primary',
        placement: 'topRight',
        action: 'xxx.remoteFill',
        request: {
          urlTemplate: 'https://api.example.com/users/{ui.form.userId}',
          method: 'GET',
          timeoutMs: 5000,
          mapToForm: {
            name: 'name',
            email: 'email',
            phone: 'phone',
          },
        },
      },
      自定义透传meta: {
        key: 'export',
        text: '导出 Excel',
        placement: 'topRight',
        action: 'xxx.export',
        meta: { format: 'xlsx', sheetName: 'DataExport' },
      },
    },
  },

  field: {
    说明: '表单字段配置，用于 modal.fields 或 form.fields 数组',
    必填字段: ['key', 'label'],
    完整字段结构: {
      key: '字段唯一标识（必填，同时是 state 映射路径的最后一段）',
      label: '显示标签（必填）',
      placeholder: '输入提示（可选）',
      required: '是否必填（可选，boolean），true 时提交前校验非空',
      disabled: '是否禁用（可选，boolean），也可以通过 linkage 动态控制',
      visible: '是否显示（可选，boolean），也可以通过 linkage 动态控制',
      defaultValue: '默认值（可选，初始化表单时填入）',
      linkage: '联动规则数组（可选）：when 条件 + then 副作用',
    },
    示例集合: {
      基础必填输入框: {
        key: 'name',
        label: '姓名',
        placeholder: '请输入真实姓名',
        required: true,
      },
      禁用的只读展示字段: {
        key: 'code',
        label: '单号',
        placeholder: '系统自动生成',
        disabled: true,
      },
      带联动_状态关闭时禁用处理人: {
        key: 'owner',
        label: '处理人',
        placeholder: '请输入处理人',
        linkage: [
          {
            when: { field: 'status', equals: '关闭' },
            then: { disabled: true, setValue: '系统' },
          },
        ],
      },
      带联动_根据其他字段显示隐藏: {
        key: 'closeReason',
        label: '关闭原因',
        placeholder: '关闭时必填',
        linkage: [
          { when: { field: 'status', equals: '关闭' }, then: { visible: true, setValue: '' } },
          { when: { field: 'status', equals: '待处理' }, then: { visible: false, setValue: '' } },
        ],
      },
    },
  },

  tableColumn: {
    说明: '表格列配置，用于 table.columns 数组',
    必填字段: ['key', 'title', 'dataIndex'],
    完整字段结构: {
      key: '列唯一标识（必填，同 columns 内不重复）',
      title: '列头显示文字（必填）',
      dataIndex: '行数据中读取的字段名（必填，通常与 row 中属性同名）',
      width: '列宽（可选，数字，单位 px），建议列表固定列都加宽度',
    },
    示例集合: {
      标准列: [
        { key: 'code', title: '编号', dataIndex: 'code', width: 120 },
        { key: 'title', title: '标题', dataIndex: 'title', width: 260 },
        { key: 'status', title: '状态', dataIndex: 'status', width: 100 },
        { key: 'createdAt', title: '创建时间', dataIndex: 'createdAt', width: 180 },
      ],
    },
  },

  tableNode: {
    说明: '表格节点（type = "table"），放入 nodes[] 数组',
    必填字段: ['id', 'type', 'dataSourceId', 'columns'],
    完整字段结构: {
      id: '节点唯一 ID（必填）',
      type: "'table' 固定值（必填）",
      title: '表格标题（可选，显示在表格上方）',
      dataSourceId: '数据源 ID（必填，需在 dataSources 中声明）',
      rowKey: "行主键字段名（可选，默认 'id'）",
      columns: '表格列数组（必填，参考 tableColumn 模板）',
      topRightButtons: '右上角操作按钮（可选，参考 button 模板）',
      rowRightButtons: '行内操作按钮（可选，参考 button 模板）',
    },
    示例: {
      id: 'mainTable',
      type: 'table',
      title: '主数据列表',
      dataSourceId: 'mainDs',
      rowKey: 'id',
      columns: [
        { key: 'code', title: '编号', dataIndex: 'code', width: 120 },
        { key: 'title', title: '标题', dataIndex: 'title', width: 260 },
      ],
      topRightButtons: [
        { key: 'create', text: '新增', type: 'primary', placement: 'topRight', action: 'openCreate' },
      ],
      rowRightButtons: [
        { key: 'edit', text: '编辑', placement: 'rowRight', action: 'openEdit' },
      ],
    },
  },

  modalFormNode: {
    说明: '弹窗表单节点（type = "modalForm"），用于新增/编辑/查询弹窗',
    必填字段: ['id', 'type', 'visibleStateKey', 'onSubmitAction', 'modal'],
    完整字段结构: {
      id: '节点唯一 ID',
      type: "'modalForm' 固定值",
      visibleStateKey: '控制显示隐藏的 state 路径，如 "ui.createVisible"',
      valueStateKey: "编辑模式下回填表单的 state 路径（编辑弹窗必填，新增可省略）",
      onSubmitAction: '点「提交」按钮时触发的 actionId',
      modal: {
        title: '弹窗标题',
        width: '弹窗宽度（可选，number，单位 px）',
        submitText: '提交按钮文字（可选，默认「提交」）',
        cancelText: '取消按钮文字（可选，默认「取消」）',
        fields: '表单字段数组（必填，参考 field 模板）',
      },
    },
    示例_新增弹窗: {
      id: 'createModal',
      type: 'modalForm',
      visibleStateKey: 'ui.createVisible',
      onSubmitAction: 'xxx.submitCreate',
      modal: {
        title: '新增记录',
        width: 640,
        submitText: '确认添加',
        cancelText: '取消',
        fields: [
          { key: 'code', label: '编号', placeholder: '请输入', required: true },
          { key: 'title', label: '标题', placeholder: '请输入', required: true },
        ],
      },
    },
  },

  formNode: {
    说明: '独立表单节点（type = "form"），直接渲染在页面中而非弹窗',
    必填字段: ['id', 'type', 'modelStateKey', 'fields'],
    完整字段结构: {
      id: '节点唯一 ID',
      type: "'form' 固定值",
      title: '表单标题（可选）',
      modelStateKey: '双向绑定的 state 路径，如 "ui.form"',
      fields: '字段数组（必填）',
      effects: '表单级联动副作用（可选，参考 formEffect 模板）',
      buttons: '表单顶部/右上角按钮（可选）',
    },
    示例: {
      id: 'mainForm',
      type: 'form',
      title: '数据录入表单',
      modelStateKey: 'ui.form',
      fields: [
        { key: 'name', label: '姓名', placeholder: '请输入姓名' },
        { key: 'shortName', label: '简称', disabled: true },
      ],
      effects: [{ on: 'name', type: 'template', target: 'shortName', template: '{value}' }],
    },
  },

  action: {
    说明: '动作定义，放入 actions[] 数组；按钮点击或自动流程触发',
    必填字段: ['id', 'type'],
    支持类型枚举: { type: ACTION_TYPES },
    '各类 args 结构': {
      'ui.setVisible': { key: 'state 路径（如 ui.createVisible）', value: '布尔值 true/false' },
      'table.refresh': {
        tableId: '目标节点 ID',
        dataSourceId: '数据源 ID',
        filterStateKey: '筛选条件的 state 路径（可选）',
      },
      'table.deleteRow': {
        tableId: '目标节点 ID',
        dataSourceId: '数据源 ID',
        refreshActionId: '删除后执行刷新的 actionId（可选）',
      },
      'modal.submitToDataSource': {
        dataSourceId: '数据源 ID',
        mode: "'create' | 'update'",
        visibleStateKey: '提交后关闭的 state 路径',
        editRecordStateKey: "mode='update' 时必填，编辑记录 state 路径",
        refreshActionId: '提交成功后刷新的 actionId（可选）',
      },
      'request.fillForm': {
        urlTemplate: 'URL 模板，支持 {state.path} 占位符替换',
        method: "'GET' | 'POST'（可选，默认 GET）",
        targetStateKey: '回填的目标 state 路径（如 ui.form）',
        mapToForm: '{ 表单字段key: 响应体中的JSON路径 }',
      },
      'form.reset': { targetStateKey: '要清空的 state 路径（会被设为 {}）' },
      custom: '无固定 args；需在页面 onCustomAction 中处理，可传任意参数',
    },
    示例集合: {
      打开弹窗: {
        id: 'xxx.openCreate',
        type: 'ui.setVisible',
        args: { key: 'ui.createVisible', value: true },
      },
      刷新表格: {
        id: 'xxx.refresh',
        type: 'table.refresh',
        args: { tableId: 'mainTable', dataSourceId: 'mainDs', filterStateKey: 'ui.queryFilter' },
      },
      删除行_带刷新: {
        id: 'xxx.deleteRow',
        type: 'table.deleteRow',
        args: {
          tableId: 'mainTable',
          dataSourceId: 'mainDs',
          refreshActionId: 'xxx.refresh',
        },
      },
      新增提交: {
        id: 'xxx.submitCreate',
        type: 'modal.submitToDataSource',
        args: {
          dataSourceId: 'mainDs',
          mode: 'create',
          visibleStateKey: 'ui.createVisible',
          refreshActionId: 'xxx.refresh',
        },
      },
      编辑提交: {
        id: 'xxx.submitEdit',
        type: 'modal.submitToDataSource',
        args: {
          dataSourceId: 'mainDs',
          mode: 'update',
          visibleStateKey: 'ui.editVisible',
          editRecordStateKey: 'ui.editing',
          refreshActionId: 'xxx.refresh',
        },
      },
      远程请求回填表单: {
        id: 'xxx.remoteFill',
        type: 'request.fillForm',
        args: {
          urlTemplate: 'https://jsonplaceholder.typicode.com/users/{ui.form.userId}',
          targetStateKey: 'ui.form',
          mapToState: { name: 'name', email: 'email' },
        },
      },
      清空表单: {
        id: 'xxx.reset',
        type: 'form.reset',
        args: { targetStateKey: 'ui.form' },
      },
      自定义Action_需要前端处理: {
        id: 'xxx.customExport',
        type: 'custom',
        args: { target: 'all', format: 'xlsx' },
      },
    },
  },

  linkageRule: {
    说明: '字段级联动规则，放在 field.linkage[]',
    结构: {
      when: { field: '触发字段 key（同表单内）', equals: '等于该值时触发' },
      then: {
        disabled: '是否禁用（boolean，可选）',
        visible: '是否显示（boolean，可选）',
        setValue: '同时给本字段设置一个固定值（可选，任意类型）',
      },
    },
    示例: [
      { when: { field: 'status', equals: '关闭' }, then: { disabled: true, setValue: '系统' } },
    ],
  },

  formEffect: {
    说明: '表单级副作用，放在 form.effects[]（字段 change 时自动触发）',
    类型枚举: { type: FORM_EFFECT_TYPES },
    结构: {
      on: '监听的字段 key',
      type: "'mirror' 直接复制值 | 'template' 按模板插值",
      target: '写入目标字段 key',
      template: "type='template' 时必填，支持 {value} 占位符 = 当前字段值",
    },
    示例: [
      { on: 'name', type: 'mirror', target: 'nameCopy' },
      { on: 'name', type: 'template', target: 'shortName', template: '{value}' },
    ],
  },

  requestConfig: {
    说明: '按钮级 request 配置（放在 button.request）；通常搭配 type=request.fillForm 的 action 一起使用',
    结构: {
      urlTemplate: 'URL 模板，支持 {state.path} 占位符',
      method: "'GET' | 'POST'（可选）",
      timeoutMs: '超时时间，毫秒（可选）',
      mapToForm: '响应体 JSON 路径 → 表单字段 key 的映射',
    },
  },

  dataSource: {
    说明: '数据源声明，放在顶层 dataSources 对象；当前支持 memory（内存）',
    结构: {
      type: "'memory'（目前支持）",
      entity: '实体名称（字符串，可选，仅用于标识）',
    },
    示例: { workOrders: { type: 'memory', entity: 'WorkOrder' } },
  },

  fullPage: {
    说明: '完整页面 Schema 顶层结构',
    必填字段: ['schemaVersion', 'pageId', 'nodes', 'actions'],
    结构: {
      schemaVersion: '数字，固定为 1',
      pageId: '页面唯一 ID（字符串，通常与目录同名）',
      dataSources: '{ [数据源ID]: { type, entity } }（可选）',
      initialState: '初始化 state 树（可选，常用 ui: { xxxVisible, editing, queryFilter } 等）',
      nodes: 'UI 节点数组（必填：table / modalForm / form）',
      actions: '动作定义数组（必填，参考 action 模板）',
    },
    示例: '可通过 ui_schema_get_page(pageId) 读取现有页面作为参考，如 work-orders / form-linkage / mcp-servers',
  },
}

// ============================================================
// ✅ 各子结构校验函数（返回错误信息数组，空数组=合法）
// ============================================================

function validateButton(btn, path = 'button') {
  const errors = []
  if (!isObject(btn)) return [`${path} 必须是对象`]
  const p = (k) => `${path}.${k}`
  if (!btn.key || typeof btn.key !== 'string') errors.push(`${p('key')} 缺失或不是字符串`)
  if (!btn.text || typeof btn.text !== 'string') errors.push(`${p('text')} 缺失或不是字符串`)
  if (!btn.placement || typeof btn.placement !== 'string') {
    errors.push(`${p('placement')} 缺失或不是字符串`)
  } else if (!BUTTON_PLACEMENTS.includes(btn.placement)) {
    errors.push(
      `${p('placement')} 值无效: "${btn.placement}"，只能是: ${BUTTON_PLACEMENTS.join(' / ')}`,
    )
  }
  if (!btn.action || typeof btn.action !== 'string') {
    errors.push(`${p('action')} 缺失或不是字符串`)
  }
  if (btn.type != null && !BUTTON_TYPES.includes(btn.type)) {
    errors.push(
      `${p('type')} 值无效: "${btn.type}"，只能是: ${BUTTON_TYPES.join(' / ')}（或省略）`,
    )
  }
  if (btn.danger != null && typeof btn.danger !== 'boolean') {
    errors.push(`${p('danger')} 必须是 boolean（或省略）`)
  }
  if (btn.confirm != null) {
    if (!isObject(btn.confirm)) errors.push(`${p('confirm')} 必须是对象`)
    else if (!btn.confirm.title || typeof btn.confirm.title !== 'string') {
      errors.push(`${p('confirm.title')} 缺失或不是字符串`)
    }
  }
  if (btn.request != null) {
    errors.push(...validateRequestConfig(btn.request, p('request')))
  }
  if (btn.meta != null && !isObject(btn.meta)) {
    errors.push(`${p('meta')} 必须是对象（或省略）`)
  }
  return errors
}

function validateRequestConfig(req, path = 'request') {
  const errors = []
  if (!isObject(req)) return [`${path} 必须是对象`]
  const p = (k) => `${path}.${k}`
  if (!req.urlTemplate || typeof req.urlTemplate !== 'string') {
    errors.push(`${p('urlTemplate')} 缺失或不是字符串`)
  }
  if (req.method != null && !REQUEST_METHODS.includes(req.method)) {
    errors.push(`${p('method')} 只能是: ${REQUEST_METHODS.join(' / ')}`)
  }
  if (req.timeoutMs != null && (typeof req.timeoutMs !== 'number' || req.timeoutMs <= 0)) {
    errors.push(`${p('timeoutMs')} 必须是正数（毫秒）`)
  }
  if (req.mapToForm != null) {
    if (!isObject(req.mapToForm)) errors.push(`${p('mapToForm')} 必须是对象`)
    else {
      for (const k of Object.keys(req.mapToForm)) {
        if (typeof req.mapToForm[k] !== 'string') {
          errors.push(`${p('mapToForm')}.${k} 必须是字符串（响应体 JSON 路径）`)
        }
      }
    }
  }
  return errors
}

function validateField(field, path = 'field') {
  const errors = []
  if (!isObject(field)) return [`${path} 必须是对象`]
  const p = (k) => `${path}.${k}`
  if (!field.key || typeof field.key !== 'string') errors.push(`${p('key')} 缺失或不是字符串`)
  if (!field.label || typeof field.label !== 'string') errors.push(`${p('label')} 缺失或不是字符串`)
  if (field.placeholder != null && typeof field.placeholder !== 'string') {
    errors.push(`${p('placeholder')} 必须是字符串`)
  }
  if (field.required != null && typeof field.required !== 'boolean') {
    errors.push(`${p('required')} 必须是 boolean`)
  }
  if (field.disabled != null && typeof field.disabled !== 'boolean') {
    errors.push(`${p('disabled')} 必须是 boolean`)
  }
  if (field.visible != null && typeof field.visible !== 'boolean') {
    errors.push(`${p('visible')} 必须是 boolean`)
  }
  if (field.linkage != null) {
    if (!Array.isArray(field.linkage)) errors.push(`${p('linkage')} 必须是数组`)
    else {
      field.linkage.forEach((rule, i) => {
        errors.push(...validateLinkageRule(rule, `${p('linkage')}[${i}]`))
      })
    }
  }
  return errors
}

function validateLinkageRule(rule, path = 'linkageRule') {
  const errors = []
  if (!isObject(rule)) return [`${path} 必须是对象`]
  const p = (k) => `${path}.${k}`
  if (!rule.when || !isObject(rule.when)) errors.push(`${p('when')} 缺失或不是对象`)
  else {
    if (!rule.when.field || typeof rule.when.field !== 'string') {
      errors.push(`${p('when.field')} 缺失或不是字符串`)
    }
    if (!Object.prototype.hasOwnProperty.call(rule.when, 'equals')) {
      errors.push(`${p('when.equals')} 缺失`)
    }
  }
  if (!rule.then || !isObject(rule.then)) errors.push(`${p('then')} 缺失或不是对象`)
  else {
    if (rule.then.disabled != null && typeof rule.then.disabled !== 'boolean') {
      errors.push(`${p('then.disabled')} 必须是 boolean`)
    }
    if (rule.then.visible != null && typeof rule.then.visible !== 'boolean') {
      errors.push(`${p('then.visible')} 必须是 boolean`)
    }
  }
  return errors
}

function validateTableColumn(col, path = 'tableColumn') {
  const errors = []
  if (!isObject(col)) return [`${path} 必须是对象`]
  const p = (k) => `${path}.${k}`
  if (!col.key || typeof col.key !== 'string') errors.push(`${p('key')} 缺失或不是字符串`)
  if (!col.title || typeof col.title !== 'string') errors.push(`${p('title')} 缺失或不是字符串`)
  if (!col.dataIndex || typeof col.dataIndex !== 'string') {
    errors.push(`${p('dataIndex')} 缺失或不是字符串`)
  }
  if (col.width != null && (typeof col.width !== 'number' || col.width <= 0)) {
    errors.push(`${p('width')} 必须是正数 px`)
  }
  return errors
}

function validateAction(action, path = 'action') {
  const errors = []
  if (!isObject(action)) return [`${path} 必须是对象`]
  const p = (k) => `${path}.${k}`
  if (!action.id || typeof action.id !== 'string') errors.push(`${p('id')} 缺失或不是字符串`)
  if (!action.type || typeof action.type !== 'string') {
    errors.push(`${p('type')} 缺失或不是字符串`)
  } else if (!ACTION_TYPES.includes(action.type)) {
    errors.push(
      `${p('type')} 值无效: "${action.type}"，支持: ${ACTION_TYPES.join(' / ')}`,
    )
  }
  if (action.args != null && !isObject(action.args)) {
    errors.push(`${p('args')} 必须是对象（或省略）`)
  } else if (action.args) {
    const args = action.args
    switch (action.type) {
      case 'ui.setVisible':
        if (!args.key || typeof args.key !== 'string') errors.push(`${p('args.key')} 缺失或不是字符串`)
        if (args.value != null && typeof args.value !== 'boolean') {
          errors.push(`${p('args.value')} 必须是 boolean`)
        }
        break
      case 'table.refresh':
        if (!args.tableId || typeof args.tableId !== 'string') errors.push(`${p('args.tableId')} 缺失`)
        if (!args.dataSourceId || typeof args.dataSourceId !== 'string') {
          errors.push(`${p('args.dataSourceId')} 缺失`)
        }
        break
      case 'table.deleteRow':
        if (!args.tableId || typeof args.tableId !== 'string') errors.push(`${p('args.tableId')} 缺失`)
        if (!args.dataSourceId || typeof args.dataSourceId !== 'string') {
          errors.push(`${p('args.dataSourceId')} 缺失`)
        }
        break
      case 'modal.submitToDataSource': {
        if (!args.dataSourceId || typeof args.dataSourceId !== 'string') {
          errors.push(`${p('args.dataSourceId')} 缺失`)
        }
        if (args.mode !== 'create' && args.mode !== 'update') {
          errors.push(`${p('args.mode')} 必须是 'create' 或 'update'`)
        }
        if (!args.visibleStateKey || typeof args.visibleStateKey !== 'string') {
          errors.push(`${p('args.visibleStateKey')} 缺失`)
        }
        if (args.mode === 'update' && (!args.editRecordStateKey || typeof args.editRecordStateKey !== 'string')) {
          errors.push(`${p('args.editRecordStateKey')} mode='update' 时必填`)
        }
        break
      }
      case 'request.fillForm':
        if (!args.urlTemplate || typeof args.urlTemplate !== 'string') {
          errors.push(`${p('args.urlTemplate')} 缺失`)
        }
        if (!args.targetStateKey || typeof args.targetStateKey !== 'string') {
          errors.push(`${p('args.targetStateKey')} 缺失`)
        }
        if (args.method && !REQUEST_METHODS.includes(args.method)) {
          errors.push(`${p('args.method')} 只能是 ${REQUEST_METHODS.join('/')}`)
        }
        break
      case 'form.reset':
        if (!args.targetStateKey || typeof args.targetStateKey !== 'string') {
          errors.push(`${p('args.targetStateKey')} 缺失`)
        }
        break
      case 'custom':
      default:
        break
    }
  }
  return errors
}

function validateNode(node, path = 'node') {
  const errors = []
  if (!isObject(node)) return [`${path} 必须是对象`]
  const p = (k) => `${path}.${k}`
  if (!node.id || typeof node.id !== 'string') errors.push(`${p('id')} 缺失或不是字符串`)
  if (!node.type || typeof node.type !== 'string') {
    errors.push(`${p('type')} 缺失或不是字符串`)
  } else if (!NODE_TYPES.includes(node.type)) {
    errors.push(
      `${p('type')} 值无效: "${node.type}"，节点类型仅支持: ${NODE_TYPES.join(' / ')}`,
    )
  }

  if (node.type === 'table') {
    if (!node.dataSourceId || typeof node.dataSourceId !== 'string') {
      errors.push(`${p('dataSourceId')} (table) 缺失或不是字符串`)
    }
    if (!Array.isArray(node.columns)) errors.push(`${p('columns')} (table) 必须是数组`)
    else {
      node.columns.forEach((c, i) => {
        errors.push(...validateTableColumn(c, `${p('columns')}[${i}]`))
      })
    }
    if (Array.isArray(node.topRightButtons)) {
      node.topRightButtons.forEach((b, i) => {
        errors.push(...validateButton(b, `${p('topRightButtons')}[${i}]`))
      })
    }
    if (Array.isArray(node.rowRightButtons)) {
      node.rowRightButtons.forEach((b, i) => {
        errors.push(...validateButton(b, `${p('rowRightButtons')}[${i}]`))
      })
    }
  } else if (node.type === 'modalForm') {
    if (!node.visibleStateKey || typeof node.visibleStateKey !== 'string') {
      errors.push(`${p('visibleStateKey')} (modalForm) 缺失`)
    }
    if (!node.onSubmitAction || typeof node.onSubmitAction !== 'string') {
      errors.push(`${p('onSubmitAction')} (modalForm) 缺失`)
    }
    if (!isObject(node.modal)) {
      errors.push(`${p('modal')} (modalForm) 缺失或不是对象`)
    } else {
      if (!node.modal.title || typeof node.modal.title !== 'string') {
        errors.push(`${p('modal.title')} 缺失`)
      }
      if (!Array.isArray(node.modal.fields)) {
        errors.push(`${p('modal.fields')} 必须是数组`)
      } else {
        node.modal.fields.forEach((f, i) => {
          errors.push(...validateField(f, `${p('modal.fields')}[${i}]`))
        })
      }
    }
  } else if (node.type === 'form') {
    if (!node.modelStateKey || typeof node.modelStateKey !== 'string') {
      errors.push(`${p('modelStateKey')} (form) 缺失`)
    }
    if (!Array.isArray(node.fields)) errors.push(`${p('fields')} (form) 必须是数组`)
    else {
      node.fields.forEach((f, i) => {
        errors.push(...validateField(f, `${p('fields')}[${i}]`))
      })
    }
    if (Array.isArray(node.buttons)) {
      node.buttons.forEach((b, i) => {
        errors.push(...validateButton(b, `${p('buttons')}[${i}]`))
      })
    }
  }
  return errors
}

function validateSchemaDeep(schema) {
  const errors = validateSchemaBasic(schema)
  if (errors.length) return errors

  const actionIds = new Set()
  for (let i = 0; i < schema.actions.length; i += 1) {
    const a = schema.actions[i]
    errors.push(...validateAction(a, `actions[${i}]`))
    if (a && a.id) {
      if (actionIds.has(a.id)) errors.push(`actions[${i}].id 重复: "${a.id}"`)
      else actionIds.add(a.id)
    }
  }

  const nodeIds = new Set()
  const actionRefs = []
  for (let i = 0; i < schema.nodes.length; i += 1) {
    const n = schema.nodes[i]
    errors.push(...validateNode(n, `nodes[${i}]`))
    if (n && n.id) {
      if (nodeIds.has(n.id)) errors.push(`nodes[${i}].id 重复: "${n.id}"`)
      else nodeIds.add(n.id)
    }
    const collectBtnAction = (arr) => {
      if (!Array.isArray(arr)) return
      for (const b of arr) if (b && b.action) actionRefs.push(b.action)
    }
    if (n) {
      collectBtnAction(n.topRightButtons)
      collectBtnAction(n.rowRightButtons)
      collectBtnAction(n.buttons)
      if (n.type === 'modalForm' && n.onSubmitAction) actionRefs.push(n.onSubmitAction)
    }
  }
  for (const ref of actionRefs) {
    if (!actionIds.has(ref)) {
      errors.push(
        `按钮/弹窗引用了 actionId="${ref}"，但 actions[] 中没有定义此 action（请补充或修正拼写）`,
      )
    }
  }
  return errors
}

async function discoverPages(root) {
  const pagesDir = path.join(root, 'src/pages')
  const entries = await fs.readdir(pagesDir, { withFileTypes: true }).catch(() => [])
  const result = {}
  for (const ent of entries) {
    if (!ent.isDirectory()) continue
    const file = path.join(pagesDir, ent.name, 'pageSchema.json')
    try {
      const text = await fs.readFile(file, 'utf-8')
      const json = JSON.parse(text)
      if (json && typeof json.pageId === 'string') {
        result[json.pageId] = file
      }
    } catch {
    }
  }
  return result
}

async function readPageSchema(pageId, pageMap) {
  const file = pageMap[pageId]
  if (!file) throw new Error(`未找到 pageId: ${pageId}`)
  const text = await fs.readFile(file, 'utf-8')
  return JSON.parse(text)
}

async function writePageSchema(pageId, schema, pageMap, repoRoot) {
  const file = pageMap[pageId] || path.join(repoRoot, 'src/pages', pageId, 'pageSchema.json')
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, JSON.stringify(schema, null, 2) + '\n', 'utf-8')
  pageMap[pageId] = file
  return file
}

const repoRoot = resolveRepoRoot()
let pageMap = {}
const runtimeState = new Map()

const server = new McpServer({
  name: 'mcp-components-ui-schema',
  version: '0.1.0',
})

server.tool(
  'ui_schema_list_pages',
  '列出当前仓库可用的页面 schema（从 src/pages/**/pageSchema.json 扫描）',
  {},
  async () => {
    pageMap = await discoverPages(repoRoot)
    return {
      content: [{ type: 'text', text: JSON.stringify({ pages: pageMap }, null, 2) }],
    }
  },
)

server.tool(
  'ui_schema_get_page',
  '读取指定 pageId 的页面 schema',
  {
    pageId: z.string(),
  },
  async ({ pageId }) => {
    pageMap = Object.keys(pageMap).length ? pageMap : await discoverPages(repoRoot)
    const schema = await readPageSchema(pageId, pageMap)
    return {
      content: [{ type: 'text', text: JSON.stringify(schema, null, 2) }],
    }
  },
)

server.tool(
  'ui_schema_put_page',
  '写入指定 pageId 的页面 schema（会覆盖写入，并格式化为 JSON）',
  {
    pageId: z.string(),
    schema: z.any(),
  },
  async ({ pageId, schema }) => {
    const errors = validateSchemaBasic(schema)
    if (errors.length) {
      return { content: [{ type: 'text', text: `schema 校验失败:\n${errors.join('\n')}` }] }
    }
    pageMap = Object.keys(pageMap).length ? pageMap : await discoverPages(repoRoot)
    const file = await writePageSchema(pageId, schema, pageMap, repoRoot)
    return {
      content: [{ type: 'text', text: JSON.stringify({ ok: true, file }, null, 2) }],
    }
  },
)

server.tool(
  'ui_schema_patch_page',
  '对指定 pageId 的 schema 进行 JSON Patch（add/replace/remove）',
  {
    pageId: z.string(),
    ops: z.array(
      z.union([
        z.object({ op: z.union([z.literal('add'), z.literal('replace')]), path: z.string(), value: z.any() }),
        z.object({ op: z.literal('remove'), path: z.string() }),
      ]),
    ),
  },
  async ({ pageId, ops }) => {
    pageMap = Object.keys(pageMap).length ? pageMap : await discoverPages(repoRoot)
    const schema = await readPageSchema(pageId, pageMap)
    const next = applyPatch(schema, ops)
    const errors = validateSchemaBasic(next)
    if (errors.length) {
      return { content: [{ type: 'text', text: `patch 后 schema 校验失败:\n${errors.join('\n')}` }] }
    }
    const file = await writePageSchema(pageId, next, pageMap, repoRoot)
    return {
      content: [{ type: 'text', text: JSON.stringify({ ok: true, file }, null, 2) }],
    }
  },
)

server.tool(
  'ui_runtime_init_page',
  '加载 schema 并初始化运行态 state（server 内存）',
  {
    pageId: z.string(),
  },
  async ({ pageId }) => {
    pageMap = Object.keys(pageMap).length ? pageMap : await discoverPages(repoRoot)
    const schema = await readPageSchema(pageId, pageMap)
    const errors = validateSchemaBasic(schema)
    if (errors.length) {
      return { content: [{ type: 'text', text: `schema 校验失败:\n${errors.join('\n')}` }] }
    }
    const state = JSON.parse(JSON.stringify(schema.initialState || {}))
    runtimeState.set(pageId, { schema, state })
    return { content: [{ type: 'text', text: JSON.stringify({ ok: true, pageId }, null, 2) }] }
  },
)

server.tool(
  'ui_runtime_get_state',
  '获取 server 侧运行态 state（需先 init）',
  {
    pageId: z.string(),
    key: z.string().optional(),
  },
  async ({ pageId, key }) => {
    const rt = runtimeState.get(pageId)
    if (!rt) throw new Error(`未初始化 pageId: ${pageId}`)
    const value = key ? deepGet(rt.state, key) : rt.state
    return { content: [{ type: 'text', text: JSON.stringify({ pageId, key: key || null, value }, null, 2) }] }
  },
)

server.tool(
  'ui_runtime_set_state',
  '设置 server 侧运行态 state（需先 init）',
  {
    pageId: z.string(),
    key: z.string(),
    value: z.any(),
  },
  async ({ pageId, key, value }) => {
    const rt = runtimeState.get(pageId)
    if (!rt) throw new Error(`未初始化 pageId: ${pageId}`)
    deepSet(rt.state, key, value)
    return { content: [{ type: 'text', text: JSON.stringify({ ok: true }, null, 2) }] }
  },
)

server.tool(
  'ui_runtime_dispatch',
  '在 server 内执行一个 action（仅支持少量内建 action：ui.setVisible / form.reset）',
  {
    pageId: z.string(),
    actionId: z.string(),
    payload: z.any().optional(),
  },
  async ({ pageId, actionId, payload }) => {
    const rt = runtimeState.get(pageId)
    if (!rt) throw new Error(`未初始化 pageId: ${pageId}`)
    const action = (rt.schema.actions || []).find((a) => a && a.id === actionId)
    if (!action) throw new Error(`未找到 action: ${actionId}`)

    if (action.type === 'ui.setVisible') {
      const key = action.args && action.args.key ? String(action.args.key) : ''
      const value =
        action.args && Object.prototype.hasOwnProperty.call(action.args, 'value')
          ? Boolean(action.args.value)
          : true
      if (!key) throw new Error('ui.setVisible 缺少 args.key')
      deepSet(rt.state, key, value)
      return { content: [{ type: 'text', text: JSON.stringify({ ok: true }, null, 2) }] }
    }

    if (action.type === 'form.reset') {
      const key = action.args && action.args.targetStateKey ? String(action.args.targetStateKey) : ''
      if (!key) throw new Error('form.reset 缺少 targetStateKey')
      deepSet(rt.state, key, {})
      return { content: [{ type: 'text', text: JSON.stringify({ ok: true }, null, 2) }] }
    }

    if (action.type === 'custom') {
      return { content: [{ type: 'text', text: JSON.stringify({ ok: true, note: 'custom action 在 server 侧未执行' }, null, 2) }] }
    }

    return { content: [{ type: 'text', text: JSON.stringify({ ok: false, note: `暂不支持的 action type: ${action.type}`, payload: payload ?? null }, null, 2) }] }
  },
)

// ============================================================
// 🆕 新增工具：模板查询 + 配置校验
// ============================================================

server.tool(
  'ui_schema_templates',
  '查询 Schema 组件模板和字段说明。支持 component 限定类型，不传则返回全部。可用 component: button / field / tableColumn / tableNode / modalFormNode / formNode / action / linkageRule / formEffect / requestConfig / dataSource / fullPage',
  {
    component: z
      .enum([
        'button',
        'field',
        'tableColumn',
        'tableNode',
        'modalFormNode',
        'formNode',
        'action',
        'linkageRule',
        'formEffect',
        'requestConfig',
        'dataSource',
        'fullPage',
      ])
      .optional(),
    includeExamples: z.boolean().optional().describe('是否包含示例集合（默认 true）'),
  },
  async ({ component, includeExamples }) => {
    const withExamples = includeExamples !== false
    const all = SCHEMA_TEMPLATES
    if (!component) {
      const out = {}
      for (const k of Object.keys(all)) {
        out[k] = withExamples
          ? all[k]
          : Object.fromEntries(
              Object.entries(all[k]).filter(([kk]) => kk !== '示例集合' && kk !== '示例'),
            )
      }
      return { content: [{ type: 'text', text: JSON.stringify(out, null, 2) }] }
    }
    const data = all[component]
    if (!data) {
      return { content: [{ type: 'text', text: `没有找到 component="${component}"，请从支持的列表中选择` }] }
    }
    const sliced = withExamples
      ? data
      : Object.fromEntries(Object.entries(data).filter(([k]) => k !== '示例集合' && k !== '示例'))
    return { content: [{ type: 'text', text: JSON.stringify({ [component]: sliced }, null, 2) }] }
  },
)

server.tool(
  'ui_schema_validate_button',
  '单独校验一个 button 配置对象是否合法，返回错误列表；写配置前可先调此工具检查',
  {
    button: z.any().describe('完整的按钮配置对象，例如 { key, text, placement, action, ... }'),
  },
  async ({ button }) => {
    const errors = validateButton(button, 'button')
    return {
      content: [
        {
          type: 'text',
          text: errors.length
            ? `❌ button 配置发现 ${errors.length} 个错误:\n- ${errors.join('\n- ')}`
            : '✅ button 配置合法，无错误。可以安全写入 Schema。',
        },
      ],
    }
  },
)

server.tool(
  'ui_schema_validate_field',
  '单独校验一个表单 field 配置对象是否合法（含 linkage 规则）',
  {
    field: z.any().describe('完整的字段配置对象，如 { key, label, placeholder, required, linkage... }'),
  },
  async ({ field }) => {
    const errors = validateField(field, 'field')
    return {
      content: [
        {
          type: 'text',
          text: errors.length
            ? `❌ field 配置发现 ${errors.length} 个错误:\n- ${errors.join('\n- ')}`
            : '✅ field 配置合法。',
        },
      ],
    }
  },
)

server.tool(
  'ui_schema_validate_action',
  '单独校验一个 action 配置对象是否合法（包含各 type 的 args 结构校验）',
  {
    action: z.any().describe('完整的动作对象，如 { id, type, args: {...} }'),
  },
  async ({ action }) => {
    const errors = validateAction(action, 'action')
    return {
      content: [
        {
          type: 'text',
          text: errors.length
            ? `❌ action 配置发现 ${errors.length} 个错误:\n- ${errors.join('\n- ')}`
            : '✅ action 配置合法。注意：请确保 action.id 在整个页面中唯一。',
        },
      ],
    }
  },
)

server.tool(
  'ui_schema_validate_schema',
  '完整校验整页 pageSchema.json 是否合法（顶层 + nodes + actions + 按钮引用actionId一致性）',
  {
    schema: z.any().describe('完整的页面 Schema（从 ui_schema_get_page 拿到的整个对象，或组装好的新对象）'),
  },
  async ({ schema }) => {
    const errors = validateSchemaDeep(schema)
    return {
      content: [
        {
          type: 'text',
          text: errors.length
            ? `❌ 页面 Schema 校验发现 ${errors.length} 个错误:\n- ${errors.map((e, i) => `${i + 1}. ${e}`).join('\n- ')}`
            : '✅ 页面 Schema 完全合法，可以安全写入/提交。',
        },
      ],
    }
  },
)

if (process.argv.includes('--print-root') || process.argv.includes('--debug-root')) {
  process.stdout.write(String(repoRoot) + '\n')
  process.exit(0)
}

const transport = new StdioServerTransport()
await server.connect(transport)
