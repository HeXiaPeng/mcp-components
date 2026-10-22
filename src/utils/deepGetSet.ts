export function deepGet(obj: any, path: string): any {
  if (!path) return obj
  const parts = path.split('.')
  let cur = obj
  for (const p of parts) {
    if (cur == null) return undefined
    cur = cur[p]
  }
  return cur
}

export function deepSet(obj: any, path: string, value: any) {
  if (!path) return
  const parts = path.split('.')
  let cur = obj
  for (let i = 0; i < parts.length - 1; i += 1) {
    const p = parts[i]
    if (cur[p] == null || typeof cur[p] !== 'object') cur[p] = {}
    cur = cur[p]
  }
  cur[parts[parts.length - 1]] = value
}

