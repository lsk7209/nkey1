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

    // 배치 크기 설정 (기본값: 10)
    const { searchParams } = new URL(request.url)
    const batchSize = parseInt(searchParams.get('batch') || '10')

    // 처리할 작업 조회
    const { data: jobs, error: jobsError } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .eq('type', 'fetch_related')
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

        const { keyword_id, target_count, depth_limit } = job.payload

        // 키워드 정보 조회
        const { data: keyword, error: keywordError } = await supabaseAdmin
          .from('keywords')
          .select('*')
          .eq('id', keyword_id)
          .single()

        if (keywordError || !keyword) {
          throw new Error(`키워드 조회 실패: ${keyword_id}`)
        }

        // TODO: 실제 네이버 검색광고 API 호출
        // 현재는 모의 데이터로 연관키워드 생성
        const mockRelatedKeywords = generateMockRelatedKeywords(keyword.term, target_count)

        // 연관키워드 저장
        for (const relatedKeyword of mockRelatedKeywords) {
          const { error: insertError } = await supabaseAdmin
            .from('keywords')
            .upsert({
              term: relatedKeyword.term,
              source: 'related',
              parent_id: keyword_id,
              pc: relatedKeyword.pc,
              mo: relatedKeyword.mo,
              ctr_pc: relatedKeyword.ctr_pc,
              ctr_mo: relatedKeyword.ctr_mo,
              ad_count: relatedKeyword.ad_count,
              comp_idx: relatedKeyword.comp_idx,
              depth: keyword.depth + 1,
              status: 'queued'
            }, {
              onConflict: 'term'
            })

          if (insertError) {
            console.error('연관키워드 저장 오류:', insertError)
          } else {
            // 문서수 집계 작업 큐에 추가
            await supabaseAdmin
              .from('jobs')
              .insert({
                type: 'count_docs',
                payload: { keyword_term: relatedKeyword.term }
              })
          }
        }

        // 원본 키워드 상태 업데이트
        await supabaseAdmin
          .from('keywords')
          .update({
            status: 'fetched_rel',
            updated_at: new Date().toISOString()
          })
          .eq('id', keyword_id)

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
            scheduled_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5분 후 재시도
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
    console.error("연관키워드 수집 워커 오류:", error)
    
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

// 모의 연관키워드 생성 함수 (실제 구현 시 네이버 API 호출로 대체)
function generateMockRelatedKeywords(seedTerm: string, targetCount: number) {
  const mockKeywords = []
  const baseCount = Math.min(targetCount, 20) // 최대 20개

  for (let i = 0; i < baseCount; i++) {
    mockKeywords.push({
      term: `${seedTerm} 관련키워드${i + 1}`,
      pc: Math.floor(Math.random() * 10000) + 100,
      mo: Math.floor(Math.random() * 15000) + 200,
      ctr_pc: Math.random() * 5 + 1,
      ctr_mo: Math.random() * 4 + 1,
      ad_count: Math.floor(Math.random() * 20) + 1,
      comp_idx: ['낮음', '중간', '높음'][Math.floor(Math.random() * 3)]
    })
  }

  return mockKeywords
}
