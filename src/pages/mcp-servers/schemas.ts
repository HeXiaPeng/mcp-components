import type { SchemaModalConfig } from '@/renderer/schemaTypes'

export const createModalSchema: SchemaModalConfig = {
  title: '新增 MCP 服务器',
  width: 680,
  submitText: '确认添加',
  cancelText: '取消',
  fields: [
    {
      key: 'name',
      label: '服务器名称',
      placeholder: '例如：mcp-server-custom',
      required: true,
    },
    {
      key: 'command',
      label: '启动命令',
      placeholder: '例如：npx / npm / python3',
      required: true,
    },
    {
      key: 'args',
      label: '启动参数',
      placeholder: '例如：-y @scope/mcp-server 或 run dev',
      required: true,
    },
    {
      key: 'description',
      label: '功能描述',
      placeholder: '简单描述该 MCP 服务器提供的能力',
      required: false,
    },
  ],
}

export const editModalSchema: SchemaModalConfig = {
  ...createModalSchema,
  title: '编辑 MCP 服务器',
}

export const queryModalSchema: SchemaModalConfig = {
  title: '查询筛选',
  width: 560,
  submitText: '查询',
  cancelText: '重置',
  fields: [
    {
      key: 'keyword',
      label: '关键字',
      placeholder: '服务器名称 / 启动命令',
    },
    {
      key: 'status',
      label: '运行状态',
      placeholder: 'running / stopped / error',
    },
  ],
}
