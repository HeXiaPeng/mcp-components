import { queryFields, prodSelectFields, createdWoColumns } from './fields'
import { queryBarButtons, pendingWoTopButtons, pendingWoRowButtons, createdWoTopButtons } from './buttons'

export const queryFormSchema = {
  id: 'queryForm',
  type: 'form',
  title: '查询条件',
  modelStateKey: 'ui.queryForm',
  fields: queryFields,
  buttons: queryBarButtons,
}

export const pendingWoTableSchema = {
  id: 'pendingWoTable',
  type: 'table',
  title: '待创建工单',
  dataSourceId: 'pendingWorkOrders',
  rowKey: 'id',
  columns: [
    { key: 'code', title: '待创建单号', dataIndex: 'id', width: 130 },
    { key: 'title', title: '标题', dataIndex: 'title', width: 240 },
    { key: 'type', title: '类型', dataIndex: 'type', width: 80 },
    { key: 'priority', title: '优先级', dataIndex: 'priority', width: 80 },
    { key: 'requester', title: '提出人', dataIndex: 'requester', width: 90 },
    { key: 'expectedAt', title: '期望完成时间', dataIndex: 'expectedAt', width: 140 },
    { key: 'description', title: '描述', dataIndex: 'description' },
  ],
  topRightButtons: pendingWoTopButtons,
  rowRightButtons: pendingWoRowButtons,
}

export const prodSelectModalSchema = {
  id: 'prodSelectModal',
  type: 'modalForm',
  visibleStateKey: 'ui.prodSelectVisible',
  valueStateKey: 'ui.prodSelectForm',
  onSubmitAction: 'projectWo.submitCreate',
  modal: {
    title: '请选择产品（ProdId）',
    width: 520,
    submitText: '确认创建',
    cancelText: '取消',
    fields: prodSelectFields,
  },
}

export const createdWoTableSchema = {
  id: 'createdWoTable',
  type: 'table',
  title: '已创建的工单',
  dataSourceId: 'createdWorkOrders',
  rowKey: 'id',
  columns: createdWoColumns,
  topRightButtons: createdWoTopButtons,
}
