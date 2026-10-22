export interface CustomerOption {
  id: string
  name: string
}

export interface ProjectInfo {
  id: string
  name: string
  customerId: string
  customerName: string
  projectManager: string
  status: string
  startDate: string
  endDate: string
  description: string
  budget: number
}

export interface PendingWorkOrder {
  id: string
  title: string
  type: string
  priority: '高' | '中' | '低'
  requester: string
  expectedAt: string
  description: string
  projectId: string
}

export interface ProdIdOption {
  id: string
  name: string
  code: string
  description: string
  price: number
}

export interface CreatedWorkOrder {
  id: string
  title: string
  type: string
  priority: string
  requester: string
  expectedAt: string
  projectId: string
  projectName: string
  prodId: string
  prodName: string
  createdAt: string
  status: string
}

export const customerOptions: CustomerOption[] = [
  { id: 'C001', name: '阿里巴巴集团' },
  { id: 'C002', name: '腾讯科技' },
  { id: 'C003', name: '字节跳动' },
  { id: 'C004', name: '美团点评' },
  { id: 'C005', name: '京东集团' },
]

export const projectList: ProjectInfo[] = [
  {
    id: 'P001',
    name: '阿里云 ECS 资源扩容项目',
    customerId: 'C001',
    customerName: '阿里巴巴集团',
    projectManager: '张三',
    status: '进行中',
    startDate: '2026-03-01',
    endDate: '2026-12-31',
    description: '对阿里巴巴集团华东数据中心 3 号机房进行 ECS 实例扩容，共 200 台高主频实例。',
    budget: 8500000,
  },
  {
    id: 'P002',
    name: '微信支付 V3 对账系统改造',
    customerId: 'C002',
    customerName: '腾讯科技',
    projectManager: '李四',
    status: '进行中',
    startDate: '2026-05-10',
    endDate: '2026-11-30',
    description: '将微信支付 V2 对账系统升级为 V3，优化账单下载与自动比对流程。',
    budget: 3200000,
  },
  {
    id: 'P003',
    name: '抖音内容审核平台私有化',
    customerId: 'C003',
    customerName: '字节跳动',
    projectManager: '王五',
    status: '待启动',
    startDate: '2026-09-01',
    endDate: '2027-06-30',
    description: '内容审核平台私有化部署，部署于北京昌平数据中心，含 50+ 审核模型接入。',
    budget: 12000000,
  },
  {
    id: 'P004',
    name: '美团外卖骑手调度系统',
    customerId: 'C004',
    customerName: '美团点评',
    projectManager: '赵六',
    status: '已完成',
    startDate: '2025-10-01',
    endDate: '2026-06-30',
    description: '优化外卖骑手调度算法，提升高峰期运力利用率 15%。',
    budget: 5800000,
  },
  {
    id: 'P005',
    name: '京东物流 WMS 升级',
    customerId: 'C005',
    customerName: '京东集团',
    projectManager: '孙七',
    status: '进行中',
    startDate: '2026-04-01',
    endDate: '2026-10-31',
    description: '北京亚洲一号仓 WMS 升级到 3.0 版本，引入自动化分拣链路。',
    budget: 7600000,
  },
]

