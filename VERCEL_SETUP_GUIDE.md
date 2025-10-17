# Vercel 환경변수 설정 가이드

## 🚀 빠른 설정 방법

### 1단계: Vercel 대시보드 접속
1. [Vercel 대시보드](https://vercel.com/dashboard) 접속
2. `nkey1` 프로젝트 선택
3. **Settings** → **Environment Variables** 클릭

### 2단계: 환경변수 추가
아래 변수들을 하나씩 추가하세요:

#### 🔑 Supabase 설정
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### 🔑 네이버 검색광고 API 키 (5개) - 한 줄로 복사
```
NAVER_SEARCHAD_KEYS=[{"label":"검색광고API키1","accessLicense":"0100000000d027bb5287da074c48fc79503e97ae8e4bb0e7e928b39108e0b4dd6ce3950b7f","secret":"AQAAAADQJ7tSh9oHTEj8eVA+l66OGm0FwBl/Ejg+WP/5GntSew==","customerId":"4129627","qps":0.5,"daily":8000},{"label":"검색광고API키2","accessLicense":"0100000000cc9487ea097be3b003d1634f76af9d829f9add05a89bfff3b70502076049b218","secret":"AQAAAADMlIfqCXvjsAPRY092r52CKoSQ0mjfgDr9xnHtAg1j1w==","customerId":"588691","qps":0.5,"daily":8000},{"label":"검색광고API키3","accessLicense":"01000000004df6f7cf20064146e5567633fb8dee0ddb315f0c0c46ffb79b4084db618b53ae","secret":"AQAAAABN9vfPIAZBRuVWdjP7je4NQviMuG1aQc4wbCGVofNGFQ==","customerId":"3834222","qps":0.5,"daily":8000},{"label":"검색광고API키4","accessLicense":"01000000007c872e3ad6cc952fc6985cb75ba9bac49bd47118d73c1da388320f2484a5fc34","secret":"AQAAAAB8hy461syVL8aYXLdbqbrEeM8U8CCzJJ7dtIXx/Qei1Q==","customerId":"3279649","qps":0.5,"daily":8000},{"label":"검색광고API키5","accessLicense":"01000000002f4619842bbd6c8133ee464acf7affed98e8b0a30253f34e4b2359beeb56ec6a","secret":"AQAAAAAvRhmEK71sgTPuRkrPev/t5wskFLEKPQT7H8bwOrhnrQ==","customerId":"4136805","qps":0.5,"daily":8000}]
```

#### 🔑 네이버 오픈API 키 (9개) - 한 줄로 복사
```
NAVER_OPENAPI_KEYS=[{"label":"OpenAPI키1","clientId":"CjG3EpGT1B0Hg59qS4Yg","clientSecret":"SXc9V2Ng68","qps":3,"daily":20000},{"label":"OpenAPI키2","clientId":"Ns2WCljKopkmKzItuXjs","clientSecret":"fNhWPvyrhh","qps":3,"daily":20000},{"label":"OpenAPI키3","clientId":"RHpI5bN3s4htxOfhjoiC","clientSecret":"mh27e9fZv5","qps":3,"daily":20000},{"label":"OpenAPI키4","clientId":"SpZqzhEXpLQ_uH5E2NvJ","clientSecret":"ZfasrqGq0M","qps":3,"daily":20000},{"label":"OpenAPI키5","clientId":"pUv4iAjPjTE5dBhBbFpS","clientSecret":"u989uWV8hL","qps":3,"daily":20000},{"label":"OpenAPI키6","clientId":"zh3WcdJSwhgGsAR3fi81","clientSecret":"_2NG7QKIxO","qps":3,"daily":20000},{"label":"OpenAPI키7","clientId":"F5VgcA9q3sr_3jTQKDEE","clientSecret":"feY3IVpZDS","qps":3,"daily":20000},{"label":"OpenAPI키8","clientId":"2KhNfgFOPYztSpU09mvm","clientSecret":"4bQY9ysJKe","qps":3,"daily":20000},{"label":"OpenAPI키9","clientId":"EcFJwVeEe5SULWuLP5sj","clientSecret":"b_QiA5tugl","qps":3,"daily":20000}]
```

#### 🔑 서버 토큰
```
SERVER_TOKEN=your_secure_server_token_here
```

### 3단계: 환경 적용
1. **Deployments** 탭으로 이동
2. **Redeploy** 버튼 클릭
3. **Use existing Build Cache** 체크 해제
4. **Redeploy** 확인

### 4단계: 확인
배포 완료 후 다음 페이지들을 확인하세요:

- **홈페이지**: `https://nkey1.vercel.app/`
- **API 키 상태**: `https://nkey1.vercel.app/admin/keys`
- **시스템 진단**: `https://nkey1.vercel.app/debug`

## 📊 API 키 현황

### 네이버 검색광고 API (5개 키)
- **총 일일 쿼터**: 40,000회 (키당 8,000회)
- **총 QPS**: 2.5회/초 (키당 0.5회/초)
- **용도**: 연관키워드 및 검색량 조회

### 네이버 오픈API (9개 키)
- **총 일일 쿼터**: 180,000회 (키당 20,000회)
- **총 QPS**: 27회/초 (키당 3회/초)
- **용도**: 블로그, 카페, 웹, 뉴스 문서수 조회

## ⚠️ 주의사항

1. **JSON 형식**: API 키 배열은 정확한 JSON 형식으로 입력해야 합니다
2. **따옴표**: 모든 문자열은 쌍따옴표(`"`)로 감싸야 합니다
3. **배포**: 환경변수 변경 후 반드시 재배포해야 적용됩니다
4. **보안**: API 키는 절대 공개하지 마세요

## 🔧 문제 해결

### 환경변수가 적용되지 않는 경우
1. Vercel에서 재배포 실행
2. 브라우저 캐시 삭제
3. `/debug` 페이지에서 환경변수 상태 확인

### API 키 오류가 발생하는 경우
1. `/admin/keys` 페이지에서 키 상태 확인
2. 네이버 개발자센터에서 키 유효성 확인
3. 일일 쿼터 사용량 확인

## 📞 지원

문제가 발생하면 다음을 확인하세요:
- Vercel 배포 로그
- `/debug` 페이지의 시스템 진단
- `/admin/keys` 페이지의 API 키 상태
