import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    // 서버 토큰 검증 (Cron Job 보안)
    const authHeader = request.headers.get('authorization')
    const serverToken = process.env.SERVER_TOKEN
    
    if (!serverToken || authHeader !== `Bearer ${serverToken}`) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    // 배치 크기 설정 (기본값: 20)
    const { searchParams } = new URL(request.url)
    const batchSize = parseInt(searchParams.get('batch') || '20')

    // 처리할 작업 조회
    const { data: jobs, error: jobsError } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .eq('type', 'count_docs')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .limit(batchSize)

    if (jobsError) {
      console.error('작업 조회 오류:', jobsError)
      throw new Error('작업 조회에 실패했습니다.')
    }

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({
        success: true,
        message: "처리할 작업이 없습니다.",
        processed: 0
      })
    }

    let processedCount = 0
    const errors: string[] = []

    for (const job of jobs) {
      try {
        // 작업 상태를 'processing'으로 업데이트
        await supabaseAdmin
          .from('jobs')
          .update({
            status: 'processing',
            started_at: new Date().toISOString(),
            attempts: job.attempts + 1
          })
          .eq('id', job.id)

        const { keyword_term } = job.payload

        // 키워드 정보 조회
        const { data: keyword, error: keywordError } = await supabaseAdmin
          .from('keywords')
          .select('*')
          .eq('term', keyword_term)
          .single()

        if (keywordError || !keyword) {
          throw new Error(`키워드 조회 실패: ${keyword_term}`)
        }

        // TODO: 실제 네이버 오픈API 호출
        // 현재는 모의 데이터로 문서수 생성
        const mockDocCounts = generateMockDocCounts(keyword_term)

        // 문서수 스냅샷 저장
        const { error: docCountError } = await supabaseAdmin
          .from('doc_counts')
          .upsert({
            keyword_id: keyword.id,
            date: new Date().toISOString().split('T')[0], // 오늘 날짜
            blog_total: mockDocCounts.blog_total,
            cafe_total: mockDocCounts.cafe_total,
            web_total: mockDocCounts.web_total,
            news_total: mockDocCounts.news_total,
            raw: mockDocCounts.raw
          }, {
            onConflict: 'keyword_id,date'
          })

        if (docCountError) {
          throw new Error(`문서수 저장 실패: ${docCountError.message}`)
        }

        // 키워드 상태 업데이트
        await supabaseAdmin
          .from('keywords')
          .update({
            status: 'counted_docs',
            updated_at: new Date().toISOString()
          })
          .eq('id', keyword.id)

        // 작업 완료 처리
        await supabaseAdmin
          .from('jobs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', job.id)

        processedCount++

      } catch (error) {
        console.error(`작업 ${job.id} 처리 오류:`, error)
        errors.push(`작업 ${job.id}: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)

        // 작업 실패 처리
        await supabaseAdmin
          .from('jobs')
          .update({
            status: job.attempts >= job.max_attempts ? 'failed' : 'pending',
            error_message: error instanceof Error ? error.message : '알 수 없는 오류',
            scheduled_at: new Date(Date.now() + 2 * 60 * 1000).toISOString() // 2분 후 재시도
          })
          .eq('id', job.id)
      }
    }

    return NextResponse.json({
      success: true,
      message: `${processedCount}개 작업 처리 완료`,
      processed: processedCount,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error("문서수 집계 워커 오류:", error)
    
    return NextResponse.json(
      {
        success: false,
        message: "워커 실행에 실패했습니다.",
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    )
  }
}

// 모의 문서수 생성 함수 (실제 구현 시 네이버 오픈API 호출로 대체)
function generateMockDocCounts(keyword: string) {
  // 키워드 길이와 복잡도에 따라 문서수 조정
  const baseMultiplier = Math.max(1, 10 - keyword.length)
  
  return {
    blog_total: Math.floor(Math.random() * 10000 * baseMultiplier) + 100,
    cafe_total: Math.floor(Math.random() * 5000 * baseMultiplier) + 50,
    web_total: Math.floor(Math.random() * 50000 * baseMultiplier) + 500,
    news_total: Math.floor(Math.random() * 1000 * baseMultiplier) + 10,
    raw: {
      timestamp: new Date().toISOString(),
      source: 'mock_data',
      note: '실제 네이버 오픈API 연동 시 실제 데이터로 교체됩니다.'
    }
  }
}
