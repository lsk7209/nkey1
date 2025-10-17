"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Search, Database, BarChart3, Settings, Key, TestTube } from "lucide-react"

const navigation = [
  {
    name: "홈",
    href: "/",
    icon: Search,
  },
  {
    name: "데이터",
    href: "/data",
    icon: Database,
  },
  {
    name: "인사이트",
    href: "/insights",
    icon: BarChart3,
  },
  {
    name: "API 키",
    href: "/admin/keys",
    icon: Key,
  },
  {
    name: "진단",
    href: "/debug",
    icon: Settings,
  },
  {
    name: "워커 테스트",
    href: "/test-worker",
    icon: TestTube,
  },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="bg-card border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-primary">
                키워드 수집기
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors",
                      isActive
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
