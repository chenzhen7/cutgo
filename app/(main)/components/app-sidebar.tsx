"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { GalleryVerticalEnd, Settings, FolderKanban, Plus } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"

import { NavSecondary } from "@/app/(main)/components/nav-secondary"

const data = {
  navMain: [
    {
      title: "项目管理",
      url: "",
      icon: FolderKanban,
      items: [
        {
          title: "我的项目",
          url: "/",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "设置",
      url: "/settings",
      icon: Settings,
    },
  ],
}

function isActiveUrl(pathname: string, url: string): boolean {
  if (url === "#" || url === "") return false
  if (url === "/") return pathname === "/"
  return pathname.startsWith(url)
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">CutGo - 秒剧</span>
                  <span className="text-xs text-muted-foreground">v0.1.0</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {data.navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <a href={item.url} className="font-medium">
                    {item.icon && <item.icon className="h-4 w-4 mr-2" />}
                    {item.title}
                  </a>
                </SidebarMenuButton>
                {item.items?.length ? (
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={isActiveUrl(pathname, subItem.url)}
                        >
                          <a href={subItem.url}>{subItem.title}</a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
