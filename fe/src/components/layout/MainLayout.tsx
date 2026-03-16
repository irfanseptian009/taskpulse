"use client";

import React from "react";
import { useSidebar } from "@/context/SidebarContext";
import { Header } from "./Header";

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { isExpanded, isHovered } = useSidebar();
  const shouldUseExpandedSpacing = isExpanded || isHovered;
  
  return (
    <div 
      className={`flex flex-1 flex-col overflow-hidden transition-all duration-300 ease-in-out
        ${shouldUseExpandedSpacing ? "lg:pl-80" : "lg:pl-28"}
      `}
    >
      <Header />
      <main className="mt-2 flex-1 overflow-y-auto rounded-tl-4xl border-l border-t border-border/40 bg-card/30 p-4 shadow-[inset_0_4px_24px_rgba(0,0,0,0.02)] no-scrollbar md:p-6 lg:mx-6 lg:p-8">
        <div className="mx-auto max-w-7xl h-full">
          {children}
        </div>
      </main>
    </div>
  );
};
