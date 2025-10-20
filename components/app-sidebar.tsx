"use client"

import { useState, useEffect } from "react"
import { Home, Trophy, Award, QrCode, Settings, LogOut, ChevronLeft, ChevronRight, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getUserFromDatabase } from "@/lib/sync-user"

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard/student",
    icon: Home,
  },
  {
    title: "Browse Events",
    url: "/dashboard/student/browse",
    icon: Trophy,
  },
  {
    title: "My Clubs",
    url: "/dashboard/student/my-clubs",
    icon: Building2,
  },
  {
    title: "Certificates",
    url: "/dashboard/student/certificates",
    icon: Award,
  },
  {
    title: "QR Code",
    url: "/dashboard/student/qr",
    icon: QrCode,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { state, toggleSidebar } = useSidebar()
  const { user: authUser, signOut } = useAuth()
  const [userData, setUserData] = useState<any>(null)
  const isCollapsed = state === "collapsed"

  useEffect(() => {
    async function loadUserData() {
      if (authUser) {
        const dbUser = await getUserFromDatabase(authUser.id)
        setUserData(dbUser)
      }
    }
    loadUserData()
  }, [authUser])

  const userName = userData?.full_name || authUser?.user_metadata?.full_name || "User"
  const userEmail = authUser?.email || "user@example.com"
  const userCollege = userData?.college || "College"
  const userRole = userData?.role === 'organizer' ? 'Organizer' : 'Student'
  const userInitials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-slate-200 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 dark:border-slate-800 transition-[width,transform] duration-200 ease-in-out"
    >
      {/* Header with improved branding */}
      <SidebarHeader className="p-6 border-b border-slate-200 dark:border-slate-800">
        <div className={cn(
          "flex items-center transition-all duration-300 ease-in-out",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          {/* New Clunite Logo */}
          <div 
            className={cn(
              "flex items-center cursor-pointer group/logo",
              isCollapsed ? "justify-center" : "space-x-3"
            )}
            onClick={isCollapsed ? toggleSidebar : undefined}
          >
            <div className="relative">
              <div className={cn(
                "bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300",
                "group-hover/logo:shadow-xl group-hover/logo:scale-105",
                isCollapsed ? "w-10 h-10" : "w-12 h-12"
              )}>
                <span className="text-white font-black text-xl">C</span>
              </div>
            </div>
            {!isCollapsed && (
              <div className="transition-all duration-300 ease-in-out">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Clunite</h1>
                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Unite • Create • Celebrate</p>
              </div>
            )}
          </div>

          {/* Improved Toggle Button - Only show when expanded */}
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="w-10 h-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 group border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm flex items-center justify-center"
              onClick={toggleSidebar}
            >
              <ChevronLeft className="h-5 w-5 text-slate-600 dark:text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-all duration-300 transform group-hover:-translate-x-0.5" />
            </Button>
          )}
        </div>
      </SidebarHeader>

      {/* Improved Content with better spacing and animations */}
      <SidebarContent className="px-4 py-6">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-3">
              {menuItems.map((item, index) => (
                <SidebarMenuItem key={item.title} className="relative">
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    className={`w-full rounded-xl px-3 py-5 transition-all duration-300 group relative overflow-hidden ${
                      pathname === item.url
                        ? "bg-gradient-to-r from-slate-100 to-purple-50 dark:from-slate-800 dark:to-purple-900/20 text-slate-900 dark:text-white font-semibold border border-slate-200 dark:border-slate-700"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    }`}
                    tooltip={isCollapsed ? item.title : undefined}
                  >
                    <Link
                      href={item.url}
                      className={`flex items-center ${isCollapsed ? "justify-center" : "space-x-4"} w-full relative z-10`}
                    >
                      <div
                        className={`p-2 rounded-xl transition-all duration-300 ${
                          pathname === item.url
                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                            : "bg-slate-200/50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
                        }`}
                      >
                        <item.icon className="h-5 w-5" />
                      </div>
                      {!isCollapsed && (
                        <span className="text-sm font-medium transition-all duration-300">
                          {item.title}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>

                  {/* Active indicator */}
                  {pathname === item.url && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8"></div>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Enhanced Footer */}
      <SidebarFooter className="p-4 border-t border-slate-200 dark:border-slate-800 mt-auto">
        {!isCollapsed ? (
          <div className="space-y-6">
            {/* Enhanced User Profile */}
            <div className="p-4 bg-gradient-to-r from-slate-50 to-purple-50/30 dark:from-slate-800 dark:to-purple-900/20 rounded-2xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-300 cursor-pointer group">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {userInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 dark:text-white text-sm truncate">{userName}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">{userRole} • {userCollege}</div>
                  <div className="flex items-center mt-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    <span className="text-xs text-green-600 dark:text-green-400 font-semibold">Active</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-4 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />

            {/* Enhanced Quick Actions */}
            <div className="space-y-2">
              <SidebarMenuButton 
                className="w-full justify-start text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl py-3 transition-all duration-300"
              >
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 mr-3">
                  <Settings className="h-4 w-4" />
                </div>
                <span className="font-medium">Settings</span>
              </SidebarMenuButton>
              <SidebarMenuButton 
                onClick={handleSignOut}
                className="w-full justify-start text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl py-3 transition-all duration-300 cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 mr-3">
                  <LogOut className="h-4 w-4" />
                </div>
                <span className="font-medium">Sign Out</span>
              </SidebarMenuButton>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Collapsed User Avatar */}
            <div className="flex justify-center">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                {userInitials}
              </div>
            </div>

            <Separator className="bg-gradient-to-r from-transparent via-blue-100 to-transparent" />

            <div className="space-y-3">
              <SidebarMenuButton
                className="w-full h-12 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 group flex items-center justify-center transition-all duration-300"
                tooltip="Settings"
              >
                <Settings className="h-5 w-5 text-blue-600 group-hover:text-blue-700" />
              </SidebarMenuButton>
              <SidebarMenuButton
                onClick={handleSignOut}
                className="w-full h-12 rounded-xl hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 hover:text-red-600 group flex items-center justify-center transition-all duration-300 cursor-pointer"
                tooltip="Sign Out"
              >
                <LogOut className="h-5 w-5 text-blue-600 group-hover:text-red-600" />
              </SidebarMenuButton>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}