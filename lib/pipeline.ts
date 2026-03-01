import {
  BookOpen,
  FileText,
  Users,
  LayoutGrid,
  Image,
  Video,
  Download,
  Clapperboard,
} from "lucide-react"

export const PIPELINE_STEPS = [
  { key: "import", label: "小说导入", icon: BookOpen, step: 1 },
  { key: "script", label: "剧本生成", icon: FileText, step: 2 },
  { key: "characters", label: "角色生成", icon: Users, step: 3 },
  { key: "storyboard", label: "分镜生成", icon: LayoutGrid, step: 4 },
  { key: "images", label: "画面生成", icon: Image, step: 5 },
  { key: "video", label: "视频合成", icon: Video, step: 6 },
  { key: "export", label: "导出发布", icon: Download, step: 7 },
] as const

export type StepKey = (typeof PIPELINE_STEPS)[number]["key"]
