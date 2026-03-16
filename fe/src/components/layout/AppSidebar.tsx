"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import {
  LayoutDashboard,
  ListTodo,
  ChevronDown,
  Settings,
  UserCircleIcon,
  BellRing
} from "lucide-react";

type NavSubItem = {
  name: string;
  path: string;
};

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: NavSubItem[];
};

const navItems: NavItem[] = [
  {
    icon: <LayoutDashboard className="w-[1.2rem] h-[1.2rem]" />,
    name: "Dashboard",
    path: "/",
  },
  {
    icon: <ListTodo className="w-[1.2rem] h-[1.2rem]" />,
    name: "Tasks",
    subItems: [
      { name: "All Tasks", path: "/tasks" },
      { name: "Create New Task", path: "/tasks/new" },
    ],
  },
];

const othersItems: NavItem[] = [
  {
    icon: <Settings className="w-[1.2rem] h-[1.2rem]" />,
    name: "Settings",
    path: "/settings",
  },
  {
    icon: <BellRing className="w-[1.2rem] h-[1.2rem]" />,
    name: "Notifications",
    path: "/notifications",
  },
  {
    icon: <UserCircleIcon className="w-[1.2rem] h-[1.2rem]" />,
    name: "User Profile",
    path: "/profile",
  },
];

export const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, toggleMobileSidebar } = useSidebar();
  const pathname = usePathname();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-2.5">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`flex items-center rounded-xl px-1.5 py-3 w-full text-sm transition-all duration-200
                ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "bg-white/50 font-medium text-black dark:text-blue-300 dark:bg-gray-800/60 shadow-sm"
                    : "text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10"
                }
                ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-between px-3"}
              `}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex items-center justify-center w-6 h-6 ${
                    openSubmenu?.type === menuType && openSubmenu?.index === index
                      ? "text-gray-900 dark:text-white"
                      : "text-primary/70 dark:text-blue-300"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="font-medium whitespace-nowrap">{nav.name}</span>
                )}
              </div>
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 ${
                    openSubmenu?.type === menuType && openSubmenu?.index === index
                      ? "rotate-180"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path!}
                onClick={() => isMobileOpen && toggleMobileSidebar()}
                className={`flex items-center rounded-xl px-1.5 py-3 w-full text-sm transition-all duration-200 relative group
                  ${
                    isActive(nav.path)
                      ? "bg-black/10 font-medium text-gray-800 dark:bg-gray-800/80 dark:text-white shadow-sm"
                      : "text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10"
                  }
                  ${!isExpanded && !isHovered ? "lg:justify-center" : "px-3"}
                `}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex items-center justify-center w-6 h-6 transition-colors ${
                      isActive(nav.path)
                        ? "text-gray-900 dark:text-white"
                        : "text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                    }
                  `}
                  >
                    {nav.icon}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="font-medium whitespace-nowrap">
                      {nav.name}
                    </span>
                  )}
                </div>
                
                {/* Tooltip for collapsed state */}
                {!isExpanded && !isHovered && !isMobileOpen && (
                  <div className="absolute left-14 rounded-md px-2 py-1 ml-2 bg-popover text-popover-foreground text-xs opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-all z-50 whitespace-nowrap shadow-md border">
                    {nav.name}
                  </div>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300 ease-in-out"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1.5 pl-9 pr-2">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      onClick={() => isMobileOpen && toggleMobileSidebar()}
                      className={`flex items-center rounded-lg px-3 py-2.5 text-sm transition-all duration-200 w-full text-left relative
                        ${
                          isActive(subItem.path)
                            ? "bg-primary/10 font-medium text-primary dark:bg-white/10 dark:text-white shadow-sm"
                            : "text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200"
                        }
                      `}
                    >
                      <span className="flex items-center gap-2 whitespace-nowrap">
                        {subItem.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={toggleMobileSidebar}
        />
      )}

      {/* Sidebar - Matching connectiviz styles precisely */}
      <aside 
        className={`fixed mt-16 lg:mt-4 top-0 left-0 lg:left-4 rounded-3xl h-[calc(100vh-2rem)] z-50
          bg-cyan-50/80 dark:bg-gray-900/90 border border-blue-700/10 dark:border-gray-800
          transition-all duration-300 ease-in-out shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.1)] backdrop-blur-xl
          ${isExpanded || isMobileOpen ? "w-[17.5rem]" : isHovered ? "w-[17.5rem]" : "w-16"}
          ${isMobileOpen ? "translate-x-0" : "-translate-x-[110%] sm:-translate-x-[90%]"}
          lg:translate-x-0 overflow-hidden flex flex-col`}
        onMouseEnter={() => !isExpanded && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={`py-6 m-2 flex ${!isExpanded && !isHovered ? "justify-center" : "px-6"}`}>
          <Link 
            href="/"
            className="flex items-center gap-3 transition-opacity duration-200 hover:opacity-80"
          >
            <div className={`flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-600 text-white font-bold shadow-lg shadow-primary/30 transition-all duration-300 ${isExpanded || isHovered || isMobileOpen ? "w-10 h-10 text-lg" : "w-10 h-10 text-lg"}`}>
              TP
            </div>
            {(isExpanded || isHovered || isMobileOpen) && (
              <span className="text-xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight ml-1 animate-in fade-in duration-300">
                TaskPulse
              </span>
            )}
          </Link>
        </div>

        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden px-3 pb-6 custom-scrollbar">
          <nav className="mb-6 rounded-2xl bg-white/60 shadow-sm border border-slate-100 dark:border-slate-800 dark:bg-gray-950/50 py-4 px-2.5 transition-colors">
            <div>
              <h2
                className={`text-xs font-bold uppercase tracking-widest 
                  text-blue-900/60 dark:text-gray-500/80 mb-3 
                  ${!isExpanded && !isHovered ? "text-center" : "px-3"}`}
              >
                {isExpanded || isHovered || isMobileOpen ? "Main Menu" : "••"}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>

            <div className="mt-8">
              <h2
                className={`text-xs font-bold uppercase tracking-widest
                  text-blue-900/60 dark:text-gray-500/80 mb-3 
                  ${!isExpanded && !isHovered ? "text-center" : "px-3"}`}
              >
                {isExpanded || isHovered || isMobileOpen ? "System" : "••"}
              </h2>
              {renderMenuItems(othersItems, "others")}
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
};

