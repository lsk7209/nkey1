"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Keyword } from "@/types"
import { Search, Download, RefreshCw } from "lucide-react"

export default function DataPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [hideLowSv, setHideLowSv] = useState(true)
  const [hideZeroDocs, setHideZeroDocs] = useState(true)

  const fetchKeywords = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        q: searchTerm,
        hideLowSv: hideLowSv.toString(),
        hideZeroDocs: hideZeroDocs.toString(),
        pageSize: "50"
      })
      
      const response = await fetch(`/api/keywords?${params}`)
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
  }, [searchTerm, hideLowSv, hideZeroDocs])

  const exportToCSV = () => {
    if (keywords.length === 0) return
    
    const headers = [
      '키워드', '총 검색수', '카페문서수', '블로그문서수', 
      '웹문서수', '뉴스문서수', 'PC 검색수', '모바일 검색수',
      '경쟁도', 'PC CTR', '모바일 CTR', '광고수', '저장일'
    ]
    
    const csvContent = [
      headers.join(','),
      ...keywords.map(keyword => [
        `"${keyword.keyword}"`,
        keyword.sv_total,
        keyword.cafe_total,
        keyword.blog_total,
        keyword.web_total,
        keyword.news_total,
        keyword.pc,
        keyword.mo,
        `"${keyword.comp_idx}"`,
        keyword.ctr_pc,
        keyword.ctr_mo,
        keyword.ad_count,
        `"${keyword.saved_at}"`
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `keywords_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">키워드 데이터</h1>
          <div className="flex gap-2">
            <Button onClick={fetchKeywords} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
            <Button onClick={exportToCSV} disabled={keywords.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              CSV 내보내기
            </Button>
          </div>
        </div>

        {/* 필터 */}
        <div className="bg-card p-6 rounded-lg border mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">키워드 검색</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="키워드 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="hideLowSv"
                checked={hideLowSv}
                onChange={(e) => setHideLowSv(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="hideLowSv">낮은 검색수 숨기기 (SV &lt; 500)</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="hideZeroDocs"
                checked={hideZeroDocs}
                onChange={(e) => setHideZeroDocs(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="hideZeroDocs">문서수 0인 키워드 숨기기</Label>
            </div>
          </div>
        </div>

        {/* 오류 표시 */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {/* 데이터 테이블 */}
        <div className="bg-card rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">키워드</th>
                  <th className="px-4 py-3 text-right font-semibold">총 검색수</th>
                  <th className="px-4 py-3 text-right font-semibold">카페</th>
                  <th className="px-4 py-3 text-right font-semibold">블로그</th>
                  <th className="px-4 py-3 text-right font-semibold">웹</th>
                  <th className="px-4 py-3 text-right font-semibold">뉴스</th>
                  <th className="px-4 py-3 text-right font-semibold">PC</th>
                  <th className="px-4 py-3 text-right font-semibold">모바일</th>
                  <th className="px-4 py-3 text-center font-semibold">경쟁도</th>
                  <th className="px-4 py-3 text-right font-semibold">저장일</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                      데이터를 불러오는 중...
                    </td>
                  </tr>
                ) : keywords.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                      키워드 데이터가 없습니다. 홈페이지에서 시드 키워드를 등록해보세요.
                    </td>
                  </tr>
                ) : (
                  keywords.map((keyword) => (
                    <tr key={keyword.id} className="border-t hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{keyword.keyword}</td>
                      <td className="px-4 py-3 text-right">{keyword.sv_total.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">{keyword.cafe_total.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">{keyword.blog_total.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">{keyword.web_total.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">{keyword.news_total.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">{keyword.pc.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">{keyword.mo.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${
                          keyword.comp_idx === '낮음' ? 'bg-green-100 text-green-800' :
                          keyword.comp_idx === '중간' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {keyword.comp_idx}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                        {new Date(keyword.saved_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 통계 */}
        {keywords.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card p-4 rounded-lg border text-center">
              <div className="text-2xl font-bold text-primary">{keywords.length}</div>
              <div className="text-sm text-muted-foreground">총 키워드</div>
            </div>
            <div className="bg-card p-4 rounded-lg border text-center">
              <div className="text-2xl font-bold text-primary">
                {keywords.reduce((sum, k) => sum + k.sv_total, 0).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">총 검색수</div>
            </div>
            <div className="bg-card p-4 rounded-lg border text-center">
              <div className="text-2xl font-bold text-primary">
                {keywords.filter(k => k.cafe_total > 0).length}
              </div>
              <div className="text-sm text-muted-foreground">카페 문서 보유</div>
            </div>
            <div className="bg-card p-4 rounded-lg border text-center">
              <div className="text-2xl font-bold text-primary">
                {keywords.filter(k => k.comp_idx === '낮음').length}
              </div>
              <div className="text-sm text-muted-foreground">낮은 경쟁도</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
