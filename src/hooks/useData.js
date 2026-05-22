import { useState, useEffect, useRef, useCallback } from 'react'

export function useData(fetchFn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const fetchRef = useRef(fetchFn)

  useEffect(() => {
    fetchRef.current = fetchFn
  }, [fetchFn])

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    const promise = fetchRef.current()
    if (promise && typeof promise.then === 'function') {
      promise
        .then((result) => { if (!cancelled) { setData(result); setLoading(false) } })
        .catch((err) => { if (!cancelled) { setError(err.message || err); setLoading(false) } })
    } else {
      setData(promise)
      setLoading(false)
    }

    return () => { cancelled = true }
  }, deps)

  const refetch = useCallback(() => {
    setLoading(true)
    const promise = fetchRef.current()
    if (promise && typeof promise.then === 'function') {
      promise
        .then((result) => { setData(result); setLoading(false) })
        .catch((err) => { setError(err.message || err); setLoading(false) })
    }
  }, [])

  return { data, loading, error, setData, refetch }
}
