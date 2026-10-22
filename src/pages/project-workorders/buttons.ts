import type { SchemaButtonConfig } from '@/renderer/schemaTypes'

export const queryBarButtons: SchemaButtonConfig[] = [
  {
    key: 'doSearch',
    text: '查询',
    type: 'primary',
    placement: 'topRight',
    action: 'projectWo.doSearch',
  },
  {
    key: 'downloadExcel',
    text: '下载 Excel',
    placement: 'topRight',
    action: 'projectWo.downloadExcel',
  },
]

export const pendingWoTopButtons: SchemaButtonConfig[] = [
  {
    key: 'batchCreate',
    text: '批量创建工单',
    type: 'primary',
    placement: 'topRight',
    action: 'projectWo.openBatchCreate',
  },
]

export const pendingWoRowButtons: SchemaButtonConfig[] = [
  {
    key: 'createSingle',
    text: '创建工单',
    type: 'primary',
    placement: 'rowRight',
    action: 'projectWo.openSingleCreate',
  },
]

export const createdWoTopButtons: SchemaButtonConfig[] = [
  {
    key: 'refreshCreated',
    text: '刷新',
    placement: 'topRight',
    action: 'projectWo.refreshCreated',
  },
]
