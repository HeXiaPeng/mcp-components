import type { SchemaTableColumnConfig } from '@/renderer/schemaTypes'

export const workOrderFields: SchemaTableColumnConfig[] = [
  { key: 'code', title: '工单号', dataIndex: 'code', width: 120 },
  { key: 'title', title: '标题', dataIndex: 'title', width: 260 },
  { key: 'status', title: '状态', dataIndex: 'status', width: 120 },
  { key: 'createdAt', title: '创建时间', dataIndex: 'createdAt', width: 180 },
]

