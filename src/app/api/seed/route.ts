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
    console.log('POST /api/seed - 시작')
    
    // 환경변수 검증
    const supabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    const naverOpenApi = !!process.env.NAVER_OPENAPI_KEYS
    const naverSearchAd = !!process.env.NAVER_SEARCHAD_KEYS
    
    console.log('환경변수 상태:', { supabaseUrl, supabaseKey, naverOpenApi, naverSearchAd })
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('Supabase 환경변수 누락')
      return NextResponse.json(
        {
          success: false,
          message: "Supabase 환경변수가 설정되지 않았습니다. 관리자에게 문의하세요.",
        },
        { status: 500 }
      )
    }

    if (!naverOpenApi || !naverSearchAd) {
      console.log('네이버 API 키 누락')
      return NextResponse.json(
        {
          success: false,
          message: "네이버 API 키가 설정되지 않았습니다. 관리자에게 문의하세요.",
        },
        { status: 500 }
      )
    }

    const body = await request.json()
    
    // 요청 데이터 검증
    const validatedData = seedRequestSchema.parse(body)
    
    // 1. keywords 테이블에 시드 키워드 upsert
    const normalizedTerm = validatedData.term.trim().toLowerCase()
    
    // 먼저 기존 키워드가 있는지 확인
    const { data: existingKeyword } = await supabaseAdmin
      .from('keywords')
      .select('id')
      .eq('term', normalizedTerm)
      .single()
    
    let keywordData
    if (existingKeyword) {
      // 기존 키워드가 있으면 상태만 업데이트
      const { data, error } = await supabaseAdmin
        .from('keywords')
        .update({
          status: 'queued',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingKeyword.id)
        .select('id')
        .single()
      
      if (error) {
        console.error('키워드 업데이트 오류:', error)
        throw new Error('키워드 업데이트에 실패했습니다.')
      }
      keywordData = data
    } else {
      // 새 키워드 삽입
      const { data, error } = await supabaseAdmin
        .from('keywords')
        .insert({
          term: normalizedTerm,
          source: 'seed',
          depth: 0,
          status: 'queued'
        })
        .select('id')
        .single()
      
      if (error) {
        console.error('키워드 저장 오류:', error)
        throw new Error('키워드 저장에 실패했습니다.')
      }
      keywordData = data
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
    console.error("오류 타입:", typeof error)
    console.error("오류 메시지:", error instanceof Error ? error.message : 'Unknown error')
    console.error("오류 스택:", error instanceof Error ? error.stack : 'No stack')
    
    if (error instanceof z.ZodError) {
      console.log("Zod 검증 오류:", error.issues)
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
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// GET 메서드로 현재 수집 상태 조회
export async function GET() {
  try {
    // 환경변수 검증
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        {
          success: false,
          message: "Supabase 환경변수가 설정되지 않았습니다. 관리자에게 문의하세요.",
        },
        { status: 500 }
      )
    }

    // 네이버 API 키 검증
    if (!process.env.NAVER_OPENAPI_KEYS || !process.env.NAVER_SEARCHAD_KEYS) {
      return NextResponse.json(
        {
          success: false,
          message: "네이버 API 키가 설정되지 않았습니다. 관리자에게 문의하세요.",
        },
        { status: 500 }
      )
    }

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
      collectedKeywords: Number(collectedKeywords),
      progress: totalKeywords > 0 ? Math.round((Number(collectedKeywords) / totalKeywords) * 100) : 0,
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
