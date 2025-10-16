# Vercel 배포 가이드

## 1. Vercel 계정 설정

1. [Vercel](https://vercel.com)에 접속하여 계정 생성/로그인
2. GitHub 계정과 연결 (권장)

## 2. 프로젝트 배포

### 방법 1: Vercel CLI 사용

```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 디렉토리에서 배포
vercel

# 프로덕션 배포
vercel --prod
```

### 방법 2: Vercel 대시보드 사용

1. Vercel 대시보드에서 "New Project" 클릭
2. GitHub 저장소 `lsk7209/nkey1` 선택
3. "Import" 클릭
4. 프로젝트 설정:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (기본값)
   - **Build Command**: `npm run build` (기본값)
   - **Output Directory**: `.next` (기본값)
5. "Deploy" 클릭

## 3. 환경변수 설정

Vercel 대시보드에서 프로젝트 → Settings → Environment Variables로 이동하여 다음 환경변수들을 추가:

### 필수 환경변수

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 네이버 API 키
NAVER_OPENAPI_KEYS=[{"label":"open-1","clientId":"your_client_id","clientSecret":"your_client_secret","qps":3,"daily":20000}]
NAVER_SEARCHAD_KEYS=[{"label":"ad-1","accessLicense":"your_access_license","secret":"your_secret","customerId":"your_customer_id","qps":0.5,"daily":8000}]

# 서버 토큰
SERVER_TOKEN=your_secure_server_token
```

### 환경변수 설정 방법

1. Vercel 대시보드 → 프로젝트 → Settings → Environment Variables
2. "Add New" 클릭
3. 각 환경변수를 개별적으로 추가:
   - **Name**: 환경변수 이름
   - **Value**: 환경변수 값
   - **Environment**: Production, Preview, Development 모두 선택
4. "Save" 클릭

## 4. 도메인 설정 (선택사항)

1. Vercel 대시보드 → 프로젝트 → Settings → Domains
2. "Add Domain" 클릭
3. 원하는 도메인 입력
4. DNS 설정에 따라 CNAME 레코드 추가

## 5. Cron Jobs 설정

Vercel Pro 플랜에서만 사용 가능한 기능입니다.

1. Vercel 대시보드 → 프로젝트 → Settings → Functions
2. Cron Jobs 섹션에서 다음 작업들 설정:
   - **Path**: `/api/collect/related`
   - **Schedule**: `*/5 * * * *` (5분마다)
   - **Path**: `/api/collect/docs`
   - **Schedule**: `*/2 * * * *` (2분마다)

## 6. 배포 확인

1. 배포 완료 후 제공된 URL로 접속
2. 홈 페이지가 정상적으로 로드되는지 확인
3. 시드 키워드 입력 테스트
4. API 엔드포인트 동작 확인

## 7. 모니터링

### Vercel Analytics
1. Vercel 대시보드 → 프로젝트 → Analytics
2. 페이지 뷰, 성능 지표 확인

### Function Logs
1. Vercel 대시보드 → 프로젝트 → Functions
2. API 함수들의 실행 로그 확인

## 8. 자동 배포 설정

GitHub 저장소와 연결된 경우, `main` 브랜치에 푸시할 때마다 자동으로 배포됩니다.

### 브랜치별 배포 설정
- **Production**: `main` 브랜치
- **Preview**: 다른 브랜치들
- **Development**: 로컬 개발

## 문제 해결

### 배포 실패 시
1. 빌드 로그 확인
2. 환경변수 설정 확인
3. 의존성 설치 오류 확인

### API 오류 시
1. Function 로그 확인
2. Supabase 연결 상태 확인
3. 환경변수 값 확인

### 성능 이슈 시
1. Vercel Analytics에서 성능 지표 확인
2. 이미지 최적화 적용
3. 코드 스플리팅 적용

## 비용 관리

### Vercel 플랜
- **Hobby**: 무료 (개인 프로젝트용)
- **Pro**: $20/월 (상업적 사용)
- **Enterprise**: 맞춤형 가격

### 사용량 모니터링
1. Vercel 대시보드 → 프로젝트 → Usage
2. Function 실행 시간, 대역폭 사용량 확인
