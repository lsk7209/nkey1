# 키워드 자동 수집 시스템 PRD

## 0. 제품 개요(Overview)

- 목적: "시드 키워드 → 연관키워드 대량 수집 → 섹션별 문서수 집계 → 정렬/필터로 황금키워드 발굴"을 완전 자동화.
- 핵심 가설: 카페/블로그/웹/뉴스 문서수가 낮고 검색수(SV)가 높은 키워드는 선점 가치가 높다.
- 대상 사용자: 키워드 리서처, 내부 마케터/컨설턴트.
- 메뉴 구조:
    - 홈: 시드 입력, 자동수집 ON/OFF, 목표수집 개수, 진행상태.
    - 데이터: 키워드 테이블(정렬/필터/프리셋/CSV).
    - 인사이트: 저장된 뷰, Top-N 리포트, API 키 관리(사용량·쿨다운·조정).

## 1. 목표·KPI

- 기능 목표: 시드 투입 → 연관키워드 저장 → 문서수 집계 → 테이블 노출까지 무클릭 파이프라인.
- 성능 KPI: 429 비율 < 5%/시간, 평균 대기시간(큐→처리) < 60초, 분당 처리량(초기 키 2+2 기준) related ≥ 60/min, docs ≥ 200/min.
- 데이터 품질 KPI: 정규화 실패율(숫자 파싱 오류) < 0.1%, 중복 삽입=0.

## 2. 범위(Scope)

- In: 연관키워드 수집, 문서수 집계(total), 다중키 레이트리밋, 대용량(≥100만 행) 조회 최적화, CSV 내보내기.
- Out(초기): 국가/언어 다변화, SERP 스니펫/본문 저장, 외부 시각화 도구 연계.

## 3. 제약·가정

- RelKwdStat는 강한 호출 제한(429 발생 시 장시간 쿨다운 필요).
- 오픈API 검색은 일일 합산 쿼터(25k/일) 감시 필수.
- 프론트는 서버사이드 페이지네이션·정렬·필터만 사용(대량 DOM 회피).

## 4. 시스템 아키텍처

- FE: Next.js 14(App Router), Server Components 위주. 데이터 그리드 SSR + 커서 페이지네이션.
- BE: Vercel Functions(Node 런타임 고정), Vercel Cron(워커), 내부 잡 큐(Supabase).
- DB: Supabase(Postgres 14+), 파티셔닝(월/일), 커버링 인덱스, RLS.
- 배포: GitHub → Vercel 자동 배포(Preview/Prod).

## 5. 데이터 모델(DDL 요약)

```sql
-- 다중 키 풀(검색광고/오픈API 공용)
create table api_keys (
  id bigserial primary key,
  provider text not null,          -- 'searchad' | 'openapi'
  label text not null,
  key_id text not null,            -- openapi: client_id / searchad: access license
  key_secret text not null,        -- openapi: client_secret / searchad: secret
  customer_id text,                -- searchad 전용
  status text not null default 'active', -- active|cooling|disabled
  qps_limit numeric, daily_quota int, used_today int not null default 0,
  window_tokens numeric not null default 0, window_refill_rate numeric not null default 0,
  cooldown_until timestamptz, last_error text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create index idx_api_keys_status on api_keys(status, cooldown_until);

-- 키워드(연관/지표) - 월 파티셔닝 권장
create table keywords (
  id bigserial primary key,
  term text not null,                          -- 정규화(lower/trim) 대상
  source text not null default 'seed',         -- seed|related
  parent_id bigint references keywords(id) on delete set null,
  pc int, mo int,                              -- monthlyPcQcCnt / monthlyMobileQcCnt
  ctr_pc numeric, ctr_mo numeric,              -- monthlyAvePcCtr / MobileCtr
  ad_count int,                                -- plAvgDepth
  comp_idx text,                               -- compIdx(낮음/중간/높음)
  depth int not null default 0,                -- 0=시드
  status text not null default 'queued',       -- queued|fetched_rel|counted_docs|error
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create unique index uniq_keywords_term on keywords (lower(trim(term)));
create index idx_keywords_status on keywords(status);

-- 문서수 스냅샷(일 파티셔닝 권장)
create table doc_counts (
  id bigserial primary key,
  keyword_id bigint references keywords(id) on delete cascade,
  date date not null default current_date,
  blog_total int default 0,
  cafe_total int default 0,
  web_total  int default 0,
  news_total int default 0,
  raw jsonb,
  created_at timestamptz default now()
);
create unique index uniq_doc_counts_daily on doc_counts(keyword_id, date);

-- 조회 최적화 뷰(테이블 컬럼 순서와 동일)
create or replace view keyword_latest_view as
select
  k.id,
  k.term as keyword,
  coalesce(k.pc,0) + coalesce(k.mo,0) as sv_total,
  dc.cafe_total, dc.blog_total, dc.web_total, dc.news_total,
  k.pc, k.mo, k.comp_idx, k.ctr_pc, k.ctr_mo, k.ad_count,
  dc.date as saved_at
from keywords k
left join lateral (
  select d.* from doc_counts d
  where d.keyword_id = k.id
  order by d.date desc
  limit 1
) dc on true;
```

