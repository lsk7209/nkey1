import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

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
    
    // TODO: 실제 데이터베이스 연동
    // 1. keywords 테이블에 시드 키워드 upsert
    // 2. jobs 큐에 'fetch_related' 작업 등록
    // 3. 자동수집이 활성화된 경우 워커 트리거
    
    // 임시 응답 (실제 구현 시 데이터베이스 ID 반환)
    const keywordId = Math.floor(Math.random() * 1000000)
    
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
          errors: error.errors,
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
    // TODO: 실제 데이터베이스에서 수집 상태 조회
    // keywords 테이블에서 status별 카운트 조회
    
    const mockStatus = {
      totalKeywords: 0,
      collectedKeywords: 0,
      progress: 0,
      isCollecting: false,
      lastUpdate: new Date().toISOString(),
    }
    
    return NextResponse.json({
      success: true,
      data: mockStatus,
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
