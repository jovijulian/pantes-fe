"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import React, { Suspense } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const role = typeof window !== "undefined" ? localStorage.getItem("role") : null;
  const isMechanic = role == "2";
  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
      ? "ml-0"
      : isExpanded || isHovered
        ? "lg:ml-[290px]"
        : "lg:ml-[90px]";

  return (
    <div className="min-h-screen xl:flex">
      {/* Sidebar and Backdrop */}
      <AppSidebar />
      <Backdrop />
      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all  duration-300 ease-in-out ${mainContentMargin}`}
      >
        {/* Header */}
        <AppHeader />
        {/* Page Content */}

        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
          <Suspense
            fallback={
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60">
                {/* Spinner kustom */}
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
              </div>
            }
          >{children}
          </Suspense>
        </div>

      </div>
    </div>
  );
}
