// 네이버 API 클라이언트

import { 
  selectAvailableOpenAPIKey, 
  selectAvailableSearchAdKey,
  recordKeyUsage,
  setKeyCooldown,
  type OpenAPIKey,
  type SearchAdKey
} from './api-keys'

// 네이버 오픈API 클라이언트
export class NaverOpenAPIClient {
  private async makeRequest(endpoint: string, params: Record<string, string>): Promise<any> {
    const key = selectAvailableOpenAPIKey()
    if (!key) {
      throw new Error('사용 가능한 OpenAPI 키가 없습니다.')
    }

    const url = new URL(`https://openapi.naver.com/v1/search/${endpoint}.json`)
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'X-Naver-Client-Id': key.clientId,
          'X-Naver-Client-Secret': key.clientSecret,
        },
      })

      if (response.status === 429) {
        // Rate limit 초과 - 1시간 쿨다운
        setKeyCooldown(key.label, 60)
        recordKeyUsage(key.label, false, 'Rate limit exceeded')
        throw new Error(`Rate limit exceeded for key ${key.label}`)
      }

      if (!response.ok) {
        recordKeyUsage(key.label, false, `HTTP ${response.status}`)
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()
      recordKeyUsage(key.label, true)
      return data

    } catch (error) {
      recordKeyUsage(key.label, false, error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  async searchBlog(query: string): Promise<{ total: number }> {
    return this.makeRequest('blog', { query, display: '1' })
  }

  async searchCafe(query: string): Promise<{ total: number }> {
    return this.makeRequest('cafearticle', { query, display: '1' })
  }

  async searchWeb(query: string): Promise<{ total: number }> {
    return this.makeRequest('webkr', { query, display: '1' })
  }

  async searchNews(query: string): Promise<{ total: number }> {
    return this.makeRequest('news', { query, display: '1' })
  }

  async getDocumentCounts(keyword: string): Promise<{
    blog_total: number
    cafe_total: number
    web_total: number
    news_total: number
  }> {
    try {
      const [blog, cafe, web, news] = await Promise.allSettled([
        this.searchBlog(keyword),
        this.searchCafe(keyword),
        this.searchWeb(keyword),
        this.searchNews(keyword)
      ])

      return {
        blog_total: blog.status === 'fulfilled' ? blog.value.total : 0,
        cafe_total: cafe.status === 'fulfilled' ? cafe.value.total : 0,
        web_total: web.status === 'fulfilled' ? web.value.total : 0,
        news_total: news.status === 'fulfilled' ? news.value.total : 0,
      }
    } catch (error) {
      console.error('문서수 조회 오류:', error)
      return {
        blog_total: 0,
        cafe_total: 0,
        web_total: 0,
        news_total: 0,
      }
    }
  }
}

// 네이버 검색광고 API 클라이언트
export class NaverSearchAdClient {
  private generateSignature(secret: string, timestamp: string, method: string, uri: string): string {
    const crypto = require('crypto')
    const message = `${timestamp}.${method}.${uri}`
    return crypto.createHmac('sha256', secret).update(message).digest('base64')
  }

  private async makeRequest(uri: string, params: Record<string, any> = {}): Promise<any> {
    const key = selectAvailableSearchAdKey()
    if (!key) {
      throw new Error('사용 가능한 SearchAd 키가 없습니다.')
    }

    const timestamp = Date.now().toString()
    const method = 'GET'
    const signature = this.generateSignature(key.secret, timestamp, method, uri)

    const url = new URL(`https://api.naver.com${uri}`)
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'X-Timestamp': timestamp,
          'X-API-KEY': key.accessLicense,
          'X-Customer': key.customerId,
          'X-Signature': signature,
        },
      })

      if (response.status === 429) {
        // Rate limit 초과 - 5분 쿨다운
        setKeyCooldown(key.label, 5)
        recordKeyUsage(key.label, false, 'Rate limit exceeded')
        throw new Error(`Rate limit exceeded for key ${key.label}`)
      }

      if (!response.ok) {
        recordKeyUsage(key.label, false, `HTTP ${response.status}`)
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()
      recordKeyUsage(key.label, true)
      return data

    } catch (error) {
      recordKeyUsage(key.label, false, error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  async getRelatedKeywords(hintKeywords: string[]): Promise<{
    keywordList: Array<{
      relKeyword: string
      monthlyPcQcCnt: number
      monthlyMobileQcCnt: number
      monthlyAvePcCtr: number
      monthlyAveMobileCtr: number
      plAvgDepth: number
      compIdx: string
    }>
  }> {
    // 최대 5개 키워드까지 한 번에 조회 가능
    const keywords = hintKeywords.slice(0, 5).join(',')
    
    return this.makeRequest('/keywordstool', {
      hintKeywords: keywords,
      showDetail: '1'
    })
  }
}

// 싱글톤 인스턴스
export const naverOpenAPI = new NaverOpenAPIClient()
export const naverSearchAd = new NaverSearchAdClient()
