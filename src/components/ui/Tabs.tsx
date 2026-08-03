"use client";

import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className }) => {
  return (
    <div className={twMerge("flex items-center gap-2 p-1.5 glass-panel rounded-full w-fit", className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={clsx(
              "px-5 py-2 rounded-full text-xs font-semibold tracking-wide uppercase transition-all duration-300 flex items-center gap-2",
              isActive
                ? "bg-gold-gradient text-velora-bg shadow-gold-glow font-bold"
                : "text-velora-textSecondary hover:text-velora-textPrimary hover:bg-white/5"
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={clsx(
                  "px-1.5 py-0.5 rounded-full text-[10px] font-mono",
                  isActive ? "bg-velora-bg/30 text-velora-bg" : "bg-white/10 text-velora-textSecondary"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