## 6. 화면/테이블 규격(데이터 메뉴)

표시 순서(고정)과 내부 매핑:

1. 키워드 → `keyword`
2. 총 검색수(pc+모바일조회수) → `sv_total = pc + mo`
3. 카페문서수 → `cafe_total`
4. 블로그문서수 → `blog_total`
5. 웹문서수 → `web_total`
6. 뉴스문서수 → `news_total`
7. PC 검색수 → `pc`
8. 모바일 검색수 → `mo`
9. 경쟁도 → `comp_idx`
10. PC CTR → `ctr_pc`(백분율 수치)
11. 모바일 CTR → `ctr_mo`
12. 광고수 → `ad_count`
13. 저장일 → `saved_at`(= 최신 `doc_counts.date`)

기본 제외 규칙:

- `sv_total < 500` 제외
- `(blog_total + cafe_total + web_total + news_total) = 0` 제외
- "숨김 포함 보기" 토글 시 전체 표시

정렬/프리셋:

- 기본 다중정렬: **카페문서수 오름(1순위) → 총 검색수 내림(2순위)**
- 프리셋:
    - 블로그 내림 + 총 검색수 내림
    - 웹문서 내림 + 총 검색수 내림
    - 뉴스 내림 + 총 검색수 내림

필터:

- 검색수 범위(SV), 각 문서수(블/카/웹/뉴스) 범위, "문서수=0만".

기능:

- 서버사이드 커서 페이지네이션, 열 보이기/숨기기, CSV Export(UTF-8, 한글 헤더 유지).

## 7. 수집 파이프라인(워크플로)

1. 홈에서 시드 입력(옵션: 자동수집 ON, 목표수집 개수, 깊이제한=3) → `keywords` upsert → `jobs.enqueue('fetch_related')`
2. 워커 `/api/collect/related`(Cron):
    - 힌트 5개/호출로 RelKwdStat 호출(다중키 pick)
    - 응답 정규화(`< 10` → 10, 숫자형 파싱) 후 `keywords` upsert(related, depth+1, pc/mo/ctr/ad/comp 저장)
    - 각 키워드에 `jobs.enqueue('count_docs')`
    - 자동수집 ON + 목표 미달 + depth<limit → 일부를 시드로 재큐잉
3. 워커 `/api/collect/docs`(Cron):
    - 블로그/카페/웹/뉴스 오픈API 호출(다중키 pick)
    - `total`만 저장(금일 `doc_counts` upsert), `keywords.status='counted_docs'` 업데이트
4. 데이터 화면: `keyword_latest_view` 조회 → 정렬·필터·프리셋 반영.

## 8. 백엔드 API 스펙(Next.js Route Handlers)

```
POST /api/seed
  body: { term: string, autoCollect?: boolean, targetCount?: number, depthLimit?: number=3 }

POST /api/collect/related   // Cron/워커 전용(서버 토큰 검증)
  query: { batch?: number=300 }

POST /api/collect/docs      // Cron/워커 전용
  query: { batch?: number=800 }

GET  /api/keywords
  query: {
    q?, pageSize?=50, cursor?,
    hideLowSv?=true, hideZeroDocs?=true,
    sort?, order?, multiSort?,  // "cafe_total:asc,sv_total:desc"
    svMin?, svMax?,
    blogMin?, blogMax?, cafeMin?, cafeMax?, webMin?, webMax?, newsMin?, newsMax?
  }

GET  /api/admin/health      // 키/큐/처리량/429율/쿨다운 노출
```

## 9. 외부 API 연동(핵심 규칙)

- 검색광고(RelKwdStat):
    - 헤더: `X-Timestamp`, `X-API-KEY`, `X-Customer`, `X-Signature=base64(HMAC_SHA256(secret, "{ts}.{METHOD}.{URI}"))`
    - 파라미터: `hintKeywords`(≤5, 쉼표), `showDetail=1` 권장
    - 429 시 동일 키 **쿨다운 300초**(반복 시 누적), 동일 시점 대량 재시도 금지
- 오픈API(문서수):
    - 헤더: `X-Naver-Client-Id`, `X-Naver-Client-Secret`
    - 엔드포인트: `/v1/search/{blog|cafearticle|webkr|news}.json?query=...`
    - `total`만 사용, 일일 합산 쿼터 25k 감시(80% 경보)

## 10. 다중 키 운영 설계

