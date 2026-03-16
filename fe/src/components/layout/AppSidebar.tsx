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
      { name: "Create New Task", path: "/tasks?create=1" },
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
  const shouldExpand = isExpanded || isHovered || isMobileOpen;

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => path.split('?')[0] === pathname, [pathname]);

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
              className={`flex w-full items-center rounded-lg px-1 py-2.5 text-sm transition-all duration-200
                ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "bg-black/10 font-medium text-gray-900 dark:bg-gray-800/60 dark:text-white"
                    : "text-gray-800 hover:bg-gray-800/10 dark:text-gray-300 dark:hover:bg-gray-200/20"
                }
                ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-between"}
              `}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex items-center justify-center w-6 h-6 ${
                    openSubmenu?.type === menuType && openSubmenu?.index === index
                      ? "text-gray-900 dark:text-white"
                      : "text-orange-800 dark:text-blue-300"
                  }`}
                >
                  {nav.icon}
                </span>
                {shouldExpand && (
                  <span className="font-medium whitespace-nowrap">{nav.name}</span>
                )}
              </div>
              {shouldExpand && (
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
                className={`group relative flex w-full items-center rounded-lg px-1 py-2.5 text-sm transition-all duration-200
                  ${
                    isActive(nav.path)
                      ? "bg-black/10 font-medium text-gray-900 dark:bg-gray-800/60 dark:text-white"
                      : "text-gray-800 hover:bg-gray-800/10 dark:text-gray-300 dark:hover:bg-gray-200/20"
                  }
                  ${!isExpanded && !isHovered ? "lg:justify-center" : ""}
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
                  {shouldExpand && (
                    <span className="font-medium whitespace-nowrap">
                      {nav.name}
                    </span>
                  )}
                </div>
                
                {/* Tooltip for collapsed state */}
                {!shouldExpand && (
                  <div className="absolute left-14 rounded-md px-2 py-1 ml-2 bg-popover text-popover-foreground text-xs opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-all z-50 whitespace-nowrap shadow-md border">
                    {nav.name}
                  </div>
                )}
              </Link>
            )
          )}
          {nav.subItems && shouldExpand && (
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
              <ul className="mt-1 space-y-1 pl-9 pr-2">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      onClick={() => isMobileOpen && toggleMobileSidebar()}
                      className={`relative flex w-full items-center rounded-md px-3 py-2 text-left text-sm transition-all duration-200
                        ${
                          isActive(subItem.path)
                            ? "bg-blue-500/10 font-medium text-gray-900 dark:bg-gray-100/10 dark:text-white"
                            : "text-gray-700 hover:bg-white/30 dark:text-gray-300 dark:hover:bg-gray-600/30"
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
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
          onClick={toggleMobileSidebar}
        />
      )}

      <aside 
        className={`fixed left-0 top-0 z-50 mt-16 h-screen rounded-3xl border-2 border-blue-700/10 bg-cyan-100 shadow-lg transition-all duration-300 ease-in-out dark:border-gray-700 dark:bg-gray-900
          lg:left-4 lg:mt-2
          ${isExpanded || isMobileOpen ? "w-72" : isHovered ? "w-72" : "w-20"}
          ${isMobileOpen ? "translate-x-0" : "-translate-x-[110%] sm:-translate-x-[90%]"}
          lg:translate-x-0`}
        onMouseEnter={() => !isExpanded && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={`m-2 mt-3 flex py-5 ${!isExpanded && !isHovered ? "justify-center" : "px-4"}`}>
          <Link 
            href="/"
            onClick={() => isMobileOpen && toggleMobileSidebar()}
            className="flex items-center gap-3 transition-all duration-200 hover:opacity-80"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-blue-600 text-base font-bold text-white shadow-lg shadow-primary/20">
              TP
            </div>
            {shouldExpand && (
              <span className="ml-1 text-xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
                TaskPulse
              </span>
            )}
          </Link>
        </div>

        <div className="flex h-[calc(100vh-7rem)] flex-col overflow-y-auto px-1 py-4 no-scrollbar">
          <nav className="mx-2 mb-6 rounded-lg border-2 border-slate-100 bg-white/70 px-3 py-3 shadow-xl dark:border-slate-700 dark:bg-gray-800">
            <div>
              <h2
                className={`mb-3 text-xs font-semibold uppercase tracking-wider text-blue-900 dark:text-gray-500
                  ${!isExpanded && !isHovered ? "text-center" : "px-3"}`}
              >
                {shouldExpand ? "Menu" : "•••"}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>

            <div>
              <h2
                className={`mb-4 mt-4 text-xs font-semibold uppercase tracking-wider text-blue-900/60 dark:text-gray-500
                  ${!isExpanded && !isHovered ? "text-center" : "px-3"}`}
              >
                {shouldExpand ? "Others" : "•••"}
              </h2>
              {renderMenuItems(othersItems, "others")}
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
};

