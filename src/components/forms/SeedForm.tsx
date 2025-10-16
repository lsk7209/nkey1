"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { SeedFormData } from "@/types"
import { Search, Settings, Play } from "lucide-react"

const seedFormSchema = z.object({
  term: z.string().min(1, "키워드를 입력해주세요").max(100, "키워드는 100자 이하로 입력해주세요"),
  autoCollect: z.boolean().default(true),
  targetCount: z.number().min(100, "최소 100개 이상").max(10000, "최대 10,000개까지").default(1000),
  depthLimit: z.number().min(1, "최소 1단계").max(5, "최대 5단계까지").default(3),
})

type SeedFormValues = z.infer<typeof seedFormSchema>

interface SeedFormProps {
  onSubmit: (data: SeedFormData) => Promise<void>
  isLoading?: boolean
}

export function SeedForm({ onSubmit, isLoading = false }: SeedFormProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SeedFormValues>({
    resolver: zodResolver(seedFormSchema),
    defaultValues: {
      term: "",
      autoCollect: true,
      targetCount: 1000,
      depthLimit: 3,
    },
  })

  const autoCollect = watch("autoCollect")

  const onFormSubmit = async (data: SeedFormValues) => {
    await onSubmit({
      term: data.term.trim(),
      autoCollect: data.autoCollect,
      targetCount: data.targetCount,
      depthLimit: data.depthLimit,
    })
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-card border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-6">
          <Search className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">키워드 자동 수집</h2>
        </div>
        
        <p className="text-muted-foreground mb-6 leading-relaxed">
          시드 키워드를 입력하면 연관키워드를 자동으로 수집하고 문서수를 집계합니다.
        </p>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* 시드 키워드 입력 */}
          <div className="space-y-2">
            <Label htmlFor="term">시드 키워드 *</Label>
            <Input
              id="term"
              placeholder="예: 마케팅, SEO, 블로그"
              {...register("term")}
              disabled={isLoading}
            />
            {errors.term && (
              <p className="text-sm text-destructive">{errors.term.message}</p>
            )}
          </div>

          {/* 자동수집 토글 */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="autoCollect">자동수집 활성화</Label>
              <p className="text-sm text-muted-foreground">
                연관키워드를 자동으로 수집합니다
              </p>
            </div>
            <Switch
              id="autoCollect"
              checked={autoCollect}
              onCheckedChange={(checked) => setValue("autoCollect", checked)}
              disabled={isLoading}
            />
          </div>

          {/* 고급 설정 토글 */}
          <div className="border-t pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              고급 설정
            </Button>
          </div>

          {/* 고급 설정 폼 */}
          {isAdvancedOpen && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetCount">목표 수집 개수</Label>
                  <Input
                    id="targetCount"
                    type="number"
                    min="100"
                    max="10000"
                    {...register("targetCount", { valueAsNumber: true })}
                    disabled={isLoading}
                  />
                  {errors.targetCount && (
                    <p className="text-sm text-destructive">{errors.targetCount.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="depthLimit">수집 깊이</Label>
                  <Input
                    id="depthLimit"
                    type="number"
                    min="1"
                    max="5"
                    {...register("depthLimit", { valueAsNumber: true })}
                    disabled={isLoading}
                  />
                  {errors.depthLimit && (
                    <p className="text-sm text-destructive">{errors.depthLimit.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 제출 버튼 */}
          <Button
            type="submit"
            className="w-full h-12 text-base font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                수집 중...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                수집 시작
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
