"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
// import { getAllKeyStatus } from "@/lib/api-keys" // 사용하지 않음
import { RefreshCw, AlertCircle, CheckCircle, Clock, Zap } from "lucide-react"

interface KeyStatus {
  openAPI: Array<{
    label: string
    clientId: string
    clientSecret: string
    qps: number
    daily: number
    usage: {
      usedToday: number
      windowTokens: number
      cooldownUntil?: Date
      lastError?: string
    }
  }>
  searchAd: Array<{
    label: string
    accessLicense: string
    secret: string
    customerId: string
    qps: number
    daily: number
    usage: {
      usedToday: number
      windowTokens: number
      cooldownUntil?: Date
      lastError?: string
    }
  }>
  totalOpenAPI: number
  totalSearchAd: number
  availableOpenAPI: number
  availableSearchAd: number
}

export default function APIKeysPage() {
  const [keyStatus, setKeyStatus] = useState<KeyStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchKeyStatus = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/admin/keys')
      const result = await response.json()
      
      if (result.success) {
        setKeyStatus(result.data)
      } else {
        setError(result.message || 'API 키 상태를 불러오는데 실패했습니다.')
      }
    } catch {
      setError('서버와의 통신 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKeyStatus()
    
    // 5초마다 상태 업데이트
    const interval = setInterval(fetchKeyStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (key: { usage: { cooldownUntil?: Date; usedToday: number; windowTokens: number }; daily: number }) => {
    const now = new Date()
    const isCooldown = key.usage.cooldownUntil && new Date(key.usage.cooldownUntil) > now
    const isQuotaExceeded = key.usage.usedToday >= key.daily
    const hasTokens = key.usage.windowTokens > 0
    
    if (isCooldown) {
      return <Clock className="h-4 w-4 text-orange-500" />
    } else if (isQuotaExceeded) {
      return <AlertCircle className="h-4 w-4 text-red-500" />
    } else if (hasTokens) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    } else {
      return <Zap className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusText = (key: { usage: { cooldownUntil?: Date; usedToday: number; windowTokens: number }; daily: number }) => {
    const now = new Date()
    const isCooldown = key.usage.cooldownUntil && new Date(key.usage.cooldownUntil) > now
    const isQuotaExceeded = key.usage.usedToday >= key.daily
    const hasTokens = key.usage.windowTokens > 0
    
    if (isCooldown) {
      const cooldownTime = new Date(key.usage.cooldownUntil!).toLocaleTimeString()
      return `쿨다운 중 (${cooldownTime})`
    } else if (isQuotaExceeded) {
      return '일일 쿼터 초과'
    } else if (hasTokens) {
      return '사용 가능'
    } else {
      return '토큰 부족'
    }
  }

  const getUsagePercentage = (used: number, total: number) => {
    return Math.round((used / total) * 100)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">API 키 관리</h1>
          <Button onClick={fetchKeyStatus} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </div>

        {/* 오류 표시 */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {loading && !keyStatus ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground">API 키 상태를 불러오는 중...</div>
          </div>
        ) : keyStatus ? (
          <>
            {/* 전체 통계 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-card p-6 rounded-lg border">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <div className="text-2xl font-bold">{keyStatus.totalOpenAPI}</div>
                    <div className="text-sm text-muted-foreground">OpenAPI 키</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-card p-6 rounded-lg border">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <div className="text-2xl font-bold">{keyStatus.availableOpenAPI}</div>
                    <div className="text-sm text-muted-foreground">사용 가능</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-card p-6 rounded-lg border">
                <div className="flex items-center">
                  <AlertCircle className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <div className="text-2xl font-bold">{keyStatus.totalSearchAd}</div>
                    <div className="text-sm text-muted-foreground">SearchAd 키</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-card p-6 rounded-lg border">
                <div className="flex items-center">
                  <AlertCircle className="h-8 w-8 text-orange-600 mr-3" />
                  <div>
                    <div className="text-2xl font-bold">{keyStatus.availableSearchAd}</div>
                    <div className="text-sm text-muted-foreground">사용 가능</div>
                  </div>
                </div>
              </div>
            </div>

            {/* OpenAPI 키 목록 */}
            <div className="bg-card p-6 rounded-lg border mb-8">
              <h2 className="text-2xl font-semibold mb-4">네이버 오픈API 키</h2>
              
              {keyStatus.openAPI.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  설정된 OpenAPI 키가 없습니다.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {keyStatus.openAPI.map((key) => (
                    <div key={key.label} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          {getStatusIcon(key)}
                          <span className="font-semibold ml-2">{key.label}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {getStatusText(key)}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>일일 사용량</span>
                          <span>{key.usage.usedToday} / {key.daily}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${getUsagePercentage(key.usage.usedToday, key.daily)}%` }}
                          />
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span>토큰 버킷</span>
                          <span>{key.usage.windowTokens} / {key.qps * 2}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${(key.usage.windowTokens / (key.qps * 2)) * 100}%` }}
                          />
                        </div>
                        
                        <div className="text-sm">
                          <span className="text-muted-foreground">QPS: </span>
                          <span className="font-medium">{key.qps}</span>
                        </div>
                        
                        {key.usage.lastError && (
                          <div className="text-sm text-red-600">
                            마지막 오류: {key.usage.lastError}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SearchAd 키 목록 */}
            <div className="bg-card p-6 rounded-lg border">
              <h2 className="text-2xl font-semibold mb-4">네이버 검색광고 API 키</h2>
              
              {keyStatus.searchAd.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  설정된 SearchAd 키가 없습니다.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {keyStatus.searchAd.map((key) => (
                    <div key={key.label} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          {getStatusIcon(key)}
                          <span className="font-semibold ml-2">{key.label}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {getStatusText(key)}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>일일 사용량</span>
                          <span>{key.usage.usedToday} / {key.daily}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full"
                            style={{ width: `${getUsagePercentage(key.usage.usedToday, key.daily)}%` }}
                          />
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span>토큰 버킷</span>
                          <span>{key.usage.windowTokens} / {key.qps * 2}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-orange-600 h-2 rounded-full"
                            style={{ width: `${(key.usage.windowTokens / (key.qps * 2)) * 100}%` }}
                          />
                        </div>
                        
                        <div className="text-sm">
                          <span className="text-muted-foreground">QPS: </span>
                          <span className="font-medium">{key.qps}</span>
                        </div>
                        
                        <div className="text-sm">
                          <span className="text-muted-foreground">고객 ID: </span>
                          <span className="font-medium">{key.customerId}</span>
                        </div>
                        
                        {key.usage.lastError && (
                          <div className="text-sm text-red-600">
                            마지막 오류: {key.usage.lastError}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
