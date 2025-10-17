# 네이버 API 키 설정 가이드

## 개요

키워드 자동 수집 시스템은 네이버의 두 가지 API를 사용합니다:
- **네이버 오픈API**: 블로그, 카페, 웹, 뉴스 문서수 조회
- **네이버 검색광고 API**: 연관키워드 및 검색량 조회

## 1. 네이버 오픈API 키 발급

### 1.1 네이버 개발자센터 접속
1. [네이버 개발자센터](https://developers.naver.com/) 접속
2. 네이버 계정으로 로그인

### 1.2 애플리케이션 등록
1. "Application" → "애플리케이션 등록" 클릭
2. 애플리케이션 정보 입력:
   - **애플리케이션 이름**: 키워드 수집기
   - **사용 API**: 검색 API 선택
   - **환경 추가**: Web 서비스 환경 추가
   - **서비스 URL**: `https://your-domain.vercel.app`
   - **Callback URL**: `https://your-domain.vercel.app`

### 1.3 API 키 확인
등록 완료 후 다음 정보를 확인하세요:
- **Client ID**: 클라이언트 아이디
- **Client Secret**: 클라이언트 시크릿

## 2. 네이버 검색광고 API 키 발급

### 2.1 네이버 광고 API 접속
1. [네이버 광고 API](https://naver.worksmobile.com/) 접속
2. 네이버 비즈니스 계정으로 로그인

### 2.2 API 키 발급
1. "API 관리" → "API 키 발급" 클릭
2. 다음 정보를 확인하세요:
   - **Access License**: 액세스 라이선스
   - **Secret Key**: 시크릿 키
   - **Customer ID**: 고객 ID

## 3. Vercel 환경변수 설정

### 3.1 Vercel 대시보드 접속
1. [Vercel 대시보드](https://vercel.com/dashboard) 접속
2. 프로젝트 선택

### 3.2 환경변수 추가
Settings → Environment Variables에서 다음 변수들을 추가하세요:

#### Supabase 설정
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### 네이버 오픈API 키 (다중키 지원)
```json
NAVER_OPENAPI_KEYS=[
  {
    "label": "open-1",
    "clientId": "your_client_id_1",
    "clientSecret": "your_client_secret_1",
    "qps": 3,
    "daily": 20000
  },
  {
    "label": "open-2", 
    "clientId": "your_client_id_2",
    "clientSecret": "your_client_secret_2",
    "qps": 3,
    "daily": 20000
  }
]
```

#### 네이버 검색광고 API 키 (다중키 지원)
```json
NAVER_SEARCHAD_KEYS=[
  {
    "label": "ad-1",
    "accessLicense": "your_access_license_1",
    "secret": "your_secret_1",
    "customerId": "your_customer_id_1",
    "qps": 0.5,
    "daily": 8000
  },
  {
    "label": "ad-2",
    "accessLicense": "your_access_license_2", 
    "secret": "your_secret_2",
    "customerId": "your_customer_id_2",
    "qps": 0.5,
    "daily": 8000
  }
]
```

#### 서버 토큰
```
SERVER_TOKEN=your_secure_server_token
```

## 4. 다중키 설정의 장점

### 4.1 부하 분산
- 여러 키를 번갈아 사용하여 API 호출 제한 회피
- 키별로 다른 QPS(초당 쿼리 수) 설정 가능

### 4.2 장애 대응
- 하나의 키에 문제가 발생해도 다른 키로 계속 서비스
- 자동 쿨다운 및 복구 메커니즘

### 4.3 사용량 최적화
- 키별 일일 쿼터 분산
- 토큰 버킷 알고리즘으로 안정적인 처리량 보장

## 5. API 제한사항

### 5.1 네이버 오픈API
- **일일 쿼터**: 25,000회 (키당)
- **QPS 제한**: 3회/초 (키당)
- **429 오류 시**: 1시간 쿨다운

### 5.2 네이버 검색광고 API
- **일일 쿼터**: 8,000회 (키당)
- **QPS 제한**: 0.5회/초 (키당)
- **429 오류 시**: 5분 쿨다운

## 6. 모니터링

### 6.1 API 키 관리 페이지
- `/admin/keys` 페이지에서 실시간 키 상태 확인
- 사용량, 토큰 버킷, 쿨다운 상태 모니터링

### 6.2 자동 관리 기능
- **토큰 버킷**: 초당 자동 리필
- **일일 리셋**: 자정에 사용량 초기화
- **자동 쿨다운**: 429 오류 시 자동 대기

## 7. 문제 해결

### 7.1 429 오류 (Rate Limit)
- 키가 자동으로 쿨다운 상태로 전환
- 다른 키로 자동 전환하여 서비스 지속

### 7.2 401/403 오류 (인증 실패)
- API 키가 올바르게 설정되었는지 확인
- 네이버 개발자센터에서 키 상태 확인

### 7.3 일일 쿼터 초과
- 추가 키 발급 또는 다음날 자동 리셋 대기
- 다중키 설정으로 쿼터 분산

## 8. 보안 주의사항

- API 키는 절대 클라이언트에 노출하지 마세요
- 환경변수는 Vercel 대시보드에서만 설정하세요
- 정기적으로 API 키를 갱신하세요
- 사용하지 않는 키는 즉시 삭제하세요
