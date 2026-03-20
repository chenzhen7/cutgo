import {
  BookOpen,
  List,
  FileText,
  LayoutGrid,
  Video,
  Download,
} from "lucide-react"

export const PIPELINE_STEPS = [
  { key: "import", label: "小说导入", icon: BookOpen, step: 1 },
  { key: "outline", label: "分集大纲", icon: List, step: 2 },
  { key: "script", label: "剧本生成", icon: FileText, step: 3 },
  { key: "storyboard", label: "分镜生成", icon: LayoutGrid, step: 4 },
  { key: "video", label: "视频合成", icon: Video, step: 5 },
  { key: "export", label: "导出发布", icon: Download, step: 6 },
] as const

export type StepKey = (typeof PIPELINE_STEPS)[number]["key"]
