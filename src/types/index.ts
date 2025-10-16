// API 관련 타입 정의
export interface SeedRequest {
  term: string
  autoCollect?: boolean
  targetCount?: number
  depthLimit?: number
}

export interface SeedResponse {
  success: boolean
  message: string
  keywordId?: number
}

export interface Keyword {
  id: number
  keyword: string
  sv_total: number
  cafe_total: number
  blog_total: number
  web_total: number
  news_total: number
  pc: number
  mo: number
  comp_idx: string
  ctr_pc: number
  ctr_mo: number
  ad_count: number
  saved_at: string
}

export interface CollectionStatus {
  totalKeywords: number
  collectedKeywords: number
  progress: number
  isCollecting: boolean
  lastUpdate: string
}

// 폼 관련 타입
export interface SeedFormData {
  term: string
  autoCollect: boolean
  targetCount: number
  depthLimit: number
}

// UI 상태 타입
export interface UIState {
  isLoading: boolean
  error: string | null
  success: string | null
}
