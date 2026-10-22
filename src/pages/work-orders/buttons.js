export const topRightButtons = [
  {
    key: 'create',
    text: '新增',
    type: 'primary',
    placement: 'topRight',
    action: 'openCreate',
  },
  {
    key: 'query',
    text: '查询',
    placement: 'topRight',
    action: 'openQuery',
  },
]

export const rowRightButtons = [
  {
    key: 'edit',
    text: '编辑',
    placement: 'rowRight',
    action: 'openEdit',
  },
  {
    key: 'delete',
    text: '删除',
    placement: 'rowRight',
    action: 'deleteRow',
    danger: true,
    confirm: {
      title: '确认删除该工单吗？',
    },
  },
]
