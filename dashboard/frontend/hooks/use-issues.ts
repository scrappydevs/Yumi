import { useEffect, useState } from 'react'
import { apiClient, type Issue } from '@/lib/api'

export type { Issue }

export type IssueStats = {
  totalIssues: number
  resolved: number
  resolutionRate: number
  inProgress: number
  avgTime: number
  critical: number
}

export function useIssues() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchIssues() {
      try {
        setLoading(true)
        const data = await apiClient.getIssues({ limit: 100 })
        setIssues(data)
        setError(null)
      } catch (err) {
        console.error('Error fetching issues:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch issues')
      } finally {
        setLoading(false)
      }
    }

    fetchIssues()
  }, [])

  return { issues, loading, error }
}

export function useIssueStats(): IssueStats {
  const [stats, setStats] = useState<IssueStats>({
    totalIssues: 0,
    resolved: 0,
    resolutionRate: 0,
    inProgress: 0,
    avgTime: 2.4,
    critical: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true)
        const data = await apiClient.getIssueStats()
        setStats({
          totalIssues: data.total_issues,
          resolved: data.resolved,
          resolutionRate: data.resolution_rate,
          inProgress: data.in_progress,
          avgTime: 2.4, // TODO: Calculate from database
          critical: data.critical,
        })
      } catch (err) {
        console.error('Error fetching stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return stats
}
