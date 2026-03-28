import {
  BookOpen,
  FileText,
  Clapperboard,
  Video,
  Download,
} from "lucide-react"

export const PIPELINE_STEPS = [
  { key: "import", label: "小说导入", icon: BookOpen, step: 1 },
  { key: "script", label: "剧本生成", icon: FileText, step: 2 },
  { key: "shot", label: "分镜生成", icon: Clapperboard, step: 3 },
  { key: "video", label: "视频合成", icon: Video, step: 4 },
  { key: "export", label: "导出发布", icon: Download, step: 5 },
] as const

export type StepKey = (typeof PIPELINE_STEPS)[number]["key"]
