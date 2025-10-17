"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function TestWorkerPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>("")

  const testWorker = async () => {
    setLoading(true)
    setResult("")
    
    try {
      const response = await fetch('/api/collect/related', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setResult(`오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">워커 테스트</h1>
      
      <div className="mb-4">
        <Button 
          onClick={testWorker} 
          disabled={loading}
          className="mr-2"
        >
          {loading ? "실행 중..." : "연관키워드 수집 워커 실행"}
        </Button>
      </div>
      
      {result && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">결과:</h2>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
            {result}
          </pre>
        </div>
      )}
    </div>
  )
}
