"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import { ArrowLeft, Film, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem, SidebarMenuSubButton, SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { PIPELINE_STEPS } from "@/lib/pipeline"
import type { Project } from "@/lib/types"
import * as React from "react";

const managementLinks = [
  { key: "style", label: "视觉风格", icon: Palette },
]

export function ProjectSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const params = useParams()
  const pathname = usePathname()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((res) => res.json())
      .then((data) => {
        setProject(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [projectId])

  const currentStepKey = pathname.split("/").pop() || "import"

  return (
    <Sidebar collapsible="icon" className="border-r" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <ArrowLeft className="size-4" />
                </div>
                <div className="flex items-center gap-2">
                  <Film className="h-4 w-4" />
                  <span className="font-semibold">CutGo</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Project Info */}
        <div className="px-2 pb-1 group-data-[collapsible=icon]:hidden">
          {loading ? (
            <div className="space-y-2 px-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          ) : project ? (
            <div className="px-2">
              <p className="truncate text-sm font-medium">
                {project.name}
              </p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {project.platform}
                </Badge>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {project.duration}
                </Badge>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {project.aspectRatio}
                </Badge>
              </div>
            </div>
          ) : (
            <p className="px-2 text-sm text-muted-foreground">项目不存在</p>
          )}
        </div>
      </SidebarHeader>

      {/* Management Section */}
      <SidebarGroup>
        <SidebarGroupLabel>项目设置</SidebarGroupLabel>
        <SidebarMenu className="gap-1">
          {managementLinks.map((item) => (
              <SidebarMenuItem key={item.key}>
                <SidebarMenuButton
                    asChild
                    isActive={currentStepKey === item.key}

                >
                  <Link href={`/project/${projectId}/${item.key}`} className="font-medium">
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>

      <SidebarSeparator />

      <SidebarContent>
        {/* Pipeline Steps */}
        <SidebarGroup>
          <SidebarGroupLabel>制作流程</SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            {PIPELINE_STEPS.map((step) => (
              <SidebarMenuItem key={step.key}>
                <SidebarMenuButton
                  asChild
                  isActive={currentStepKey === step.key}

                >
                  <Link href={`/project/${projectId}/${step.key}`}>
                    <span className="flex h-5 w-5 items-center justify-center rounded text-xs font-medium">
                      {step.step}
                    </span>
                    <step.icon />
                    <span>{step.label}</span>

                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>



      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}