export const pendingWorkOrdersMap: Record<string, PendingWorkOrder[]> = {
  P001: [
    {
      id: 'WO-P001-001',
      title: 'ECS 实例规格选型评估工单',
      type: '评估',
      priority: '高',
      requester: '王运维',
      expectedAt: '2026-08-20',
      description: '根据 200 台实例的业务负载特征，完成 c7/g7/r7 规格选型评估并输出方案。',
      projectId: 'P001',
    },
    {
      id: 'WO-P001-002',
      title: '机房网络拓扑规划工单',
      type: '规划',
      priority: '高',
      requester: '李网络',
      expectedAt: '2026-08-22',
      description: '规划 3 号机房新接入交换机的 VLAN 划分、堆叠链路及上联带宽。',
      projectId: 'P001',
    },
    {
      id: 'WO-P001-003',
      title: '采购申请审批流工单',
      type: '审批',
      priority: '中',
      requester: '赵采购',
      expectedAt: '2026-08-25',
      description: '提交 ECS 扩容采购申请，金额 8,500,000，走 CFO 三级审批流程。',
      projectId: 'P001',
    },
    {
      id: 'WO-P001-004',
      title: '机柜上电与验收工单',
      type: '实施',
      priority: '中',
      requester: '钱IDC',
      expectedAt: '2026-09-05',
      description: '对 200 台机柜进行上电检查、IPMI 连通性测试并签署验收单。',
      projectId: 'P001',
    },
    {
      id: 'WO-P001-005',
      title: '上线后 7x24 值守工单',
      type: '运维',
      priority: '低',
      requester: '孙值班',
      expectedAt: '2026-09-20',
      description: '扩容完成后两周内提供 7x24 现场值守支持，每日输出值班日志。',
      projectId: 'P001',
    },
  ],
  P002: [
    {
      id: 'WO-P002-001',
      title: 'V3 API 鉴权对接工单',
      type: '开发',
      priority: '高',
      requester: '周研发',
      expectedAt: '2026-08-21',
      description: '接入微信支付 V3 API，完成证书、签名、AES 解密等鉴权链路调试。',
      projectId: 'P002',
    },
    {
      id: 'WO-P002-002',
      title: '对账数据模型改造工单',
      type: '开发',
      priority: '高',
      requester: '吴数据',
      expectedAt: '2026-08-26',
      description: '将原有分库分表的 T+1 对账模型改造为增量流 + 离线补偿双链路。',
      projectId: 'P002',
    },
    {
      id: 'WO-P002-003',
      title: '沙箱环境联调测试工单',
      type: '测试',
      priority: '中',
      requester: '郑测试',
      expectedAt: '2026-09-02',
      description: '在微信支付沙箱环境完成成功/失败/异常/超时 4 类 30+ case 联调。',
      projectId: 'P002',
    },
  ],
  P003: [
    {
      id: 'WO-P003-001',
      title: '昌平机房硬件环境准备工单',
      type: '实施',
      priority: '高',
      requester: '冯基建',
      expectedAt: '2026-09-15',
      description: '部署 40 台 GPU 服务器 + 10 台 CPU 管理节点，完成 IB 网络布线。',
      projectId: 'P003',
    },
    {
      id: 'WO-P003-002',
      title: '审核模型迁移与调优工单',
      type: '算法',
      priority: '高',
      requester: '陈算法',
      expectedAt: '2026-11-01',
      description: '迁移 50+ 文本/图片/视频审核模型，AUC 指标不低于线上公有云版本。',
      projectId: 'P003',
    },
    {
      id: 'WO-P003-003',
      title: '灰度切流方案工单',
      type: '规划',
      priority: '中',
      requester: '褚架构',
      expectedAt: '2026-12-01',
      description: '设计 1% → 10% → 50% → 100% 的四阶段灰度方案与回滚预案。',
      projectId: 'P003',
    },
    {
      id: 'WO-P003-004',
      title: '客户方使用培训工单',
      type: '培训',
      priority: '低',
      requester: '卫培训',
      expectedAt: '2027-01-10',
      description: '到客户现场完成 2 天管理员 + 审核员角色使用培训，并输出操作手册。',
      projectId: 'P003',
    },
  ],
  P004: [
    {
      id: 'WO-P004-001',
      title: '历史数据归档工单',
      type: '运维',
      priority: '中',
      requester: '蒋DBA',
      expectedAt: '2026-08-28',
      description: '将 2025 年 10 月前历史调度数据归档到冷存储，释放在线库 2TB 空间。',
      projectId: 'P004',
    },
  ],
  P005: [
    {
      id: 'WO-P005-001',
      title: '分拣机链路 PLC 编程工单',
      type: '开发',
      priority: '高',
      requester: '韩工控',
      expectedAt: '2026-09-10',
      description: '编写自动化分拣机 12 道口的 PLC 分拣逻辑与异常停线处理。',
      projectId: 'P005',
    },
    {
      id: 'WO-P005-002',
      title: 'WMS 与 AGV 调度对接工单',
      type: '集成',
      priority: '高',
      requester: '杨集成',
      expectedAt: '2026-09-25',
      description: 'WMS 3.0 通过 ROS bridge 与 20 台潜伏式 AGV 对接，完成入库任务下发。',
      projectId: 'P005',
    },
    {
      id: 'WO-P005-003',
      title: '连续 72 小时压测工单',
      type: '测试',
      priority: '中',
      requester: '朱压测',
      expectedAt: '2026-10-15',
      description: '在模拟双十一流量下进行 72 小时不中断压测，QPS 峰值 120 万。',
      projectId: 'P005',
    },
  ],
}

export const prodIdOptions: ProdIdOption[] = [
  { id: 'PROD-001', name: '标准实施服务', code: 'SVC-STD-IMP', description: '标准实施类服务产品，含 40 人天现场+远程支持', price: 80000 },
  { id: 'PROD-002', name: '高级开发服务', code: 'SVC-ADV-DEV', description: '高级开发服务产品，含资深工程师 60 人天定制开发', price: 180000 },
  { id: 'PROD-003', name: '算法模型调优服务', code: 'SVC-ML-TUNE', description: '算法调优服务产品，含模型迁移、A/B 验证、参数调优', price: 260000 },
  { id: 'PROD-004', name: '测试与质量服务', code: 'SVC-QA-TEST', description: '测试服务产品，含功能/性能/安全三类测试及报告输出', price: 90000 },
  { id: 'PROD-005', name: '运维值守服务', code: 'SVC-OPS-7X24', description: '7x24 运维值守服务，按月计费', price: 120000 },
  { id: 'PROD-006', name: '培训与交付服务', code: 'SVC-TRAIN-DEL', description: '培训服务产品，含现场培训、教材编写、考试认证', price: 40000 },
]

export const initialCreatedWorkOrders: CreatedWorkOrder[] = []
