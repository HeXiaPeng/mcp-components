<template>
  <div class="project-workorders-page">
    <SchemaRenderer v-if="runtime" :schema="schema" :runtime="runtime">
      <template #beforeNode-queryForm>
        <a-alert
          v-if="matchedProjects.length > 1"
          type="info"
          show-icon
          style="margin-bottom: 12px"
          :message="`当前查询条件命中 ${matchedProjects.length} 个项目，以下自动展示第一个：${currentProject && currentProject.name}`"
        />
        <a-alert
          v-else-if="!currentProject"
          type="warning"
          show-icon
          style="margin-bottom: 12px"
          message="未找到匹配的项目，请调整上方「客户 / 项目」查询条件后点击查询"
        />
      </template>

      <template #betweenNodes_placeholder>
        <!-- 由 #beforeNode-pendingWoTable 注入项目信息 Card 和 待创建工单选择提示 -->
      </template>

      <template #beforeNode-pendingWoTable>
        <a-card
          v-if="currentProject"
          class="project-card"
          :bordered="false"
          :title="$createElement('span', { style: { fontSize: '16px' } }, [currentProject.name])"
          :key="'proj-' + currentProject.id"
        >
          <a-row :gutter="24">
            <a-col :span="8">
              <div class="kv-item">
                <span class="kv-label">项目编号：</span>
                <a-tag color="blue">{{ currentProject.id }}</a-tag>
              </div>
            </a-col>
            <a-col :span="8">
              <div class="kv-item">
                <span class="kv-label">所属客户：</span>
                <span class="kv-value">{{ currentProject.customerName }}</span>
              </div>
            </a-col>
            <a-col :span="8">
              <div class="kv-item">
                <span class="kv-label">项目经理：</span>
                <span class="kv-value">{{ currentProject.projectManager }}</span>
              </div>
            </a-col>
            <a-col :span="8">
              <div class="kv-item">
                <span class="kv-label">项目状态：</span>
                <a-tag :color="statusTagColor(currentProject.status)">{{ currentProject.status }}</a-tag>
              </div>
            </a-col>
            <a-col :span="8">
              <div class="kv-item">
                <span class="kv-label">项目周期：</span>
                <span class="kv-value">{{ currentProject.startDate }} ~ {{ currentProject.endDate }}</span>
              </div>
            </a-col>
            <a-col :span="8">
              <div class="kv-item">
                <span class="kv-label">项目预算：</span>
                <span class="kv-value">¥ {{ formatNumber(currentProject.budget) }}</span>
              </div>
            </a-col>
            <a-col :span="24">
              <div class="kv-item">
                <span class="kv-label">项目描述：</span>
                <span class="kv-value">{{ currentProject.description }}</span>
              </div>
            </a-col>
          </a-row>
        </a-card>

        <div v-if="currentProject && pendingCountInfo.total > 0" class="selection-tip-bar">
          <a-alert
            type="info"
            show-icon
            :message="`当前项目共有 ${pendingCountInfo.total} 条待创建工单，已选择 ${selectedIds.length} 条。请在下方表格勾选后点击「批量创建工单」，或在单行点击「创建工单」。`"
          />
        </div>
      </template>
    </SchemaRenderer>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import schema from './pageSchema.json'
import {
  customerOptions,
  projectList,
  pendingWorkOrdersMap,
  prodIdOptions,
  initialCreatedWorkOrders,
  type ProjectInfo,
  type PendingWorkOrder,
  type CreatedWorkOrder,
  type ProdIdOption,
} from './mock'
import SchemaRenderer from '@/renderer/SchemaRenderer.vue'
import { createSchemaRuntime } from '@/runtime/createRuntime'
import { createFetchRequestAdapter } from '@/runtime/adapters/request'
import { createMemoryDataSource } from '@/runtime/adapters/memoryDataSource'
import type { SchemaRuntime } from '@/runtime/types'

