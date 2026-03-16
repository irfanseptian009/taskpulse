"use client";

import React from "react";
import { useSidebar } from "@/context/SidebarContext";
import { LogOut, Menu, Moon, Sun, X, User } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { userApi } from "@/lib/api";
import Link from "next/link";
import { authStorage } from "@/lib/auth";
import { useRouter } from "next/navigation";

export const Header: React.FC = () => {
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: userApi.getProfile,
  });

  return (
    <header className="sticky top-0 z-30 mx-4 mt-2 lg:mx-6">
      <div className="flex h-16 w-full items-center justify-between rounded-2xl border-b border-blue-600/20 bg-card/70 px-4 shadow-xl backdrop-blur-md transition-all duration-300 dark:border-gray-800/60 dark:bg-gray-900/80 md:h-20 lg:px-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleMobileSidebar}
          className="rounded-lg border-blue-600/30 bg-blue-600/20 text-foreground hover:bg-blue-600/30 lg:hidden dark:border-gray-700 dark:bg-gray-800/60"
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          <span className="sr-only">Toggle Sidebar</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="hidden rounded-lg bg-blue-600/20 text-foreground hover:bg-blue-600/30 lg:flex dark:bg-gray-800/60 dark:hover:bg-gray-800/80"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="rounded-lg border-blue-600/30 bg-card/70 backdrop-blur-md transition-colors hover:bg-primary/10 hover:text-primary dark:border-gray-700 dark:bg-gray-800/70"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            authStorage.clearToken();
            router.replace('/login');
          }}
          className="rounded-lg border-blue-600/30 bg-card/70 backdrop-blur-md transition-colors hover:bg-destructive/10 hover:text-destructive dark:border-gray-700 dark:bg-gray-800/70"
          title="Logout"
        >
          <LogOut className="h-[1.1rem] w-[1.1rem]" />
          <span className="sr-only">Logout</span>
        </Button>
        
        <Link href="/profile">
          <div className="flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-primary/20 bg-linear-to-br from-primary to-blue-600 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-transform hover:scale-105 active:scale-95">
            {profile?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarUrl} alt="Profile" className="h-full w-full object-cover" />
            ) : profile?.displayName ? (
              profile.displayName.substring(0, 2).toUpperCase()
            ) : (
              <User className="h-5 w-5" />
            )}
          </div>
        </Link>
      </div>
      </div>
    </header>
  );
};
