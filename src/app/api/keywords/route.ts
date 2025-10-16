import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // 쿼리 파라미터 파싱
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const cursor = searchParams.get('cursor')
    const hideLowSv = searchParams.get('hideLowSv') === 'true'
    const hideZeroDocs = searchParams.get('hideZeroDocs') === 'true'
    const sort = searchParams.get('sort') || 'cafe_total:asc,sv_total:desc'
    const q = searchParams.get('q') // 검색어
    
    // 필터 조건
    const filters = []
    if (hideLowSv) {
      filters.push('sv_total >= 500')
    }
    if (hideZeroDocs) {
      filters.push('(cafe_total + blog_total + web_total + news_total) > 0')
    }
    if (q) {
      filters.push(`keyword ILIKE '%${q}%'`)
    }
    
    // 정렬 파라미터 파싱
    const sortParts = sort.split(',')
    const orderBy = sortParts.map(part => {
      const [column, direction] = part.split(':')
      return { column, ascending: direction === 'asc' }
    })
    
    // 기본 정렬 (카페문서수 오름차순, 총 검색수 내림차순)
    const defaultOrderBy = [
      { column: 'cafe_total', ascending: true },
      { column: 'sv_total', ascending: false }
    ]
    
    const finalOrderBy = orderBy.length > 0 ? orderBy : defaultOrderBy
    
    // 쿼리 빌드
    let query = supabase
      .from('keyword_latest_view')
      .select('*')
      .limit(pageSize)
    
    // 필터 적용
    filters.forEach(filter => {
      query = query.filter('', filter)
    })
    
    // 정렬 적용
    finalOrderBy.forEach(({ column, ascending }) => {
      query = query.order(column, { ascending })
    })
    
    // 커서 페이지네이션
    if (cursor) {
      query = query.gt('id', cursor)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('키워드 조회 오류:', error)
      throw new Error('키워드 조회에 실패했습니다.')
    }
    
    // 다음 커서 계산
    const nextCursor = data && data.length === pageSize 
      ? data[data.length - 1].id 
      : null
    
    return NextResponse.json({
      success: true,
      data: {
        keywords: data || [],
        pagination: {
          pageSize,
          nextCursor,
          hasMore: !!nextCursor
        }
      }
    })
    
  } catch (error) {
    console.error("키워드 조회 오류:", error)
    
    return NextResponse.json(
      {
        success: false,
        message: "키워드 조회에 실패했습니다.",
      },
      { status: 500 }
    )
  }
}