function formatNow(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function formatNumber(n: number): string {
  if (!n && n !== 0) return '-'
  return Number(n).toLocaleString('zh-CN')
}

function statusTagColor(status: string): string {
  switch (status) {
    case '进行中':
      return 'blue'
    case '待启动':
      return 'orange'
    case '已完成':
      return 'green'
    default:
      return 'default'
  }
}

function nextWoId(): string {
  const seq = String(Date.now()).slice(-4)
  return `WO-${seq}`
}

export default Vue.extend({
  name: 'ProjectWorkOrdersPage',
  components: { SchemaRenderer },
  data() {
    return {
      schema: schema as any,
      runtime: null as SchemaRuntime | null,
    }
  },
  computed: {
    currentProject(): ProjectInfo | null {
      if (!this.runtime) return null
      const pid = this.runtime.getState('ui.currentProjectId')
      if (!pid) return null
      const hit = projectList.find((p) => p.id === String(pid))
      return hit || null
    },
    matchedProjects(): ProjectInfo[] {
      if (!this.runtime) return []
      const qf = (this.runtime.getState('ui.queryForm') as any) || {}
      const kwC = String(qf.customerName || '').trim()
      const kwP = String(qf.projectName || '').trim()
      return projectList.filter((p) => {
        const matchC = !kwC || p.customerName.includes(kwC) || p.customerId.toLowerCase().includes(kwC.toLowerCase())
        const matchP = !kwP || p.name.includes(kwP) || p.id.toLowerCase().includes(kwP.toLowerCase())
        return matchC && matchP
      })
    },
    selectedIds(): (string | number)[] {
      if (!this.runtime) return []
      const v = this.runtime.getState('ui.selectedPendingIds')
      return Array.isArray(v) ? v : []
    },
    pendingCountInfo(): { total: number } {
      const pid = this.currentProject && this.currentProject.id
      if (!pid) return { total: 0 }
      const list = pendingWorkOrdersMap[pid] || []
      return { total: list.length }
    },
  },
  created() {
    const request = createFetchRequestAdapter()
    const pendingDs = createMemoryDataSource<PendingWorkOrder>({
      initialRows: [],
      filter(row, filter) {
        const keyword = filter && filter.keyword ? String(filter.keyword).trim() : ''
        if (!keyword) return true
        return (
          row.id.includes(keyword) ||
          row.title.includes(keyword) ||
          row.description.includes(keyword) ||
          row.type.includes(keyword)
        )
      },
    })

    const createdDs = createMemoryDataSource<CreatedWorkOrder>({
      initialRows: initialCreatedWorkOrders || [],
      sort(a, b) {
        return String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
      },
    })

    this.runtime = createSchemaRuntime(this.schema as any, {
      request,
      dataSources: {
        pendingWorkOrders: pendingDs,
        createdWorkOrders: createdDs,
      },
      notify: {
        success: (msg) => (this as any).$message.success(msg),
        error: (msg) => (this as any).$message.error(msg),
        loading: (msg, durationSeconds) => (this as any).$message.loading(msg, durationSeconds),
        info: (title, content) => (this as any).$info({ title, content }),
      },
      resolveFieldOptions: (field: any) => this.resolveFieldOptions(field),
      onCustomAction: async ({ actionId, payload, runtime }) => {
        const values = payload && payload.values ? (payload.values as Record<string, any>) : undefined

        if (actionId === 'projectWo.doSearch') {
          this.doSearch(pendingDs, runtime)
          return
        }

        if (actionId === 'projectWo.downloadExcel') {
          this.downloadExcel()
          return
        }

        if (actionId === 'projectWo.openBatchCreate') {
          const ids = (runtime.getState('ui.selectedPendingIds') as (string | number)[]) || []
          if (!ids.length) {
            runtime.notify.error('请先勾选至少一条待创建工单后再批量创建')
            return
          }
          runtime.setState('ui.createMode', 'batch')
          runtime.setState('ui.singleTarget', null)
          runtime.setState('ui.prodSelectForm', { prodId: prodIdOptions[0].id })
          runtime.setState('ui.prodSelectVisible', true)
          return
        }

        if (actionId === 'projectWo.openSingleCreate') {
          const record = payload && payload.record ? (payload.record as PendingWorkOrder) : null
          if (!record || !record.id) {
            runtime.notify.error('缺少待创建工单记录信息')
            return
          }
          runtime.setState('ui.createMode', 'single')
          runtime.setState('ui.singleTarget', record)
          runtime.setState('ui.prodSelectForm', { prodId: prodIdOptions[0].id })
          runtime.setState('ui.prodSelectVisible', true)
          return
        }

        if (actionId === 'projectWo.submitCreate') {
          const prodId = values && values.prodId ? String(values.prodId) : ''
          const prod = prodIdOptions.find((p: ProdIdOption) => p.id === prodId)
          if (!prod) {
            runtime.notify.error('请选择一个有效的产品（ProdId）')
            return
          }
          const mode = runtime.getState('ui.createMode')
          let targets: PendingWorkOrder[] = []
          if (mode === 'single') {
            const single = runtime.getState('ui.singleTarget') as PendingWorkOrder
            targets = single ? [single] : []
          } else {
            const ids = (runtime.getState('ui.selectedPendingIds') as (string | number)[]) || []
            const idSet = new Set(ids.map((i) => String(i)))
            const currentProjectId = String(runtime.getState('ui.currentProjectId') || '')
            const pool = pendingWorkOrdersMap[currentProjectId] || []
            targets = pool.filter((p) => idSet.has(String(p.id)))
          }
          if (!targets.length) {
            runtime.notify.error('没有可创建的目标工单')
            return
          }
          const proj = this.currentProject
          const projName = proj ? proj.name : '未知项目'
          const projId = proj ? proj.id : ''
          for (const t of targets) {
            await createdDs.create({
              values: {
                id: nextWoId(),
                title: t.title,
                type: t.type,
                priority: t.priority,
                requester: t.requester,
                expectedAt: t.expectedAt,
                projectId: projId,
                projectName: projName,
                prodId: prod.id,
                prodName: `${prod.name} (${prod.code})`,
                createdAt: formatNow(),
                status: '已创建',
              },
            })
          }
          runtime.notify.success(mode === 'single' ? `已创建 1 条工单，关联产品：${prod.name}` : `已批量创建 ${targets.length} 条工单，关联产品：${prod.name}`)
          runtime.setState('ui.prodSelectVisible', false)
          runtime.setState('ui.createMode', null)
          runtime.setState('ui.singleTarget', null)
          runtime.setState('ui.selectedPendingIds', [])
          await runtime.dispatch({ actionId: 'projectWo.refreshCreated' })
          return
        }

        if (actionId === 'projectWo.refreshPending') {
          await runtime.dispatch({ actionId: 'projectWo.refreshPending' })
          return
        }
      },
    })

    this.doSearch(pendingDs, this.runtime, { fallbackDefaultProject: true })
  },
  methods: {
    statusTagColor,
    formatNumber,
    resolveFieldOptions(field: any): any {
      if (!field || typeof field !== 'object') return field
      const f = { ...field }
      if (String(f.key) === 'prodId') {
        f.inputType = (f as any).inputType || 'radio'
        f.options = prodIdOptions.map((p: ProdIdOption) => ({
          label: `${p.name}（${p.code}）`,
          value: p.id,
          description: p.description,
        }))
      }
      if (String(f.key) === 'customerName' && !(f as any).options) {
        f.options = customerOptions.map((c) => ({ label: c.name, value: c.id }))
      }
      return f
    },
    doSearch(pendingDs: any, runtime: SchemaRuntime, opts?: { fallbackDefaultProject?: boolean }) {
      const matched = this.matchedProjects
      let first = matched[0] || null
      if (!first && opts && opts.fallbackDefaultProject) {
        first = projectList[0] || null
      }
      if (first) {
        runtime.setState('ui.currentProjectId', first.id)
        runtime.setState('ui.currentProject', { ...first })
      } else {
        runtime.setState('ui.currentProjectId', '')
        runtime.setState('ui.currentProject', null)
      }
      const currentId = first ? first.id : ''
      const rows = (pendingWorkOrdersMap[currentId] || []).map((r) => ({ ...r }))
      pendingDs.setRows(rows)
      runtime.setState('ui.selectedPendingIds', [])
      Promise.resolve()
        .then(() => runtime.dispatch({ actionId: 'projectWo.refreshPending' }))
        .catch(() => {})
    },
    downloadExcel() {
      const proj = this.currentProject
      if (!proj) {
        this.runtime && this.runtime.notify.error('请先选择项目后再下载')
        return
      }
      const rows = pendingWorkOrdersMap[proj.id] || []
      const header = ['待创建单号', '标题', '类型', '优先级', '提出人', '期望完成时间', '描述']
      const body = rows.map((r) => [r.id, r.title, r.type, r.priority, r.requester, r.expectedAt, r.description])
      const csv = [header, ...body]
        .map((line) => line.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
        .join('\n')
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `待创建工单_${proj.id}_${proj.name}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      this.runtime && this.runtime.notify.success(`已下载 ${rows.length} 条数据`)
    },
  },
})
</script>

<style scoped>
.project-workorders-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.project-card :deep(.ant-card-head) {
  min-height: 48px;
}
.kv-item {
  display: flex;
  align-items: center;
  padding: 6px 0;
  font-size: 14px;
}
.kv-label {
  color: #8c8c8c;
  width: 88px;
  flex-shrink: 0;
}
.kv-value {
  color: #262626;
}
.selection-tip-bar {
  margin: 0 0 4px;
}
</style>
