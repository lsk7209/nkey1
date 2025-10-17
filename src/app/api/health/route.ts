import { NextResponse } from "next/server"

export async function GET() {
  try {
    const envStatus = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    }

    const allEnvSet = Object.values(envStatus).every(Boolean)

    return NextResponse.json({
      success: true,
      message: allEnvSet ? "환경변수가 모두 설정되었습니다." : "일부 환경변수가 설정되지 않았습니다.",
      environment: envStatus,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "헬스체크 실패",
        error: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 }
    )
  }
}
