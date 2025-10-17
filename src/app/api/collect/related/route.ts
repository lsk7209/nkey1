import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { naverSearchAd } from "@/lib/naver-api"

export async function POST(request: NextRequest) {
  try {
    // 서버 토큰 검증 (Cron Job 보안) - 테스트를 위해 임시 비활성화
    // const authHeader = request.headers.get('authorization')
    // const serverToken = process.env.SERVER_TOKEN
    
    // // 개발 환경에서는 토큰 검증을 우회할 수 있도록 함
    // const isDevelopment = process.env.NODE_ENV === 'development'
    
    // if (!isDevelopment && (!serverToken || authHeader !== `Bearer ${serverToken}`)) {
    //   return NextResponse.json(
    //     { success: false, message: "Unauthorized" },
    //     { status: 401 }
    //   )
    // }

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

        const { keyword_id, target_count } = job.payload

        // 키워드 정보 조회
        const { data: keyword, error: keywordError } = await supabaseAdmin
          .from('keywords')
          .select('*')
          .eq('id', keyword_id)
          .single()

        if (keywordError || !keyword) {
          throw new Error(`키워드 조회 실패: ${keyword_id}`)
        }

        // 실제 네이버 검색광고 API 호출
        console.log(`네이버 API 호출 시작: ${keyword.term}`)
        const apiResponse = await naverSearchAd.getRelatedKeywords([keyword.term])
        console.log(`네이버 API 응답:`, apiResponse)
        
        const relatedKeywords = apiResponse.keywordList.map(item => ({
          term: item.relKeyword,
          pc: parseInt(item.monthlyPcQcCnt.replace(/[<,]/g, '')) || 0,
          mo: parseInt(item.monthlyMobileQcCnt.replace(/[<,]/g, '')) || 0,
          ctr_pc: parseFloat(item.monthlyAvePcCtr) || 0,
          ctr_mo: parseFloat(item.monthlyAveMobileCtr) || 0,
          ad_count: parseInt(item.plAvgDepth) || 0,
          comp_idx: item.compIdx
        }))
        
        console.log(`변환된 연관키워드:`, relatedKeywords)

        // 연관키워드 저장
        for (const relatedKeyword of relatedKeywords) {
          // 기존 키워드가 있는지 확인
          const { data: existingKeyword } = await supabaseAdmin
            .from('keywords')
            .select('id')
            .eq('term', relatedKeyword.term)
            .single()
          
          if (existingKeyword) {
            // 기존 키워드가 있으면 상태만 업데이트
            await supabaseAdmin
              .from('keywords')
              .update({
                status: 'queued',
                updated_at: new Date().toISOString()
              })
              .eq('id', existingKeyword.id)
          } else {
            // 새 키워드 삽입
            const { error: insertError } = await supabaseAdmin
              .from('keywords')
              .insert({
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

