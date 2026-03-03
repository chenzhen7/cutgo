"use client"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ProjectSidebar } from "./components/project-sidebar"

export default function ProjectLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (

        <SidebarProvider>
            <ProjectSidebar />
            <SidebarInset>
                {children}
            </SidebarInset>
        </SidebarProvider>
    )
}
