"use client"

import { useState, useEffect } from "react"
import { SeedForm } from "@/components/forms/SeedForm"
import { ProgressStatus } from "@/components/ProgressStatus"
import { SeedFormData, CollectionStatus, UIState } from "@/types"
import { Button } from "@/components/ui/button"
import { Database, BarChart3, RefreshCw } from "lucide-react"

export default function Home() {
  const [uiState, setUIState] = useState<UIState>({
    isLoading: false,
    error: null,
    success: null,
  })
  
  const [collectionStatus, setCollectionStatus] = useState<CollectionStatus | null>(null)

  const handleSeedSubmit = async (data: SeedFormData) => {
    setUIState({ isLoading: true, error: null, success: null })
    
    try {
      const response = await fetch('/api/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      const result = await response.json()
      
      if (result.success) {
        setUIState({ isLoading: false, error: null, success: '키워드가 성공적으로 등록되었습니다!' })
        // 상태 새로고침
        await refreshStatus()
      } else {
        setUIState({ isLoading: false, error: result.message || '키워드 등록에 실패했습니다.', success: null })
      }
    } catch (error) {
      setUIState({ 
        isLoading: false, 
        error: '서버와의 통신 중 오류가 발생했습니다.', 
        success: null 
      })
    }
  }

  const refreshStatus = async () => {
    try {
      const response = await fetch('/api/seed')
      const result = await response.json()
      
      if (result.success) {
        setCollectionStatus(result.data)
      }
    } catch (error) {
      console.error('상태 조회 오류:', error)
    }
  }

  // 컴포넌트 마운트 시 상태 조회
  useEffect(() => {
    refreshStatus()
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            키워드 자동 수집 시스템
          </h1>
          <p className="text-xl text-muted-foreground">
            시드 키워드로부터 연관키워드를 자동 수집하고 문서수를 집계하여 황금키워드를 발굴하세요
          </p>
        </div>

        {/* 상태 표시 */}
        {uiState.error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive">{uiState.error}</p>
          </div>
        )}
        
        {uiState.success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-200 rounded-lg">
            <p className="text-green-800">{uiState.success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 시드 키워드 입력 폼 */}
          <div className="space-y-6">
            <div className="bg-card p-6 rounded-lg border">
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <Database className="h-6 w-6 mr-2" />
                시드 키워드 등록
              </h2>
              <SeedForm onSubmit={handleSeedSubmit} isLoading={uiState.isLoading} />
            </div>
          </div>

          {/* 수집 상태 */}
          <div className="space-y-6">
            <div className="bg-card p-6 rounded-lg border">
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <BarChart3 className="h-6 w-6 mr-2" />
                수집 현황
              </h2>
              <ProgressStatus status={collectionStatus} />
              
              <div className="mt-4">
                <Button 
                  onClick={refreshStatus} 
                  variant="outline" 
                  size="sm"
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  상태 새로고침
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 빠른 액션 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button variant="outline" className="h-16" asChild>
            <a href="/data">
              <Database className="h-6 w-6 mr-2" />
              <div className="text-left">
                <div className="font-semibold">데이터 보기</div>
                <div className="text-sm text-muted-foreground">수집된 키워드 데이터 확인</div>
              </div>
            </a>
          </Button>
          
          <Button variant="outline" className="h-16" asChild>
            <a href="/insights">
              <BarChart3 className="h-6 w-6 mr-2" />
              <div className="text-left">
                <div className="font-semibold">인사이트</div>
                <div className="text-sm text-muted-foreground">키워드 분석 및 리포트</div>
              </div>
            </a>
          </Button>
        </div>

        {/* 디버그 링크 */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">개발자 도구</h3>
          <div className="flex gap-4">
            <a href="/debug" className="text-blue-600 hover:underline">시스템 진단</a>
            <a href="/api/health" className="text-blue-600 hover:underline">헬스체크 API</a>
          </div>
        </div>
      </div>
    </div>
  )
}