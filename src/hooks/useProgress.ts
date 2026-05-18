import { useState, useEffect } from 'react'
import { loadAllProgress, updateStreak } from '../lib/progress-service'

export interface ProgressData {
  ielts: any[]
  sat: any[]
  diagnostic: any | null
  streak: any | null
}

export function useProgress() {
  const [progress, setProgress] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAllProgress().then(data => {
      setProgress(data)
      setLoading(false)
    })
    updateStreak()
  }, [])

  const refresh = async () => {
    const data = await loadAllProgress()
    setProgress(data)
  }

  return { progress, loading, refresh }
}
