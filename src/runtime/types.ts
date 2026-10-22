import type { SchemaButtonConfig, SchemaModalConfig, SchemaTableColumnConfig } from '@/renderer/schemaTypes'
import type { SchemaFormEffect, SchemaInputConfig } from '@/renderer/schemaTypes'

export type SchemaVersion = 1

export interface RequestAdapter {
  requestJson: (args: {
    url: string
    method?: 'GET' | 'POST'
    body?: any
    timeoutMs?: number
  }) => Promise<any>
}

export interface DataSourceAdapter<Row = any> {
  query: (args?: { filter?: Record<string, any> }) => Promise<Row[]>
  create: (args: { values: Record<string, any> }) => Promise<Row>
  update: (args: { id: string; values: Record<string, any> }) => Promise<Row>
  remove: (args: { id: string }) => Promise<void>
}

export interface PageSchemaTableNode {
  id: string
  type: 'table'
  title?: string
  dataSourceId: string
  rowKey?: string
  columns: SchemaTableColumnConfig[]
  topRightButtons?: SchemaButtonConfig[]
  rowRightButtons?: SchemaButtonConfig[]
}

export interface PageSchemaModalFormNode {
  id: string
  type: 'modalForm'
  modal: SchemaModalConfig
  visibleStateKey: string
  valueStateKey?: string
  onSubmitAction: string
}

export interface PageSchemaFormNode {
  id: string
  type: 'form'
  title?: string
  modelStateKey: string
  fields: SchemaInputConfig[]
  effects?: SchemaFormEffect[]
  buttons?: SchemaButtonConfig[]
}

export type PageSchemaNode = PageSchemaTableNode | PageSchemaModalFormNode | PageSchemaFormNode

export type BuiltinActionType =
  | 'ui.setVisible'
  | 'table.refresh'
  | 'table.deleteRow'
  | 'modal.submitToDataSource'
  | 'request.fillForm'
  | 'form.reset'
  | 'custom'

export interface PageAction {
  id: string
  type: BuiltinActionType
  args?: Record<string, any>
}

export interface PageSchema {
  schemaVersion: SchemaVersion
  pageId: string
  nodes: PageSchemaNode[]
  actions: PageAction[]
  dataSources?: Record<string, any>
  initialState?: Record<string, any>
}

export interface NotifyAdapter {
  success: (msg: string) => void
  info: (title: string, content: string) => void
  error: (msg: string) => void
  loading: (msg: string, durationSeconds?: number) => void
}

export interface SchemaRuntimeOptions {
  request: RequestAdapter
  notify: NotifyAdapter
  dataSources: Record<string, DataSourceAdapter<any>>
  onCustomAction?: (args: { actionId: string; payload?: any; runtime: SchemaRuntime }) => Promise<void> | void
}

export interface TableRuntimeState<Row = any> {
  loading: boolean
  rows: Row[]
  filter?: Record<string, any>
}

export interface SchemaRuntime {
  schema: PageSchema
  state: Record<string, any>
  tables: Record<string, TableRuntimeState<any>>
  dispatch: (args: { actionId: string; payload?: any }) => Promise<void>
  getAction: (actionId: string) => PageAction | undefined
  setState: (key: string, value: any) => void
  getState: (key: string) => any
}
