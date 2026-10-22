import Vue from 'vue'
import Router from 'vue-router'
import WorkOrdersPage from '@/pages/work-orders/index.vue'
import FormLinkagePage from '@/pages/form-linkage/index.vue'
import McpServersPage from '@/pages/mcp-servers/index.vue'
import ProjectWorkOrdersPage from '@/pages/project-workorders/index.vue'
import RuntimeDemoPage from '@/pages/runtime-demo/index.vue'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      redirect: '/runtime-demo',
    },
    {
      path: '/runtime-demo',
      name: 'runtime-demo',
      component: RuntimeDemoPage,
    },
    {
      path: '/work-orders',
      name: 'work-orders',
      component: WorkOrdersPage,
    },
    {
      path: '/form-linkage',
      name: 'form-linkage',
      component: FormLinkagePage,
    },
    {
      path: '/mcp-servers',
      name: 'mcp-servers',
      component: McpServersPage,
    },
    {
      path: '/project-workorders',
      name: 'project-workorders',
      component: ProjectWorkOrdersPage,
    },
  ],
})
