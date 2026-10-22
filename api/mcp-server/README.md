# MCP UI Schema Server

该目录提供一个最小可用的 MCP Server（stdio 传输），用于演示“对页面 Schema 做 CRUD + 基础运行态 state 管理”的工具化接口。

## 启动

```bash
cd api/mcp-server
npm install
npm run dev
```

## 工具列表（Tools）

- `ui_schema_list_pages`：扫描并列出 `src/pages/**/pageSchema.json`
- `ui_schema_get_page`：读取某个 `pageId` 的 schema
- `ui_schema_put_page`：写入某个 `pageId` 的 schema
- `ui_schema_patch_page`：对 schema 做 JSON Patch（add/replace/remove）
- `ui_runtime_init_page`：加载 schema 并初始化 server 内存态 state
- `ui_runtime_get_state`：读取 server 内存态 state
- `ui_runtime_set_state`：写入 server 内存态 state
- `ui_runtime_dispatch`：执行少量内建 action（示例：`ui.setVisible`、`form.reset`）

## 说明

当前 server 侧的 `dispatch` 只实现了最小子集，用于验证工具链与 schema 的可控性；后续可把前端 runtime 的 ActionRunner/DataSource 机制逐步迁移到 server 侧，形成完整闭环。

