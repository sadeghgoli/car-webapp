"use client";

import { Layers, Eye, EyeOff } from "lucide-react";
import { useCategories } from "@/hooks/use-api";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

export function LayerPanel() {
  const { data: categories, isLoading } = useCategories();
  const { activeLayerIds, toggleLayer, initializeLayers } = useDashboardStore();

  useEffect(() => {
    if (categories && categories.length > 0 && activeLayerIds.size === 0) {
      initializeLayers(categories.map((c) => c.id));
    }
  }, [categories, activeLayerIds.size, initializeLayers]);

  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
        <Layers className="h-5 w-5 text-blue-600" />
        <h2 className="font-bold text-slate-800">لایه‌های خودرو</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        )}

        {categories?.map((category) => {
          const isActive = activeLayerIds.has(category.id);
          return (
            <button
              key={category.id}
              onClick={() => toggleLayer(category.id)}
              className={cn(
                "mb-2 flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-right transition-all",
                isActive
                  ? "border-blue-200 bg-blue-50 shadow-sm"
                  : "border-slate-100 bg-slate-50 opacity-60 hover:opacity-100",
              )}
            >
              <div
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span className="flex-1 text-sm font-medium text-slate-700">
                {category.name}
              </span>
              {isActive ? (
                <Eye className="h-4 w-4 text-blue-600" />
              ) : (
                <EyeOff className="h-4 w-4 text-slate-400" />
              )}
            </button>
          );
        })}

        {categories?.length === 0 && !isLoading && (
          <p className="text-center text-sm text-slate-500">
            دسترسی به هیچ دسته‌بندی وجود ندارد
          </p>
        )}
      </div>

      <div className="border-t border-slate-100 p-4">
        <p className="text-xs text-slate-400">
          {activeLayerIds.size} لایه فعال از {categories?.length ?? 0} لایه مجاز
        </p>
      </div>
    </aside>
  );
}
