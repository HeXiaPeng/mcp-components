<template>
  <div class="card-demo-detail">
    <SchemaCard :config="cardConfig">
      <div v-if="row" class="card-demo-detail__grid">
        <div v-for="item in items" :key="item.label" class="card-demo-detail__item">
          <div class="card-demo-detail__label">{{ item.label }}</div>
          <div class="card-demo-detail__value">{{ item.value }}</div>
        </div>
      </div>
      <a-empty v-else description="未找到该工单" />

      <template #footer>
        <a-button @click="onBack">返回列表</a-button>
      </template>
    </SchemaCard>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { SchemaCard, type SchemaCardConfig } from 'schema-ui-vue2-runtime'
import { initialWorkOrders, type WorkOrderRow } from './mock'

export default Vue.extend({
  name: 'CardDemoDetailPage',
  components: { SchemaCard },
  computed: {
    code(): string {
      return String(this.$route.params.code || '')
    },
    row(): WorkOrderRow | undefined {
      return initialWorkOrders.find((item) => item.code === this.code)
    },
    cardConfig(): SchemaCardConfig {
      return { title: this.row ? `工单详情 · ${this.row.code}` : '工单详情' }
    },
    items(): { label: string; value: string }[] {
      const row = this.row
      if (!row) return []
      return [
        { label: '工单号', value: row.code },
        { label: '标题', value: row.title },
        { label: '状态', value: row.status },
        { label: '处理人', value: row.owner },
        { label: '创建时间', value: row.createdAt },
      ]
    },
  },
  methods: {
    onBack() {
      this.$router.push({ name: 'card-demo' })
    },
  },
})
</script>

<style scoped>
.card-demo-detail__grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.card-demo-detail__item {
  min-width: 220px;
}

.card-demo-detail__label {
  margin-bottom: 4px;
  color: rgba(0, 0, 0, 0.45);
  font-size: 13px;
}

.card-demo-detail__value {
  color: rgba(0, 0, 0, 0.85);
  font-size: 15px;
}
</style>
