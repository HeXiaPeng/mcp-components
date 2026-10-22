export type SchemaSize = 'small' | 'default' | 'large'

export type ButtonPlacement = 'topRight' | 'rowRight'

export type ButtonAction = string

export interface SchemaRequestConfig {
  urlTemplate: string
  method?: 'GET' | 'POST'
  timeoutMs?: number
  mapToForm?: Record<string, string>
}

export interface SchemaButtonConfig {
  key: string
  text: string
  type?: 'default' | 'primary' | 'dashed' | 'link'
  placement: ButtonPlacement
  action: ButtonAction
  danger?: boolean
  confirm?: {
    title: string
  }
  request?: SchemaRequestConfig
  meta?: Record<string, any>
}

export interface SchemaCardConfig {
  title?: string
  bordered?: boolean
  hoverable?: boolean
  extraText?: string
}

export interface SchemaFieldLinkageRule {
  when: {
    field: string
    equals: unknown
  }
  then: {
    disabled?: boolean
    visible?: boolean
    setValue?: unknown
  }
}

export interface SchemaInputConfig {
  key: string
  label: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  visible?: boolean
  defaultValue?: unknown
  linkage?: SchemaFieldLinkageRule[]
  col?: number
  inputType?: 'input' | 'radio' | 'select'
  options?: Array<{ label: string; value: string | number; description?: string }>
}

export type SchemaFormEffectType = 'mirror' | 'template'

export interface SchemaFormEffect {
  on: string
  type: SchemaFormEffectType
  target: string
  template?: string
}

export interface SchemaModalConfig {
  title: string
  width?: number
  submitText?: string
  cancelText?: string
  fields: SchemaInputConfig[]
}

export interface SchemaTableColumnConfig {
  key: string
  title: string
  dataIndex: string
  width?: number
  /** 单元格渲染为可点击链接，点击时派发 cell-link-click 事件 */
  link?: boolean
}
