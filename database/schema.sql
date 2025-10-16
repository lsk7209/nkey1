-- 키워드 자동 수집 시스템 데이터베이스 스키마
-- PRD 문서 기반 테이블 구조

-- 다중 키 풀(검색광고/오픈API 공용)
CREATE TABLE api_keys (
  id BIGSERIAL PRIMARY KEY,
  provider TEXT NOT NULL,          -- 'searchad' | 'openapi'
  label TEXT NOT NULL,
  key_id TEXT NOT NULL,            -- openapi: client_id / searchad: access license
  key_secret TEXT NOT NULL,        -- openapi: client_secret / searchad: secret
  customer_id TEXT,                -- searchad 전용
  status TEXT NOT NULL DEFAULT 'active', -- active|cooling|disabled
  qps_limit NUMERIC, 
  daily_quota INTEGER, 
  used_today INTEGER NOT NULL DEFAULT 0,
  window_tokens NUMERIC NOT NULL DEFAULT 0, 
  window_refill_rate NUMERIC NOT NULL DEFAULT 0,
  cooldown_until TIMESTAMPTZ, 
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(), 
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_keys_status ON api_keys(status, cooldown_until);

-- 키워드(연관/지표) - 월 파티셔닝 권장
CREATE TABLE keywords (
  id BIGSERIAL PRIMARY KEY,
  term TEXT NOT NULL,                          -- 정규화(lower/trim) 대상
  source TEXT NOT NULL DEFAULT 'seed',         -- seed|related
  parent_id BIGINT REFERENCES keywords(id) ON DELETE SET NULL,
  pc INTEGER, 
  mo INTEGER,                              -- monthlyPcQcCnt / monthlyMobileQcCnt
  ctr_pc NUMERIC, 
  ctr_mo NUMERIC,              -- monthlyAvePcCtr / MobileCtr
  ad_count INTEGER,                                -- plAvgDepth
  comp_idx TEXT,                               -- compIdx(낮음/중간/높음)
  depth INTEGER NOT NULL DEFAULT 0,                -- 0=시드
  status TEXT NOT NULL DEFAULT 'queued',       -- queued|fetched_rel|counted_docs|error
  created_at TIMESTAMPTZ DEFAULT NOW(), 
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX uniq_keywords_term ON keywords (LOWER(TRIM(term)));
CREATE INDEX idx_keywords_status ON keywords(status);
CREATE INDEX idx_keywords_source ON keywords(source);
CREATE INDEX idx_keywords_depth ON keywords(depth);

-- 문서수 스냅샷(일 파티셔닝 권장)
CREATE TABLE doc_counts (
  id BIGSERIAL PRIMARY KEY,
  keyword_id BIGINT REFERENCES keywords(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  blog_total INTEGER DEFAULT 0,
  cafe_total INTEGER DEFAULT 0,
  web_total INTEGER DEFAULT 0,
  news_total INTEGER DEFAULT 0,
  raw JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX uniq_doc_counts_daily ON doc_counts(keyword_id, date);
CREATE INDEX idx_doc_counts_date ON doc_counts(date);

-- 조회 최적화 뷰(테이블 컬럼 순서와 동일)
CREATE OR REPLACE VIEW keyword_latest_view AS
SELECT
  k.id,
  k.term AS keyword,
  COALESCE(k.pc,0) + COALESCE(k.mo,0) AS sv_total,
  dc.cafe_total, 
  dc.blog_total, 
  dc.web_total, 
  dc.news_total,
  k.pc, 
  k.mo, 
  k.comp_idx, 
  k.ctr_pc, 
  k.ctr_mo, 
  k.ad_count,
  dc.date AS saved_at
FROM keywords k
LEFT JOIN LATERAL (
  SELECT d.* FROM doc_counts d
  WHERE d.keyword_id = k.id
  ORDER BY d.date DESC
  LIMIT 1
) dc ON true;

-- 작업 큐 테이블 (워커용)
CREATE TABLE jobs (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL, -- 'fetch_related' | 'count_docs'
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending|processing|completed|failed
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_scheduled_at ON jobs(scheduled_at);
CREATE INDEX idx_jobs_type ON jobs(type);

-- RLS (Row Level Security) 설정
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- API 키는 서버에서만 접근 가능
CREATE POLICY "API keys are server-only" ON api_keys
  FOR ALL USING (false);

-- 키워드는 읽기 전용으로 공개
CREATE POLICY "Keywords are readable" ON keywords
  FOR SELECT USING (true);

-- 문서수는 읽기 전용으로 공개
CREATE POLICY "Doc counts are readable" ON doc_counts
  FOR SELECT USING (true);

-- 작업은 서버에서만 접근 가능
CREATE POLICY "Jobs are server-only" ON jobs
  FOR ALL USING (false);

-- 트리거 함수: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 적용
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_keywords_updated_at BEFORE UPDATE ON keywords
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 샘플 데이터 삽입 (개발용)
INSERT INTO api_keys (provider, label, key_id, key_secret, customer_id, qps_limit, daily_quota) VALUES
('openapi', 'open-1', 'sample_client_id_1', 'sample_client_secret_1', NULL, 3, 20000),
('openapi', 'open-2', 'sample_client_id_2', 'sample_client_secret_2', NULL, 3, 20000),
('searchad', 'ad-1', 'sample_access_license_1', 'sample_secret_1', 'sample_customer_1', 0.5, 8000),
('searchad', 'ad-2', 'sample_access_license_2', 'sample_secret_2', 'sample_customer_2', 0.5, 8000);
