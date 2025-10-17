import { NextResponse } from "next/server"
import { getAllKeyStatus } from "@/lib/api-keys"

export async function GET() {
  try {
    // 환경변수 검증
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        {
          success: false,
          message: "환경변수가 설정되지 않았습니다. 관리자에게 문의하세요.",
        },
        { status: 500 }
      )
    }

    const keyStatus = getAllKeyStatus()
    
    return NextResponse.json({
      success: true,
      data: keyStatus,
    })
    
  } catch (error) {
    console.error("API 키 상태 조회 오류:", error)
    
    return NextResponse.json(
      {
        success: false,
        message: "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    )
  }
}
