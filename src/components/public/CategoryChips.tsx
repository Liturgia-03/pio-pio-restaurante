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

  // Auto-scroll del chip activo horizontalmente (sin alterar el scroll vertical de la ventana)
  useEffect(() => {
    if (!containerRef.current) return;
    const activeBtn = containerRef.current.querySelector<HTMLButtonElement>(
      `[data-category-id="${activeCategoryId}"]`
    );
    if (activeBtn) {
      const container = containerRef.current;
      const btnLeft = activeBtn.offsetLeft;
      const btnWidth = activeBtn.offsetWidth;
      const containerWidth = container.offsetWidth;
      const targetScrollLeft = btnLeft - containerWidth / 2 + btnWidth / 2;
      container.scrollTo({
        left: targetScrollLeft,
        behavior: "smooth",
      });
    }
  }, [activeCategoryId]);

  return (
    <div className="sticky top-0 z-30 bg-[#0f1115]/95 backdrop-blur-md border-b border-gray-800/80 py-2 px-3 shadow-md">
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
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 ease-out min-h-[38px] active:scale-95 ${
                isActive
                  ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/25 scale-[1.02]"
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

