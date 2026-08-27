'use client';

import { useEffect, useState } from 'react';
import {
  Home,
  Trophy,
  Award,
  QrCode,
  Settings,
  LogOut,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/lib/auth-context';
import { getUserFromDatabase } from '@/lib/sync-user';
import { cn } from '@/lib/utils';

const menuItems = [
  { title: 'Dashboard', url: '/dashboard/student', icon: Home },
  { title: 'Browse Events', url: '/dashboard/student/browse', icon: Calendar },
  { title: 'My Clubs', url: '/dashboard/student/my-clubs', icon: Building2 },
  { title: 'Rank', url: '/dashboard/student/rank', icon: Trophy },
  {
    title: 'Certificates',
    url: '/dashboard/student/certificates',
    icon: Award,
  },
  { title: 'QR Code', url: '/dashboard/student/qr', icon: QrCode },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const { user: authUser, signOut } = useAuth();
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (!authUser) return;
    getUserFromDatabase(authUser.id).then(setUserData);
  }, [authUser]);

  const userName =
    userData?.full_name || authUser?.user_metadata?.full_name || 'User';

  const userInitials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Sidebar collapsible="icon" className="border-r bg-background">
      {/* HEADER — with expand/collapse control */}
      <SidebarHeader className="h-16 px-4 border-b">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo mark */}
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-md border',
                'text-sm font-semibold tracking-tight shrink-0'
              )}
            >
              CL
            </div>

            {/* Wordmark */}
            {!isCollapsed && (
              <span className="text-base font-semibold tracking-tight">
                Clunite
              </span>
            )}
          </div>

          {/* Expand / Contract (Collapse) Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
        </div>
      </SidebarHeader>

      {/* CONTENT */}
      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => {
                const active = pathname === item.url;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className={cn(
                        'h-9 px-3 rounded-md text-sm font-medium',
                        'text-muted-foreground',
                        active && 'bg-muted text-foreground'
                      )}
                    >
                      <Link
                        href={item.url}
                        className="flex items-center gap-2 relative"
                      >
                        {/* Brand-safe accent bar */}
                        {active && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[2px] bg-primary rounded-full" />
                        )}

                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* FOOTER — shadcn style */}
      <SidebarFooter className="border-t p-4">
        {!isCollapsed ? (
          <div className="space-y-3">
            {/* USER */}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-xs font-semibold">
                {userInitials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{userName}</p>
                <p className="text-xs text-muted-foreground">Student</p>
              </div>
            </div>

            <Separator />

            {/* ACTIONS */}
            <SidebarMenuButton className="h-9 px-3 rounded-md text-sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </SidebarMenuButton>

            <SidebarMenuButton
              onClick={signOut}
              className="h-9 px-3 rounded-md text-sm text-destructive"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </SidebarMenuButton>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-xs font-semibold">
              {userInitials}
            </div>

            <Separator />

            <SidebarMenuButton tooltip="Settings">
              <Settings className="h-4 w-4" />
            </SidebarMenuButton>

            <SidebarMenuButton
              tooltip="Sign out"
              onClick={signOut}
              className="text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </SidebarMenuButton>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
