import {
  BookOpen,
  FileText,
  Clapperboard,
  Video,
  Download,
} from "lucide-react"

export const PIPELINE_STEPS = [
  { key: "import", label: "小说导入", icon: BookOpen },
  { key: "script", label: "剧本生成", icon: FileText },
  { key: "shot", label: "分镜生成", icon: Clapperboard },
  { key: "video", label: "视频合成", icon: Video },
  { key: "export", label: "导出发布", icon: Download },
] as const

export type StepKey = (typeof PIPELINE_STEPS)[number]["key"]
