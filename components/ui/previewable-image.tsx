"use client"

import * as React from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface PreviewableImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  /** 预览弹窗顶部显示的标题 */
  title?: string
}

/**
 * 统一图片预览组件：点击图片弹出全屏 Dialog 预览。
 * - 点击后自动阻止冒泡（避免触发父级可点击元素）
 * - 弹窗内支持 ESC / 点击遮罩关闭
 */
export function PreviewableImage({
  src,
  alt,
  title,
  className,
  onClick,
  ...props
}: PreviewableImageProps) {
  const [open, setOpen] = React.useState(false)

  const handleClick = (e: React.MouseEvent<HTMLImageElement>) => {
    e.preventDefault()
    e.stopPropagation()
    onClick?.(e)
    setOpen(true)
  }

  return (
    <>
      <img
        src={src}
        alt={alt}
        className={cn("cursor-zoom-in", className)}
        onClick={handleClick}
        {...props}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent 
          showCloseButton={false}
          className="max-w-[90vw] sm:max-w-[90vw] w-fit overflow-hidden border-white/10 bg-black/95 p-0 flex flex-col"
        >
          {/* 关闭按钮 */}
          <button
            onClick={() => setOpen(false)}
            className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-1.5 text-white/80 transition-colors hover:bg-black/80 hover:text-white"
            aria-label="关闭预览"
          >
            <X className="size-4" />
          </button>

          {title && (
            <div className="px-4 pt-4 pb-2 text-sm font-medium text-white/70 shrink-0">{title}</div>
          )}

          <div className="flex items-center justify-center p-2 sm:p-4 min-h-0">
            <img
              src={src}
              alt={alt}
              className="h-[60vh] sm:h-[70vh] max-h-[720px] w-auto max-w-full rounded object-contain block"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
