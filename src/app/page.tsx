export default function Home() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>키워드 자동 수집 시스템</h1>
      <p>시드 키워드로부터 연관키워드를 자동 수집하고 문서수를 집계하여 황금키워드를 발굴하세요</p>
      
      <div style={{ marginTop: '20px' }}>
        <h2>테스트 링크</h2>
        <ul>
          <li><a href="/simple">Simple Page</a></li>
          <li><a href="/test">Test Page</a></li>
          <li><a href="/debug">Debug Page</a></li>
          <li><a href="/api/health">Health API</a></li>
        </ul>
      </div>
      
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <p><strong>현재 시간:</strong> {new Date().toISOString()}</p>
        <p><strong>환경:</strong> {process.env.NODE_ENV || 'development'}</p>
      </div>
    </div>
  )
}