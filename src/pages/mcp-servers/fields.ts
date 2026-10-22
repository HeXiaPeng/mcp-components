import type { SchemaTableColumnConfig } from '@/renderer/schemaTypes'

export const mcpServerFields: SchemaTableColumnConfig[] = [
  { key: 'name', title: '服务器名称', dataIndex: 'name', width: 260 },
  { key: 'command', title: '启动命令', dataIndex: 'command', width: 120 },
  { key: 'args', title: '启动参数', dataIndex: 'args', width: 320 },
  { key: 'status', title: '运行状态', dataIndex: 'status', width: 120 },
  { key: 'toolsCount', title: '工具数', dataIndex: 'toolsCount', width: 100 },
  { key: 'lastUsedAt', title: '最近使用', dataIndex: 'lastUsedAt', width: 180 },
  { key: 'createdAt', title: '创建时间', dataIndex: 'createdAt', width: 180 },
]
