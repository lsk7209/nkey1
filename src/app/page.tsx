"use client"

import { useState } from "react"
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
      // TODO: API 호출 구현
      const response = await fetch("/api/seed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("시드 키워드 등록에 실패했습니다.")
      }

      await response.json()
      
      setUIState({
        isLoading: false,
        error: null,
        success: "시드 키워드가 성공적으로 등록되었습니다.",
      })

      // 수집 상태 업데이트 (실제로는 API에서 가져와야 함)
      setCollectionStatus({
        totalKeywords: data.targetCount,
        collectedKeywords: 0,
        progress: 0,
        isCollecting: true,
        lastUpdate: new Date().toISOString(),
      })

    } catch (error) {
      setUIState({
        isLoading: false,
        error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        success: null,
      })
    }
  }

  const handleRefreshStatus = async () => {
    try {
      // TODO: 실제 API 호출로 상태 업데이트
      if (collectionStatus) {
        setCollectionStatus({
          ...collectionStatus,
          collectedKeywords: Math.min(
            collectionStatus.collectedKeywords + Math.floor(Math.random() * 50),
            collectionStatus.totalKeywords
          ),
          lastUpdate: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.error("상태 업데이트 실패:", error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            키워드 자동 수집 시스템
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            시드 키워드를 입력하면 연관키워드를 자동으로 수집하고 
            카페/블로그/웹/뉴스 문서수를 집계하여 황금키워드를 발굴합니다.
          </p>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* 시드 입력 폼 */}
          <div className="order-2 xl:order-1">
            <SeedForm onSubmit={handleSeedSubmit} isLoading={uiState.isLoading} />
            
            {/* 상태 메시지 */}
            {uiState.error && (
              <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg animate-in slide-in-from-top-2 duration-300">
                <p className="text-destructive text-sm">{uiState.error}</p>
              </div>
            )}
            
            {uiState.success && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg animate-in slide-in-from-top-2 duration-300">
                <p className="text-green-700 text-sm">{uiState.success}</p>
              </div>
            )}
          </div>

          {/* 진행상태 */}
          <div className="order-1 xl:order-2">
            <ProgressStatus status={collectionStatus} />
            
            {collectionStatus && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={handleRefreshStatus}
                  className="w-full hover:bg-accent transition-colors"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  상태 새로고침
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* 빠른 액션 */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">빠른 액션</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border rounded-lg p-6 text-center hover:shadow-md transition-all duration-200 hover:scale-[1.02] group">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Database className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">데이터 보기</h3>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                수집된 키워드 데이터를 확인하고 분석하세요.
              </p>
              <Button variant="outline" className="w-full hover:bg-primary hover:text-primary-foreground transition-colors">
                데이터 페이지로 이동
              </Button>
            </div>
            
            <div className="bg-card border rounded-lg p-6 text-center hover:shadow-md transition-all duration-200 hover:scale-[1.02] group">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">인사이트</h3>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                키워드 분석 리포트와 인사이트를 확인하세요.
              </p>
              <Button variant="outline" className="w-full hover:bg-primary hover:text-primary-foreground transition-colors">
                인사이트 페이지로 이동
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
