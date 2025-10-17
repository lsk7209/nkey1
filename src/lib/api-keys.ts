// 네이버 API 키 관리 유틸리티

export interface OpenAPIKey {
  label: string
  clientId: string
  clientSecret: string
  qps: number
  daily: number
}

export interface SearchAdKey {
  label: string
  accessLicense: string
  secret: string
  customerId: string
  qps: number
  daily: number
}

export interface KeyUsage {
  usedToday: number
  windowTokens: number
  cooldownUntil?: Date
  lastError?: string
}

// 환경변수에서 API 키 파싱
export function parseOpenAPIKeys(): OpenAPIKey[] {
  try {
    const keysJson = process.env.NAVER_OPENAPI_KEYS
    if (!keysJson) return []
    
    const keys = JSON.parse(keysJson) as OpenAPIKey[]
    return keys.filter(key => key.clientId && key.clientSecret)
  } catch (error) {
    console.error('OpenAPI 키 파싱 오류:', error)
    return []
  }
}

export function parseSearchAdKeys(): SearchAdKey[] {
  try {
    const keysJson = process.env.NAVER_SEARCHAD_KEYS
    if (!keysJson) return []
    
    const keys = JSON.parse(keysJson) as SearchAdKey[]
    return keys.filter(key => key.accessLicense && key.secret && key.customerId)
  } catch (error) {
    console.error('SearchAd 키 파싱 오류:', error)
    return []
  }
}

// 키 사용량 추적 (메모리 기반, 실제로는 Supabase에 저장)
const keyUsageMap = new Map<string, KeyUsage>()

export function getKeyUsage(keyLabel: string): KeyUsage {
  return keyUsageMap.get(keyLabel) || {
    usedToday: 0,
    windowTokens: 0
  }
}

export function updateKeyUsage(keyLabel: string, usage: Partial<KeyUsage>): void {
  const current = getKeyUsage(keyLabel)
  keyUsageMap.set(keyLabel, { ...current, ...usage })
}

// 사용 가능한 키 선택 (토큰 버킷 알고리즘)
export function selectAvailableOpenAPIKey(): OpenAPIKey | null {
  const keys = parseOpenAPIKeys()
  if (keys.length === 0) return null

  const now = new Date()
  
  // 사용 가능한 키 필터링
  const availableKeys = keys.filter(key => {
    const usage = getKeyUsage(key.label)
    
    // 쿨다운 중인지 확인
    if (usage.cooldownUntil && usage.cooldownUntil > now) {
      return false
    }
    
    // 일일 쿼터 확인
    if (usage.usedToday >= key.daily) {
      return false
    }
    
    // 토큰 버킷 확인
    if (usage.windowTokens < 1) {
      return false
    }
    
    return true
  })

  if (availableKeys.length === 0) return null

  // 사용률이 낮고 토큰이 많은 키 우선 선택
  return availableKeys.sort((a, b) => {
    const usageA = getKeyUsage(a.label)
    const usageB = getKeyUsage(b.label)
    
    const ratioA = usageA.usedToday / a.daily
    const ratioB = usageB.usedToday / b.daily
    
    if (ratioA !== ratioB) {
      return ratioA - ratioB // 사용률 낮은 순
    }
    
    return usageB.windowTokens - usageA.windowTokens // 토큰 많은 순
  })[0]
}

export function selectAvailableSearchAdKey(): SearchAdKey | null {
  const keys = parseSearchAdKeys()
  if (keys.length === 0) return null

  const now = new Date()
  
  // 사용 가능한 키 필터링
  const availableKeys = keys.filter(key => {
    const usage = getKeyUsage(key.label)
    
    // 쿨다운 중인지 확인
    if (usage.cooldownUntil && usage.cooldownUntil > now) {
      return false
    }
    
    // 일일 쿼터 확인
    if (usage.usedToday >= key.daily) {
      return false
    }
    
    // 토큰 버킷 확인
    if (usage.windowTokens < 1) {
      return false
    }
    
    return true
  })

  if (availableKeys.length === 0) return null

  // 사용률이 낮고 토큰이 많은 키 우선 선택
  return availableKeys.sort((a, b) => {
    const usageA = getKeyUsage(a.label)
    const usageB = getKeyUsage(b.label)
    
    const ratioA = usageA.usedToday / a.daily
    const ratioB = usageB.usedToday / b.daily
    
    if (ratioA !== ratioB) {
      return ratioA - ratioB // 사용률 낮은 순
    }
    
    return usageB.windowTokens - usageA.windowTokens // 토큰 많은 순
  })[0]
}

// 토큰 버킷 리필 (초당 실행)
export function refillTokenBuckets(): void {
  const now = new Date()
  
  // OpenAPI 키 토큰 리필
  parseOpenAPIKeys().forEach(key => {
    const usage = getKeyUsage(key.label)
    const newTokens = Math.min(
      usage.windowTokens + key.qps,
      key.qps * 2 // 최대 토큰 수
    )
    updateKeyUsage(key.label, { windowTokens: newTokens })
  })
  
  // SearchAd 키 토큰 리필
  parseSearchAdKeys().forEach(key => {
    const usage = getKeyUsage(key.label)
    const newTokens = Math.min(
      usage.windowTokens + key.qps,
      key.qps * 2 // 최대 토큰 수
    )
    updateKeyUsage(key.label, { windowTokens: newTokens })
  })
}

// 일일 사용량 리셋 (자정에 실행)
export function resetDailyUsage(): void {
  const allKeys = [
    ...parseOpenAPIKeys().map(k => k.label),
    ...parseSearchAdKeys().map(k => k.label)
  ]
  
  allKeys.forEach(label => {
    const usage = getKeyUsage(label)
    updateKeyUsage(label, { 
      usedToday: 0,
      lastError: undefined
    })
  })
}

// 키 사용 후 업데이트
export function recordKeyUsage(keyLabel: string, success: boolean, error?: string): void {
  const usage = getKeyUsage(keyLabel)
  
  updateKeyUsage(keyLabel, {
    usedToday: usage.usedToday + 1,
    windowTokens: Math.max(0, usage.windowTokens - 1),
    lastError: success ? undefined : error
  })
}

// 429 오류 시 쿨다운 설정
export function setKeyCooldown(keyLabel: string, durationMinutes: number): void {
  const cooldownUntil = new Date()
  cooldownUntil.setMinutes(cooldownUntil.getMinutes() + durationMinutes)
  
  updateKeyUsage(keyLabel, { cooldownUntil })
}

// 모든 키 상태 조회
export function getAllKeyStatus() {
  const openAPIKeys = parseOpenAPIKeys().map(key => ({
    ...key,
    usage: getKeyUsage(key.label)
  }))
  
  const searchAdKeys = parseSearchAdKeys().map(key => ({
    ...key,
    usage: getKeyUsage(key.label)
  }))
  
  return {
    openAPI: openAPIKeys,
    searchAd: searchAdKeys,
    totalOpenAPI: openAPIKeys.length,
    totalSearchAd: searchAdKeys.length,
    availableOpenAPI: openAPIKeys.filter(k => {
      const now = new Date()
      return !k.usage.cooldownUntil || k.usage.cooldownUntil <= now
    }).length,
    availableSearchAd: searchAdKeys.filter(k => {
      const now = new Date()
      return !k.usage.cooldownUntil || k.usage.cooldownUntil <= now
    }).length
  }
}
