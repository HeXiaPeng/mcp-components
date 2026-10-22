import { prodIdOptions } from './mock'

export const queryFields = [
  { key: 'customerName', label: '客户', placeholder: '请输入客户名称（如：阿里巴巴）', col: 12 },
  { key: 'projectName', label: '项目', placeholder: '请输入项目名称（如：ECS 扩容）', col: 12 },
]

export const prodSelectFields = [
  {
    key: 'prodId',
    label: '产品（ProdId）',
    placeholder: '请选择一个产品',
    required: true,
    inputType: 'radio',
    defaultValue: (prodIdOptions[0] && prodIdOptions[0].id) || '',
    options: prodIdOptions.map((p) => ({
      label: `${p.name}（${p.code}）`,
      value: p.id,
      description: p.description,
    })),
  },
]

export const createdWoColumns = [
  { key: 'code', title: '工单号', dataIndex: 'id', width: 140 },
  { key: 'title', title: '标题', dataIndex: 'title', width: 240 },
  { key: 'type', title: '类型', dataIndex: 'type', width: 80 },
  { key: 'priority', title: '优先级', dataIndex: 'priority', width: 80 },
  { key: 'prodName', title: '关联产品', dataIndex: 'prodName', width: 160 },
  { key: 'requester', title: '提出人', dataIndex: 'requester', width: 90 },
  { key: 'createdAt', title: '创建时间', dataIndex: 'createdAt', width: 160 },
]
