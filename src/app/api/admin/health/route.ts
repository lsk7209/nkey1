import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // 서버 토큰 검증 (관리자 전용)
    const authHeader = request.headers.get('authorization')
    const serverToken = process.env.SERVER_TOKEN
    
    if (!serverToken || authHeader !== `Bearer ${serverToken}`) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    // API 키 상태 조회
    const { data: apiKeys, error: apiKeysError } = await supabaseAdmin
      .from('api_keys')
      .select('*')
      .order('provider', { ascending: true })

    if (apiKeysError) {
      console.error('API 키 조회 오류:', apiKeysError)
    }

    // 키워드 통계 조회
    const { data: keywordStats, error: keywordError } = await supabaseAdmin
      .from('keywords')
      .select('status, count(*)')
      .group('status')

    if (keywordError) {
      console.error('키워드 통계 조회 오류:', keywordError)
    }

    // 작업 큐 상태 조회
    const { data: jobStats, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('status, count(*)')
      .group('status')

    if (jobError) {
      console.error('작업 큐 통계 조회 오류:', jobError)
    }

    // 문서수 통계 조회
    const { data: docStats, error: docError } = await supabaseAdmin
      .from('doc_counts')
      .select('count(*)')
      .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]) // 최근 7일

    if (docError) {
      console.error('문서수 통계 조회 오류:', docError)
    }

    // API 키 상태 분석
    const apiKeyStatus = {
      total: apiKeys?.length || 0,
      active: apiKeys?.filter(key => key.status === 'active').length || 0,
      cooling: apiKeys?.filter(key => key.status === 'cooling').length || 0,
      disabled: apiKeys?.filter(key => key.status === 'disabled').length || 0,
      details: apiKeys?.map(key => ({
        label: key.label,
        provider: key.provider,
        status: key.status,
        used_today: key.used_today,
        daily_quota: key.daily_quota,
        cooldown_until: key.cooldown_until,
        last_error: key.last_error
      })) || []
    }

    // 키워드 상태 분석
    const keywordStatus = {
      total: keywordStats?.reduce((sum, stat) => sum + parseInt(stat.count), 0) || 0,
      queued: keywordStats?.find(stat => stat.status === 'queued')?.count || 0,
      fetched_rel: keywordStats?.find(stat => stat.status === 'fetched_rel')?.count || 0,
      counted_docs: keywordStats?.find(stat => stat.status === 'counted_docs')?.count || 0,
      error: keywordStats?.find(stat => stat.status === 'error')?.count || 0
    }

    // 작업 큐 상태 분석
    const jobStatus = {
      total: jobStats?.reduce((sum, stat) => sum + parseInt(stat.count), 0) || 0,
      pending: jobStats?.find(stat => stat.status === 'pending')?.count || 0,
      processing: jobStats?.find(stat => stat.status === 'processing')?.count || 0,
      completed: jobStats?.find(stat => stat.status === 'completed')?.count || 0,
      failed: jobStats?.find(stat => stat.status === 'failed')?.count || 0
    }

    // 시스템 상태 계산
    const systemHealth = {
      status: 'healthy',
      issues: [] as string[],
      recommendations: [] as string[]
    }

    // API 키 상태 체크
    if (apiKeyStatus.active === 0) {
      systemHealth.status = 'critical'
      systemHealth.issues.push('활성 API 키가 없습니다.')
      systemHealth.recommendations.push('API 키를 활성화하거나 새로 추가하세요.')
    }

    if (apiKeyStatus.cooling > 0) {
      systemHealth.status = 'warning'
      systemHealth.issues.push(`${apiKeyStatus.cooling}개의 API 키가 쿨다운 상태입니다.`)
      systemHealth.recommendations.push('API 키 사용량을 모니터링하고 쿨다운 시간을 확인하세요.')
    }

    // 작업 큐 상태 체크
    if (jobStatus.pending > 100) {
      systemHealth.status = 'warning'
      systemHealth.issues.push('대기 중인 작업이 많습니다.')
      systemHealth.recommendations.push('워커 성능을 확인하거나 배치 크기를 조정하세요.')
    }

    if (jobStatus.failed > 10) {
      systemHealth.status = 'warning'
      systemHealth.issues.push('실패한 작업이 많습니다.')
      systemHealth.recommendations.push('실패한 작업의 오류 메시지를 확인하세요.')
    }

    // 429 비율 계산 (API 키별)
    const errorRate = apiKeys?.filter(key => key.last_error?.includes('429')).length || 0
    const totalKeys = apiKeys?.length || 1
    const rate429 = (errorRate / totalKeys) * 100

    if (rate429 > 5) {
      systemHealth.status = 'warning'
      systemHealth.issues.push(`429 오류율이 ${rate429.toFixed(1)}%입니다.`)
      systemHealth.recommendations.push('API 호출 빈도를 조정하거나 키를 추가하세요.')
    }

    const healthData = {
      timestamp: new Date().toISOString(),
      system: systemHealth,
      api_keys: apiKeyStatus,
      keywords: keywordStatus,
      jobs: jobStatus,
      doc_counts: {
        recent_7days: docStats?.[0]?.count || 0
      },
      metrics: {
        rate_429: rate429,
        processing_efficiency: jobStatus.total > 0 ? 
          ((jobStatus.completed / jobStatus.total) * 100).toFixed(1) + '%' : '0%'
      }
    }

    return NextResponse.json({
      success: true,
      data: healthData
    })

  } catch (error) {
    console.error("헬스 체크 오류:", error)
    
    return NextResponse.json(
      {
        success: false,
        message: "헬스 체크에 실패했습니다.",
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    )
  }
}
