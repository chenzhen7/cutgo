"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

export default function ImportPage() {
  const [text, setText] = useState("")

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-foreground">小说导入</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        粘贴小说文本或上传 txt 文件，系统将自动分析剧情结构
      </p>

      <div className="mt-6 flex flex-col gap-6">
        {/* 文本输入 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">粘贴文本</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Textarea
              placeholder="将小说内容粘贴到这里..."
              rows={12}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="flex items-center gap-3">
              <Button disabled={!text.trim()}>开始分析</Button>
              <Label
                htmlFor="file-upload"
                className="cursor-pointer text-sm text-muted-foreground underline hover:text-foreground"
              >
                或上传 txt 文件
              </Label>
              <input id="file-upload" type="file" accept=".txt" className="hidden" />
            </div>
          </CardContent>
        </Card>

        {/* 分析结果占位 */}
        <Card className="border-dashed">
          <CardContent className="flex min-h-[200px] items-center justify-center">
            <p className="text-sm text-muted-foreground">
              分析结果将在这里展示（故事大纲、角色列表、剧情高潮点）
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
