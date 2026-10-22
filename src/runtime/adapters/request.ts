import type { RequestAdapter } from '@/runtime/types'

export function createFetchRequestAdapter(): RequestAdapter {
  return {
    async requestJson(args) {
      const method = args.method || 'GET'
      const timeoutMs = args.timeoutMs || 8000

      const controller =
        typeof AbortController !== 'undefined' ? new AbortController() : undefined
      const timer = setTimeout(() => {
        if (controller) controller.abort()
      }, timeoutMs)

      try {
        const res = await fetch(args.url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: method === 'GET' ? undefined : JSON.stringify(args.body ?? {}),
          signal: controller ? controller.signal : undefined,
        })

        if (!res.ok) {
          const text = await res.text()
          throw new Error(text || `请求失败: ${res.status}`)
        }

        return await res.json()
      } finally {
        clearTimeout(timer)
      }
    },
  }
}