- 전역 세마포어: related 동시성 2~4, docs 6~10(키 수에 비례 상향).
- 키 선택: 후보키 필터(active, not cooling, used_today<daily) → 토큰버킷(초당 qps_limit 리필, 상한=2*qps) → `(used_today/daily) asc, tokens desc` 정렬 → 토큰≥1 키 선택, 없으면 100~300ms 슬립.
- 에러 처리:
    - 429 → `cooldown_until` 가산(검색광고 300s, 오픈API 60→120→300s 지수)
    - 401/403 → `disabled` 또는 장기 쿨다운, 운영자 알림
- 일일 리셋: Asia/Seoul 00:00 `used_today=0`.

ENV(JSON) 예시:

```
NAVER_OPENAPI_KEYS='[
  {"label":"open-1","clientId":"...","clientSecret":"...","qps":3,"daily":20000},
  {"label":"open-2","clientId":"...","clientSecret":"...","qps":3,"daily":20000}
]'
NAVER_SEARCHAD_KEYS='[
  {"label":"ad-1","accessLicense":"...","secret":"...","customerId":"...","qps":0.5,"daily":8000},
  {"label":"ad-2","accessLicense":"...","secret":"...","qps":0.5,"daily":8000}
]'
```

## 11. 보안·구성

- 모든 키는 서버 런타임 전용(Edge 미사용), 프론트 직호출 금지.
- RLS: 쓰기/관리 API는 서버 토큰 필요. 공개 조회는 제한적.
- 로깅: 키 라벨·요청 유형별 성공/실패/429/쿨다운 이벤트, 큐 지표.

## 12. 성능·확장

- 파티셔닝: `keywords` 월, `doc_counts` 일. 오래된 스냅샷 아카이빙 옵션.
- 인덱스: `lower(trim(term))`, `status`, `(cafe_total asc, sv_total desc)` 등 커버링 인덱스 검토.
- 캐시: RelKwdStat 결과 TTL 6~24h, 문서수 TTL 10~30m.
- 조회: `keyword_latest_view`만 조회하여 I/O 최소화.

## 13. 테스트 계획

- 단위: 시그니처·정규화(`< 10` 처리, 숫자 파싱), 토큰버킷·쿨다운·지수 백오프.
- 통합: 시드→연관→문서수→테이블까지 e2e.
- 부하: 30만/60만/100만 샘플로 정렬·필터 성능 프로파일.
- 회귀: CSV 내보내기(한글/따옴표·줄바꿈 이스케이프), 커서 페이지 안정성.

## 14. 완료 기준(DoD)

- 홈에서 시드 등록 후 별도 조작 없이 데이터 화면에 결과 노출.
- 기본 제외/정렬 규칙이 서버 응답으로 보장.
- 다중키로 1시간 운영 시 429<5%, 헬스 화면에서 키 상태/쿨다운 관리 가능.
- README에 환경변수·마이그레이션·로컬 모의 시나리오 포함.

## 15. 위험·완화

- 위험: RelKwdStat 강제 쿨다운 → 처리량 저하.
    
    완화: 동시성 자동 감속, 키 증설, 시간대 분산.
    
- 위험: 오픈API 일일 쿼터 소진 → 수집 중단.
    
    완화: 80% 경보, TTL 캐싱, 야간 분산, 프리셋 우선순위 수집.

---

# 체크리스트(개발·운영)

- [ ]  DDL 적용 및 파티션 롤오버 스크립트(월/일)
- [ ]  ENV(JSON) → `api_keys` 시드 업서트
- [ ]  RelKwdStat 클라이언트(서명/정규화) + 429 300s 쿨다운
- [ ]  OpenAPI 클라이언트(total 전용) + 25k/일 모니터링
- [ ]  큐/워커(visibility timeout, 재시도, 지수 백오프+지터)
- [ ]  `/api/seed`, `/api/collect/related`, `/api/collect/docs`, `/api/keywords`, `/api/admin/health`
- [ ]  데이터 테이블: 기본 제외·기본 다중정렬·필터·CSV·커서 페이지
- [ ]  헬스 대시보드: 키 사용률/429율/쿨다운·큐 적재/처리량
- [ ]  e2e 테스트: 시드→테이블까지 자동 플로우

---

# 대체안(1개)

- 조회 성능 불안정 시 `keyword_latest_view`를 **머티리얼라이즈드 뷰**로 전환(주기적 refresh + 인덱스)하여 응답 지연 분산을 축소.

---

# 근거 요약

- 테이블 컬럼을 네이버 응답 필드와 1:1 매핑하여 정규화하고, 최신 스냅샷만 조인하여 대용량 조회 부하를 최소화.
- 강한 호출 제한(RelKwdStat)과 일일 합산 쿼터(오픈API)를 다중 키·토큰버킷·쿨다운으로 흡수.
- 서버사이드 정렬/필터/커서 페이지로 100만+ 행에서도 UX 지연을 방지.
