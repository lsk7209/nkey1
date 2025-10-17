"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Keyword } from "@/types"
import { TrendingUp, Target, Award, BarChart3 } from "lucide-react"

export default function InsightsPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchKeywords = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/keywords?pageSize=1000')
      const result = await response.json()
      
      if (result.success) {
        setKeywords(result.data.keywords || [])
      } else {
        setError(result.message || '키워드 데이터를 불러오는데 실패했습니다.')
      }
    } catch (err) {
      setError('서버와의 통신 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKeywords()
  }, [])

  // 황금키워드 분석
  const goldenKeywords = keywords
    .filter(k => k.sv_total >= 500 && (k.cafe_total + k.blog_total + k.web_total + k.news_total) > 0)
    .sort((a, b) => {
      // 카페문서수 오름차순, 총 검색수 내림차순
      const aTotalDocs = a.cafe_total + a.blog_total + a.web_total + a.news_total
      const bTotalDocs = b.cafe_total + b.blog_total + b.web_total + b.news_total
      
      if (aTotalDocs !== bTotalDocs) {
        return aTotalDocs - bTotalDocs
      }
      return b.sv_total - a.sv_total
    })
    .slice(0, 20)

  // 경쟁도별 분석
  const competitionStats = keywords.reduce((acc, k) => {
    acc[k.comp_idx] = (acc[k.comp_idx] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // 검색수 구간별 분석
  const searchVolumeStats = {
    '0-100': keywords.filter(k => k.sv_total >= 0 && k.sv_total < 100).length,
    '100-500': keywords.filter(k => k.sv_total >= 100 && k.sv_total < 500).length,
    '500-1000': keywords.filter(k => k.sv_total >= 500 && k.sv_total < 1000).length,
    '1000-5000': keywords.filter(k => k.sv_total >= 1000 && k.sv_total < 5000).length,
    '5000+': keywords.filter(k => k.sv_total >= 5000).length,
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">키워드 인사이트</h1>
          <Button onClick={fetchKeywords} disabled={loading}>
            <BarChart3 className="h-4 w-4 mr-2" />
            데이터 새로고침
          </Button>
        </div>

        {/* 오류 표시 */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground">데이터를 분석하는 중...</div>
          </div>
        ) : (
          <>
            {/* 전체 통계 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-card p-6 rounded-lg border">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-primary mr-3" />
                  <div>
                    <div className="text-2xl font-bold">{keywords.length}</div>
                    <div className="text-sm text-muted-foreground">총 키워드</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-card p-6 rounded-lg border">
                <div className="flex items-center">
                  <Target className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <div className="text-2xl font-bold">{goldenKeywords.length}</div>
                    <div className="text-sm text-muted-foreground">황금키워드 후보</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-card p-6 rounded-lg border">
                <div className="flex items-center">
                  <Award className="h-8 w-8 text-yellow-600 mr-3" />
                  <div>
                    <div className="text-2xl font-bold">
                      {keywords.filter(k => k.comp_idx === '낮음').length}
                    </div>
                    <div className="text-sm text-muted-foreground">낮은 경쟁도</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-card p-6 rounded-lg border">
                <div className="flex items-center">
                  <BarChart3 className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <div className="text-2xl font-bold">
                      {keywords.reduce((sum, k) => sum + k.sv_total, 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">총 검색량</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 황금키워드 Top 20 */}
            <div className="bg-card p-6 rounded-lg border mb-8">
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <Award className="h-6 w-6 mr-2 text-yellow-600" />
                황금키워드 Top 20
              </h2>
              <p className="text-muted-foreground mb-4">
                낮은 문서수와 높은 검색수를 가진 키워드 (문서수 오름차순 → 검색수 내림차순)
              </p>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">순위</th>
                      <th className="px-4 py-3 text-left font-semibold">키워드</th>
                      <th className="px-4 py-3 text-right font-semibold">총 검색수</th>
                      <th className="px-4 py-3 text-right font-semibold">총 문서수</th>
                      <th className="px-4 py-3 text-right font-semibold">카페</th>
                      <th className="px-4 py-3 text-right font-semibold">블로그</th>
                      <th className="px-4 py-3 text-right font-semibold">웹</th>
                      <th className="px-4 py-3 text-right font-semibold">뉴스</th>
                      <th className="px-4 py-3 text-center font-semibold">경쟁도</th>
                    </tr>
                  </thead>
                  <tbody>
                    {goldenKeywords.map((keyword, index) => {
                      const totalDocs = keyword.cafe_total + keyword.blog_total + keyword.web_total + keyword.news_total
                      return (
                        <tr key={keyword.id} className="border-t hover:bg-muted/50">
                          <td className="px-4 py-3 font-medium">#{index + 1}</td>
                          <td className="px-4 py-3 font-medium">{keyword.keyword}</td>
                          <td className="px-4 py-3 text-right font-semibold">{keyword.sv_total.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">{totalDocs.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">{keyword.cafe_total.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">{keyword.blog_total.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">{keyword.web_total.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">{keyword.news_total.toLocaleString()}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded text-xs ${
                              keyword.comp_idx === '낮음' ? 'bg-green-100 text-green-800' :
                              keyword.comp_idx === '중간' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {keyword.comp_idx}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 경쟁도 분석 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-card p-6 rounded-lg border">
                <h3 className="text-xl font-semibold mb-4">경쟁도 분포</h3>
                <div className="space-y-3">
                  {Object.entries(competitionStats).map(([level, count]) => (
                    <div key={level} className="flex justify-between items-center">
                      <span className="font-medium">{level}</span>
                      <div className="flex items-center">
                        <div className="w-32 bg-muted rounded-full h-2 mr-3">
                          <div 
                            className={`h-2 rounded-full ${
                              level === '낮음' ? 'bg-green-500' :
                              level === '중간' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${(count / keywords.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {count}개
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card p-6 rounded-lg border">
                <h3 className="text-xl font-semibold mb-4">검색수 분포</h3>
                <div className="space-y-3">
                  {Object.entries(searchVolumeStats).map(([range, count]) => (
                    <div key={range} className="flex justify-between items-center">
                      <span className="font-medium">{range}</span>
                      <div className="flex items-center">
                        <div className="w-32 bg-muted rounded-full h-2 mr-3">
                          <div 
                            className="h-2 rounded-full bg-blue-500"
                            style={{ width: `${(count / keywords.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {count}개
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
