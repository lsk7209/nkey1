# Supabase 설정 가이드

## 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 접속하여 계정 생성/로그인
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - **Name**: `nkey1` (또는 원하는 이름)
   - **Database Password**: 강력한 비밀번호 설정
   - **Region**: `Northeast Asia (Seoul)` 선택
4. "Create new project" 클릭

## 2. 데이터베이스 스키마 설정

1. Supabase 대시보드에서 "SQL Editor" 메뉴 클릭
2. "New query" 클릭
3. `database/schema.sql` 파일의 내용을 복사하여 붙여넣기
4. "Run" 버튼 클릭하여 스키마 생성

## 3. 환경변수 설정

### Supabase 대시보드에서 정보 확인

1. "Settings" → "API" 메뉴로 이동
2. 다음 정보를 복사:
   - **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
   - **anon public** 키 (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - **service_role** 키 (SUPABASE_SERVICE_ROLE_KEY)

### 로컬 환경변수 설정

`.env.local` 파일을 생성하고 다음 내용을 입력:

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 네이버 API 키 (실제 키로 교체 필요)
NAVER_OPENAPI_KEYS='[
  {"label":"open-1","clientId":"your_client_id","clientSecret":"your_client_secret","qps":3,"daily":20000}
]'

NAVER_SEARCHAD_KEYS='[
  {"label":"ad-1","accessLicense":"your_access_license","secret":"your_secret","customerId":"your_customer_id","qps":0.5,"daily":8000}
]'

# 서버 토큰
SERVER_TOKEN=your_secure_server_token
```

## 4. 테이블 확인

Supabase 대시보드에서 "Table Editor" 메뉴로 이동하여 다음 테이블들이 생성되었는지 확인:

- ✅ `api_keys` - API 키 관리
- ✅ `keywords` - 키워드 데이터
- ✅ `doc_counts` - 문서수 스냅샷
- ✅ `jobs` - 작업 큐
- ✅ `keyword_latest_view` - 조회 최적화 뷰

## 5. RLS (Row Level Security) 확인

각 테이블의 RLS 정책이 올바르게 설정되었는지 확인:

- `api_keys`: 서버 전용 (읽기/쓰기 모두 차단)
- `keywords`: 읽기 전용 공개
- `doc_counts`: 읽기 전용 공개  
- `jobs`: 서버 전용 (읽기/쓰기 모두 차단)

## 6. 샘플 데이터 확인

`api_keys` 테이블에 샘플 API 키 데이터가 삽입되었는지 확인.

## 7. 연결 테스트

로컬에서 개발 서버를 실행하고 홈 페이지에서 시드 키워드를 입력하여 데이터베이스 연결을 테스트:

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속 후 시드 키워드 입력 테스트.

## 문제 해결

### 연결 오류 시
1. 환경변수가 올바르게 설정되었는지 확인
2. Supabase 프로젝트가 활성화되어 있는지 확인
3. 네트워크 연결 상태 확인

### 권한 오류 시
1. RLS 정책이 올바르게 설정되었는지 확인
2. 서비스 역할 키가 올바른지 확인

### 스키마 오류 시
1. SQL 스크립트가 완전히 실행되었는지 확인
2. 테이블과 인덱스가 올바르게 생성되었는지 확인
