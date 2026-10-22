export const topRightButtons = [
  {
    key: 'create',
    text: '新增服务器',
    type: 'primary',
    placement: 'topRight',
    action: 'mcpServers.openCreate',
  },
  {
    key: 'query',
    text: '查询筛选',
    placement: 'topRight',
    action: 'mcpServers.openQuery',
  },
  {
    key: 'refresh',
    text: '刷新列表',
    placement: 'topRight',
    action: 'mcpServers.refresh',
  },
]

export const rowRightButtons = [
  {
    key: 'toggle',
    text: '启动/停止',
    placement: 'rowRight',
    action: 'mcpServers.toggleStatus',
  },
  {
    key: 'edit',
    text: '编辑',
    placement: 'rowRight',
    action: 'mcpServers.openEdit',
  },
  {
    key: 'restart',
    text: '重启',
    placement: 'rowRight',
    action: 'mcpServers.restart',
  },
  {
    key: 'delete',
    text: '删除',
    placement: 'rowRight',
    action: 'mcpServers.deleteRow',
    danger: true,
    confirm: {
      title: '确认删除该 MCP 服务器吗？',
    },
  },
]
