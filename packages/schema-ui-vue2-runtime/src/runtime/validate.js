export function validatePageSchema(schema) {
  const errors = []
  if (!schema || typeof schema !== 'object') {
    return [{ path: '', message: 'schema 必须是对象' }]
  }
  if (schema.schemaVersion !== 1) {
    errors.push({ path: 'schemaVersion', message: 'schemaVersion 必须为 1' })
  }
  if (!schema.pageId || typeof schema.pageId !== 'string') {
    errors.push({ path: 'pageId', message: 'pageId 必须为字符串' })
  }
  if (!Array.isArray(schema.nodes)) {
    errors.push({ path: 'nodes', message: 'nodes 必须为数组' })
  }
  if (!Array.isArray(schema.actions)) {
    errors.push({ path: 'actions', message: 'actions 必须为数组' })
  }
  if (Array.isArray(schema.nodes)) {
    for (let i = 0; i < schema.nodes.length; i += 1) {
      const n = schema.nodes[i]
      if (!n || typeof n !== 'object') {
        errors.push({ path: `nodes[${i}]`, message: '节点必须为对象' })
        continue
      }
      if (!n.id || typeof n.id !== 'string') {
        errors.push({ path: `nodes[${i}].id`, message: '节点 id 必须为字符串' })
      }
      if (n.type !== 'table' && n.type !== 'modalForm' && n.type !== 'form') {
        errors.push({ path: `nodes[${i}].type`, message: '节点 type 必须为 table / modalForm / form' })
      }
      if (n.type === 'table') {
        if (!n.dataSourceId || typeof n.dataSourceId !== 'string') {
          errors.push({ path: `nodes[${i}].dataSourceId`, message: 'table 节点 dataSourceId 必须为字符串' })
        }
        if (!Array.isArray(n.columns)) {
          errors.push({ path: `nodes[${i}].columns`, message: 'table 节点 columns 必须为数组' })
        }
      }
      if (n.type === 'modalForm') {
        if (!n.modal || typeof n.modal !== 'object') {
          errors.push({ path: `nodes[${i}].modal`, message: 'modalForm 节点 modal 必须为对象' })
        }
        if (!n.visibleStateKey || typeof n.visibleStateKey !== 'string') {
          errors.push({ path: `nodes[${i}].visibleStateKey`, message: 'modalForm 节点 visibleStateKey 必须为字符串' })
        }
        if (!n.onSubmitAction || typeof n.onSubmitAction !== 'string') {
          errors.push({ path: `nodes[${i}].onSubmitAction`, message: 'modalForm 节点 onSubmitAction 必须为字符串' })
        }
      }
      if (n.type === 'form') {
        if (!n.modelStateKey || typeof n.modelStateKey !== 'string') {
          errors.push({ path: `nodes[${i}].modelStateKey`, message: 'form 节点 modelStateKey 必须为字符串' })
        }
        if (!Array.isArray(n.fields)) {
          errors.push({ path: `nodes[${i}].fields`, message: 'form 节点 fields 必须为数组' })
        }
      }
    }
  }
  if (Array.isArray(schema.actions)) {
    for (let i = 0; i < schema.actions.length; i += 1) {
      const a = schema.actions[i]
      if (!a || typeof a !== 'object') {
        errors.push({ path: `actions[${i}]`, message: 'action 必须为对象' })
        continue
      }
      if (!a.id || typeof a.id !== 'string') {
        errors.push({ path: `actions[${i}].id`, message: 'action id 必须为字符串' })
      }
      if (!a.type || typeof a.type !== 'string') {
        errors.push({ path: `actions[${i}].type`, message: 'action type 必须为字符串' })
      }
    }
  }
  return errors
}

export function assertValidPageSchema(schema) {
  const errors = validatePageSchema(schema)
  if (errors.length === 0) return
  const msg = errors.map((e) => `${e.path}: ${e.message}`).join('\n')
  throw new Error(msg)
}
