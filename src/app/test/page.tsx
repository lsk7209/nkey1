import Link from "next/link"

export default function TestPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">테스트 페이지</h1>
      <p className="text-lg">이 페이지가 보인다면 Next.js 라우팅이 정상 작동하고 있습니다.</p>
      
      <div className="mt-8 space-y-4">
        <div className="p-4 bg-green-100 rounded">
          <h2 className="font-semibold text-green-800">✅ 정상 작동</h2>
          <p className="text-green-700">Next.js App Router가 정상적으로 작동하고 있습니다.</p>
        </div>
        
        <div className="p-4 bg-blue-100 rounded">
          <h2 className="font-semibold text-blue-800">🔗 링크 테스트</h2>
          <p className="text-blue-700">
            <Link href="/" className="underline">홈으로 돌아가기</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
