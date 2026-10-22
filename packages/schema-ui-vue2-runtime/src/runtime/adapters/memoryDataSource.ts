import type { DataSourceAdapter } from '../types'

export function createMemoryDataSource<Row extends { id: string }>(args: {
  initialRows: Row[]
  filter?: (row: Row, filter?: Record<string, any>) => boolean
  sort?: (a: Row, b: Row) => number
}): DataSourceAdapter<Row> & { setRows(next: Row[]): void; getRows(): Row[] } {
  let rows = [...args.initialRows]

  return {
    async query(queryArgs) {
      const filter = queryArgs && queryArgs.filter ? queryArgs.filter : undefined
      let result: Row[] = !args.filter ? [...rows] : rows.filter((r) => args.filter!(r, filter))
      if (args.sort) result = [...result].sort(args.sort)
      return result
    },
    async create(createArgs) {
      const id = String(createArgs.values.id || createArgs.values.code || `ROW-${Date.now()}`)
      const next: any = { ...createArgs.values, id }
      rows = [next, ...rows]
      return next as Row
    },
    async update(updateArgs) {
      const idx = rows.findIndex((r) => r.id === updateArgs.id)
      if (idx < 0) throw new Error('记录不存在')
      const next: any = { ...rows[idx], ...updateArgs.values, id: updateArgs.id }
      rows = rows.map((r) => (r.id === updateArgs.id ? next : r))
      return next as Row
    },
    async remove(removeArgs) {
      rows = rows.filter((r) => r.id !== removeArgs.id)
    },
    setRows(next: Row[]) {
      rows = Array.isArray(next) ? [...next] : []
    },
    getRows() {
      return [...rows]
    },
  }
}

