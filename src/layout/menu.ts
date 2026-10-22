export interface AppMenuItem {
  key: string
  label: string
}

export const appMenuItems: AppMenuItem[] = [
  { key: '/runtime-demo', label: '📦 运行时包演示(runtime npm link)' },
  { key: '/work-orders', label: '工单测试页' },
  { key: '/form-linkage', label: '联动表单页' },
  { key: '/mcp-servers', label: 'MCP 服务器管理' },
  { key: '/project-workorders', label: '项目待创建工单' },
]

