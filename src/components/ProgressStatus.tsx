"use client"

import { Progress } from "@/components/ui/progress"
import { CollectionStatus } from "@/types"
import { formatNumber, formatDate } from "@/lib/utils"
import { Activity, Target, Clock, CheckCircle } from "lucide-react"

interface ProgressStatusProps {
  status: CollectionStatus | null
  className?: string
}

export function ProgressStatus({ status, className }: ProgressStatusProps) {
  if (!status) {
    return (
      <div className={`bg-card border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">수집 현황</h3>
        </div>
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Activity className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            아직 수집이 시작되지 않았습니다.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            시드 키워드를 입력하여 수집을 시작하세요.
          </p>
        </div>
      </div>
    )
  }

  const progressPercentage = status.totalKeywords > 0 
    ? Math.round((status.collectedKeywords / status.totalKeywords) * 100)
    : 0

  return (
    <div className={`bg-card border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">수집 현황</h3>
        {status.isCollecting && (
          <div className="flex items-center gap-1 text-sm text-primary bg-primary/10 px-2 py-1 rounded-full">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary" />
            수집 중
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* 진행률 바 */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>진행률</span>
            <span className="font-medium">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">목표</p>
              <p className="font-medium">{formatNumber(status.totalKeywords)}개</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">수집됨</p>
              <p className="font-medium">{formatNumber(status.collectedKeywords)}개</p>
            </div>
          </div>
        </div>

        {/* 마지막 업데이트 */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">마지막 업데이트</p>
            <p className="text-sm font-medium">{formatDate(new Date(status.lastUpdate))}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
