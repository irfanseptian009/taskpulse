"use client";

import React from "react";
import { useSidebar } from "@/context/SidebarContext";
import { Header } from "./Header";

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { isExpanded } = useSidebar();
  
  return (
    <div 
      className={`flex flex-1 flex-col overflow-hidden transition-all duration-300 ease-in-out
        ${isExpanded ? "lg:pl-[19.5rem]" : "lg:pl-[6.5rem]"}
      `}
    >
      <Header />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 no-scrollbar bg-card/30 rounded-tl-[2rem] border-t border-l border-border/40 shadow-[inset_0_4px_24px_rgba(0,0,0,0.02)] mt-2 ml-0">
        <div className="mx-auto max-w-7xl h-full">
          {children}
        </div>
      </main>
    </div>
  );
};
