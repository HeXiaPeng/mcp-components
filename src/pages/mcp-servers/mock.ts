export interface McpServerItem {
  id: string
  name: string
  command: string
  args: string
  status: 'running' | 'stopped' | 'error'
  toolsCount: number
  createdAt: string
  lastUsedAt: string
  description: string
}

export const initialMcpServers: McpServerItem[] = [
  {
    id: 'MCP-001',
    name: 'mcp-components-ui-schema',
    command: 'npm',
    args: 'run dev',
    status: 'running',
    toolsCount: 8,
    createdAt: '2026-08-01 10:30',
    lastUsedAt: '2026-08-21 09:15',
    description: 'UI Schema 配置管理服务器，提供页面 Schema CRUD 和运行态管理',
  },
  {
    id: 'MCP-002',
    name: 'mcp-server-filesystem',
    command: 'npx',
    args: '-y @modelcontextprotocol/server-filesystem',
    status: 'running',
    toolsCount: 5,
    createdAt: '2026-08-03 14:20',
    lastUsedAt: '2026-08-20 18:42',
    description: '本地文件系统读写服务器，支持文件和目录的增删改查',
  },
  {
    id: 'MCP-003',
    name: 'mcp-server-github',
    command: 'npx',
    args: '-y @modelcontextprotocol/server-github',
    status: 'stopped',
    toolsCount: 12,
    createdAt: '2026-08-05 16:08',
    lastUsedAt: '2026-08-18 11:20',
    description: 'GitHub API 集成服务器，支持 Issue、PR、仓库管理等操作',
  },
  {
    id: 'MCP-004',
    name: 'mcp-server-postgres',
    command: 'python3',
    args: '-m mcp_postgres',
    status: 'error',
    toolsCount: 6,
    createdAt: '2026-08-08 09:55',
    lastUsedAt: '2026-08-19 15:33',
    description: 'PostgreSQL 数据库操作服务器，支持查询、表结构管理等',
  },
  {
    id: 'MCP-005',
    name: 'mcp-server-browser',
    command: 'npx',
    args: '-y @browser-use/mcp',
    status: 'running',
    toolsCount: 15,
    createdAt: '2026-08-10 11:12',
    lastUsedAt: '2026-08-21 08:50',
    description: '浏览器自动化服务器，支持网页导航、截图、交互操作',
  },
]
