import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabase"

// 요청 스키마 검증
const seedRequestSchema = z.object({
  term: z.string().min(1, "키워드를 입력해주세요").max(100, "키워드는 100자 이하로 입력해주세요"),
  autoCollect: z.boolean().optional().default(true),
  targetCount: z.number().min(100, "최소 100개 이상").max(10000, "최대 10,000개까지").optional().default(1000),
  depthLimit: z.number().min(1, "최소 1단계").max(5, "최대 5단계까지").optional().default(3),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 요청 데이터 검증
    const validatedData = seedRequestSchema.parse(body)
    
    // 1. keywords 테이블에 시드 키워드 upsert
    const { data: keywordData, error: keywordError } = await supabaseAdmin
      .from('keywords')
      .upsert({
        term: validatedData.term.trim().toLowerCase(),
        source: 'seed',
        depth: 0,
        status: 'queued'
      }, {
        onConflict: 'term'
      })
      .select('id')
      .single()

    if (keywordError) {
      console.error('키워드 저장 오류:', keywordError)
      throw new Error('키워드 저장에 실패했습니다.')
    }

    const keywordId = keywordData.id

    // 2. jobs 큐에 'fetch_related' 작업 등록
    if (validatedData.autoCollect) {
      const { error: jobError } = await supabaseAdmin
        .from('jobs')
        .insert({
          type: 'fetch_related',
          payload: {
            keyword_id: keywordId,
            target_count: validatedData.targetCount,
            depth_limit: validatedData.depthLimit
          }
        })

      if (jobError) {
        console.error('작업 큐 등록 오류:', jobError)
        // 키워드는 저장되었으므로 경고만 로그
      }
    }
    
    // 로깅
    console.log("시드 키워드 등록:", {
      term: validatedData.term,
      autoCollect: validatedData.autoCollect,
      targetCount: validatedData.targetCount,
      depthLimit: validatedData.depthLimit,
      keywordId,
    })
    
    return NextResponse.json({
      success: true,
      message: "시드 키워드가 성공적으로 등록되었습니다.",
      keywordId,
    })
    
  } catch (error) {
    console.error("시드 키워드 등록 오류:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "입력 데이터가 올바르지 않습니다.",
          errors: error.issues,
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      {
        success: false,
        message: "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    )
  }
}

// GET 메서드로 현재 수집 상태 조회
export async function GET() {
  try {
    // keywords 테이블에서 status별 카운트 조회
    const { data: allKeywords, error: keywordError } = await supabaseAdmin
      .from('keywords')
      .select('status')

    if (keywordError) {
      console.error('키워드 통계 조회 오류:', keywordError)
      throw new Error('키워드 통계 조회에 실패했습니다.')
    }

    // 클라이언트 사이드에서 그룹핑
    const keywordStats = allKeywords?.reduce((acc, keyword) => {
      const status = keyword.status
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // 작업 큐에서 진행 중인 작업 확인
    const { data: allJobs, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('status')
      .in('status', ['pending', 'processing'])

    if (jobError) {
      console.error('작업 큐 조회 오류:', jobError)
    }

    // 통계 계산
    const totalKeywords = Object.values(keywordStats || {}).reduce((sum, count) => sum + count, 0)
    const collectedKeywords = keywordStats?.['counted_docs'] || 0
    const isCollecting = (allJobs?.length || 0) > 0

    const status = {
      totalKeywords,
      collectedKeywords: parseInt(collectedKeywords),
      progress: totalKeywords > 0 ? Math.round((parseInt(collectedKeywords) / totalKeywords) * 100) : 0,
      isCollecting,
      lastUpdate: new Date().toISOString(),
    }
    
    return NextResponse.json({
      success: true,
      data: status,
    })
    
  } catch (error) {
    console.error("수집 상태 조회 오류:", error)
    
    return NextResponse.json(
      {
        success: false,
        message: "수집 상태 조회에 실패했습니다.",
      },
      { status: 500 }
    )
  }
}
