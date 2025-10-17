"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function DebugPage() {
  const [healthStatus, setHealthStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkHealth = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/health')
      const data = await response.json()
      setHealthStatus(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
    }
  }

  const checkSeedAPI = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/seed')
      const data = await response.json()
      setHealthStatus({ ...healthStatus, seedAPI: data })
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkHealth()
  }, [])

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">시스템 진단</h1>
      
      <div className="space-y-4">
        <Button onClick={checkHealth} disabled={loading}>
          헬스체크 다시 실행
        </Button>
        
        <Button onClick={checkSeedAPI} disabled={loading}>
          Seed API 테스트
        </Button>
      </div>

      {loading && (
        <div className="mt-4 p-4 bg-blue-100 rounded">
          로딩 중...
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-800 rounded">
          오류: {error}
        </div>
      )}

      {healthStatus && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h2 className="text-xl font-semibold mb-4">시스템 상태</h2>
          <pre className="whitespace-pre-wrap text-sm">
            {JSON.stringify(healthStatus, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8 p-4 bg-yellow-100 rounded">
        <h3 className="font-semibold mb-2">환경변수 설정 가이드</h3>
        <p className="text-sm mb-2">
          Vercel 대시보드 → 프로젝트 설정 → Environment Variables에서 다음 변수들을 설정하세요:
        </p>
        <ul className="text-sm list-disc list-inside space-y-1">
          <li><code>NEXT_PUBLIC_SUPABASE_URL</code></li>
          <li><code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code></li>
          <li><code>SUPABASE_SERVICE_ROLE_KEY</code></li>
        </ul>
      </div>
    </div>
  )
}
