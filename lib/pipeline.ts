import {
  BookOpen,
  List,
  FolderOpen,
  FileText,
  LayoutGrid,
  Image,
  Video,
  Download,
} from "lucide-react"

export const PIPELINE_STEPS = [
  { key: "import", label: "小说导入", icon: BookOpen, step: 1 },
  { key: "outline", label: "分集大纲", icon: List, step: 2 },
  { key: "assets", label: "资产生成", icon: FolderOpen, step: 3 },
  { key: "script", label: "剧本生成", icon: FileText, step: 4 },
  { key: "storyboard", label: "分镜生成", icon: LayoutGrid, step: 5 },
  { key: "video", label: "视频合成", icon: Video, step: 6 },
  { key: "export", label: "导出发布", icon: Download, step: 7 },
] as const

export type StepKey = (typeof PIPELINE_STEPS)[number]["key"]
