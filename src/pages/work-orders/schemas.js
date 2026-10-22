export const createModalSchema = {
  title: '新增工单',
  width: 640,
  submitText: '提交',
  cancelText: '取消',
  fields: [
    {
      key: 'code',
      label: '工单号',
      placeholder: '例如：WO-1001',
      required: true,
    },
    {
      key: 'title',
      label: '标题',
      placeholder: '请输入工单标题',
      required: true,
      linkage: [
        {
          when: { field: 'status', equals: '关闭' },
          then: { disabled: true },
        },
      ],
    },
    {
      key: 'status',
      label: '状态',
      placeholder: '待处理 / 处理中 / 关闭',
      required: true,
    },
    {
      key: 'owner',
      label: '处理人',
      placeholder: '请输入处理人',
      linkage: [
        {
          when: { field: 'status', equals: '关闭' },
          then: { disabled: true, setValue: '系统' },
        },
      ],
    },
  ],
}

export const editModalSchema = {
  ...createModalSchema,
  title: '编辑工单',
}

export const queryModalSchema = {
  title: '查询',
  width: 560,
  submitText: '查询',
  cancelText: '取消',
  fields: [
    {
      key: 'keyword',
      label: '关键字',
      placeholder: '工单号 / 标题',
    },
    {
      key: 'status',
      label: '状态',
      placeholder: '待处理 / 处理中 / 关闭',
    },
  ],
}
