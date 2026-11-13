"use client";

import { useRef, useEffect } from "react";
import { IconRenderer } from "@/components/common/IconRenderer";

interface CategoryChipItem {
  id: string;
  name: string;
  iconName?: string | null;
}

interface CategoryChipsProps {
  categories: CategoryChipItem[];
  activeCategoryId: string;
  onSelectCategory: (id: string) => void;
}

export function CategoryChips({
  categories,
  activeCategoryId,
  onSelectCategory,
}: CategoryChipsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the active chip into view horizontally
  useEffect(() => {
    if (!containerRef.current) return;
    const activeBtn = containerRef.current.querySelector<HTMLButtonElement>(
      `[data-category-id="${activeCategoryId}"]`
    );
    if (activeBtn) {
      activeBtn.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [activeCategoryId]);

  return (
    <div className="sticky top-[60px] z-30 bg-[#0f1115]/95 backdrop-blur-md border-b border-gray-800/80 py-2.5 px-3">
      <div
        ref={containerRef}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth"
      >
        {categories.map((cat) => {
          const isActive = cat.id === activeCategoryId;
          return (
            <button
              key={cat.id}
              data-category-id={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 min-h-[38px] active:scale-95 ${
                isActive
                  ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/20"
                  : "bg-[#181b20] text-gray-400 hover:text-gray-200 border border-gray-800"
              }`}
            >
              <IconRenderer
                name={cat.iconName}
                className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-orange-500"}`}
              />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

