import { useState, useEffect, useRef } from 'react'
import { apiRateLimiter } from '../utils/apiRateLimiter'

interface UseApiStateResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  retry: () => void
  queued: boolean
}

export function useApiState<T>(
  fetchFn: () => Promise<T>,
  deps: any[] = []
): UseApiStateResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [queued, setQueued] = useState(false)
  const mountedRef = useRef(true)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetch = async () => {
    if (!mountedRef.current) return

    setLoading(true)
    setError(null)
    setQueued(apiRateLimiter.getQueueSize() > 0)

    try {
      abortControllerRef.current = new AbortController()
      const result = await apiRateLimiter.throttle(() => fetchFn())

      if (mountedRef.current) {
        setData(result)
        setQueued(false)
      }
    } catch (err) {
      if (mountedRef.current && !(err instanceof Error && err.name === 'AbortError')) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
        setQueued(false)
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }

  const retry = () => {
    fetch()
  }

  useEffect(() => {
    mountedRef.current = true
    fetch()

    return () => {
      mountedRef.current = false
      abortControllerRef.current?.abort()
    }
  }, deps)

  return { data, loading, error, retry, queued }
}
