# schema-ui-vue2-runtime

> Schema 驱动前端组件框架运行时（Vue 2.6 + Ant Design Vue 1.7）。
> 声明式配置 Schema（nodes / actions / initialState / dataSources）即可生成完整 CRUD 后台页面。
> 配合 MCP 服务器 [`mcp-components-ui-schema`](https://www.npmjs.com/package/mcp-components-ui-schema) 可实现**对话生成页面**：说一句话 AI 就帮你写 pageSchema.json。

---

## 一、快速安装

```bash
# 必装 peerDep：使用者自己决定版本
npm i vue@2.6.11 ant-design-vue@1.7.2 vue-router@3.6.5

# 运行时包（核心）
npm i schema-ui-vue2-runtime
```

Vite + Vue 2 + TS 开发依赖（没用 Vite 的话可跳过）：
```bash
npm i -D vite@2.9 vite-plugin-vue2@2.0.3 typescript@5.3 vue-template-compiler@2.6.11 @types/node
```

---

## 二、5 分钟跑通最小页面

### 1. `vite.config.ts` 加 `@` 别名（可选，也可以直接用包名 import）
```ts
import { defineConfig } from 'vite'
import { createVuePlugin } from 'vite-plugin-vue2'
import { fileURLToPath, URL } from 'node:url'
export default defineConfig({
  plugins: [createVuePlugin()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } }
})
```

### 2. `src/main.ts` 注册 Antd（和原项目一致）
```ts
import Vue from 'vue'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/antd.css'
Vue.use(Antd)
```

### 3. 新建 `src/pages/home/index.vue` — 用运行时包直接渲染最小 Schema
```vue
<template>
  <SchemaRenderer v-if="runtime" :schema="schema" :runtime="runtime" />
</template>

<script lang="ts">
import Vue from 'vue'
import {
  SchemaRenderer,
  createSchemaRuntime,
  createFetchRequestAdapter,
  type SchemaRuntime,
} from 'schema-ui-vue2-runtime'

// 一个最小可用的 Schema（0 table 0 form 0 modal）
const pageSchema = {
  schemaVersion: 1,
  pageId: 'home',
  initialState: { msg: 'Hello Schema UI ✅' },
  nodes: [],
  actions: [],
} as const

export default Vue.extend({
  name: 'HomePage',
  components: { SchemaRenderer },
  data() {
    return {
      schema: pageSchema,
      runtime: null as SchemaRuntime | null,
    }
  },
  created() {
    this.runtime = createSchemaRuntime(this.schema as any, {
      request: createFetchRequestAdapter(),
      dataSources: {},
    })
  },
})
</script>
```

### 4. 在 router 里挂上页面 → `npm run dev` 访问
打开对应路由看到页面，说明成功。

---

## 三、对外 API（全部从包名直接 import）

```ts
import {
  // ---------- 组件（8 个） ----------
  SchemaButton,
  SchemaForm,
  SchemaInput,
  SchemaModal,
  SchemaTable,
  Empty,
  AppLayout,            // 左侧菜单 + 右侧内容布局
  AppSider,             // 左侧菜单单独使用

  // ---------- 渲染器（1 个） ----------
  SchemaRenderer,       // ★ 最常用：按 schema.nodes 统一渲染所有节点 + 插槽扩展

  // ---------- 类型定义（schemaTypes） ----------
  // 所有 Schema 配置的类型：
  SchemaTableConfig,
  SchemaTableColumnConfig,
  SchemaFormConfig,
  SchemaFormField,
  SchemaInputConfig,
  SchemaModalConfig,
  SchemaButtonConfig,
  SchemaButtonPlacement,
  SchemaButtonAction,
  RequestAdapter,
  DataSourceAdapter,
  PageAction,
  PageSchema,
  // ...全部直接从包里拿类型提示

  // ---------- 运行时核心 ----------
  createSchemaRuntime,        // ★ 创建 state + action dispatch + dataSource 绑定
  type SchemaRuntime,         // 运行时对象类型（给 data() 用）
  type SchemaRuntimeOptions,
  assertValidPageSchema,

  // ---------- 内置 dataSource / request 适配器 ----------
  createMemoryDataSource,     // ★ Mock 数据源：内存增删改查（快速起页面用）
  createFetchRequestAdapter,  // fetch 请求适配器（远程 API）
  MemoryDataSourceWithReset,  // 带 setRows/getRows 扩展的内存 DS
  type RequestOptions,

  // ---------- 工具函数 ----------
  deepGet, deepSet,           // 点分隔路径深度读写
  applyLinkage,               // 表单联动
  cn,                         // clsx + tailwind-merge

  // ---------- 布局菜单默认值 ----------
  defaultAppMenuItems,        // 默认 []，你可以 import 自己的菜单项覆盖
  type AppMenuItem,
} from 'schema-ui-vue2-runtime'
```

> 💡 提示：**使用者不需要再 import `@/renderer/SchemaRenderer.vue` / `@/runtime/createRuntime` 这类本地路径了**，统一从包名 `schema-ui-vue2-runtime` 拿，IDE 会自动给出完整字段补全 + 类型校验。

---

## 四、创建一个标准 CRUD 页面（6 个文件约定）

```
src/pages/product-management/
├── mock.ts              // 假数据数组 + Product 接口定义
├── fields.ts            // 表格列 + 查询/新增弹窗字段
├── buttons.ts           // 右上角按钮 + 行内操作按钮
├── schemas.ts           // 3 个弹窗 node 定义（新增 / 编辑 / 查询）
├── pageSchema.json      // ★ 整页 Schema：1 table + 3 modal + N actions
└── index.vue            // 页面入口：createSchemaRuntime + 接 custom action
```

不想手动写这 6 个文件？用 MCP 让 AI 写：

> 「帮我在 product-management 页面创建一个产品管理 CRUD，字段：名称、价格、分类、库存、状态（上架/下架）；按钮：查询、新增、批量删除；行内：编辑、删除。mock 8 条。」

AI 会自动用 `ui_schema_templates` → `ui_schema_validate_*` → `ui_schema_put_page` 把整页写好。

---

## 五、配套 MCP 配置（让 AI 帮你写 Schema）⭐

把下面内容粘到你项目根目录的 `.vscode/settings.json`：

```json
{
  "mcpServers": {
    "mcp-components-ui-schema": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-components-ui-schema@latest",
        "--repo-root",
        "${workspaceFolder}"
      ]
    }
  }
}
```

重启 IDE 后：
- 说「列出所有页面」 → 返回 `src/pages/*/pageSchema.json`
- 说「查 button 有哪些字段」 → AI 自动调 `ui_schema_templates(component="button")` 拿出完整模板 + 示例
- 说「给 xxx 页面表格加一列 xxx」 → AI 自动调 `ui_schema_patch_page` 写入 JSON

> 怀疑路径配错？跑 `--print-root` 检查：
> ```bash
> npx -y mcp-components-ui-schema@latest --print-root --repo-root "$PWD"
> ```

---

## 六、版本与依赖说明

| 运行时包 peerDep | 推荐版本 | 兼容性 |
|---|---|---|
| `vue` | **2.6.11** | 不兼容 Vue 3，Vue 3 用户请等下一版 |
| `ant-design-vue` | **1.7.2** | 不兼容 a-d-v 2.x/3.x（它们是 Vue 3 生态） |
| `vue-router` | 3.6.x+ | 可选，你用的布局里若用 `<router-view>` 则必须有 |

---

## 七、从 0 到发 npm（作者视角，非使用者）

```bash
# 构建
cd packages/schema-ui-vue2-runtime
npm install
npm run build
# dist/ 会生成：index.js(ESM) + index.cjs(CJS) + index.d.ts(类型) + ...d.ts

# 本地联调（测试使用者 npm i 效果）
npm link                      # 本包全局软链
cd /某个测试项目
npm link schema-ui-vue2-runtime

# 发布
npm adduser / npm login
npm publish --access=public   # 第一次发用
```
