"use client";

import React from "react";
import { useSidebar } from "@/context/SidebarContext";
import { Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export const Header: React.FC = () => {
  const { toggleSidebar, toggleMobileSidebar } = useSidebar();
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between px-4 lg:px-8 transition-all duration-300">
      <div className="flex items-center gap-4">
        {/* Mobile menu toggle */}
        <Button
          variant="outline"
          size="icon"
          onClick={toggleMobileSidebar}
          className="lg:hidden bg-card/50 backdrop-blur-md rounded-xl border-border/50 shadow-sm"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>

        {/* Desktop sidebar toggle - styled like a premium button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="hidden lg:flex hover:bg-black/5 dark:hover:bg-white/10 rounded-xl"
        >
          <Menu className="h-5 w-5 text-muted-foreground" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="bg-card/50 backdrop-blur-md rounded-xl border-border/50 shadow-sm hover:bg-primary/5 hover:text-primary transition-colors"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
        
        {/* Placeholder for User Profile */}
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-primary/20 cursor-pointer transition-transform hover:scale-105 active:scale-95">
          AD
        </div>
      </div>
    </header>
  );
};
