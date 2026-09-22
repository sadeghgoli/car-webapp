"use client";

import { X, MapPin, Gauge, Clock, Wifi, WifiOff, Activity, FileText } from "lucide-react";
import { useVehicleDetail } from "@/hooks/use-api";
import { useDashboardStore } from "@/stores/dashboard-store";
import { formatJalaliDate, getStatusLabel, cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  moving: "bg-emerald-100 text-emerald-700",
  stopped: "bg-amber-100 text-amber-700",
  offline: "bg-red-100 text-red-700",
};

export function VehicleDetailPanel() {
  const selectedVehicleId = useDashboardStore((s) => s.selectedVehicleId);
  const selectVehicle = useDashboardStore((s) => s.selectVehicle);
  const { data: vehicle, isLoading } = useVehicleDetail(selectedVehicleId);

  if (!selectedVehicleId) return null;

  return (
    <aside className="absolute bottom-4 left-4 z-[1000] w-96 rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h3 className="font-bold text-slate-800">جزئیات خودرو</h3>
        <button
          onClick={() => selectVehicle(null)}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {isLoading && (
        <div className="p-5">
          <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
        </div>
      )}

      {vehicle && (
        <div className="max-h-[60vh] overflow-y-auto p-5">
          <div className="mb-4">
            <h4 className="text-lg font-bold text-slate-800">{vehicle.title}</h4>
            <p className="mt-1 font-mono text-sm text-slate-500">{vehicle.plate}</p>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
              {vehicle.categoryName}
            </span>
            <span className={cn("rounded-full px-3 py-1 text-xs font-medium", statusColors[vehicle.status])}>
              {getStatusLabel(vehicle.status)}
            </span>
          </div>

          {vehicle.position.description && (
            <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
              <div className="mb-1 flex items-center gap-2 text-xs font-medium text-blue-600">
                <FileText className="h-3.5 w-3.5" />
                توضیحات موقعیت
              </div>
              <p className="text-sm font-medium leading-6 text-slate-800">
                {vehicle.position.description}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <InfoRow
              icon={MapPin}
              label="مبدا"
              value={`${vehicle.origin.lat.toFixed(5)}, ${vehicle.origin.lng.toFixed(5)}`}
            />
            <InfoRow
              icon={MapPin}
              label="مقصد"
              value={`${vehicle.destination.lat.toFixed(5)}, ${vehicle.destination.lng.toFixed(5)}`}
            />
            <InfoRow icon={Gauge} label="سرعت فعلی" value={`${vehicle.position.speed} km/h`} />
            <InfoRow
              icon={MapPin}
              label="موقعیت"
              value={`${vehicle.position.lat.toFixed(5)}, ${vehicle.position.lng.toFixed(5)}`}
            />
            <InfoRow
              icon={Clock}
              label="آخرین دریافت موقعیت"
              value={formatJalaliDate(vehicle.position.timestamp)}
            />
            <InfoRow
              icon={vehicle.connectionStatus === "online" ? Wifi : WifiOff}
              label="وضعیت ارتباط"
              value={getStatusLabel(vehicle.connectionStatus)}
            />
            <InfoRow
              icon={Activity}
              label="آخرین حرکت"
              value={formatJalaliDate(vehicle.lastMovementAt)}
            />
            {vehicle.driverName && (
              <InfoRow icon={MapPin} label="راننده" value={vehicle.driverName} />
            )}
            {vehicle.unit && (
              <InfoRow icon={MapPin} label="واحد" value={vehicle.unit} />
            )}
          </div>

          {vehicle.positionHistory && vehicle.positionHistory.length > 0 && (
            <div className="mt-5 border-t border-slate-100 pt-4">
              <h5 className="mb-3 text-sm font-semibold text-slate-700">سابقه موقعیت</h5>
              <div className="space-y-2">
                {vehicle.positionHistory.slice(0, 5).map((pos, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
                    <span className="font-mono text-slate-600">
                      {pos.lat.toFixed(4)}, {pos.lng.toFixed(4)}
                    </span>
                    <span className="text-slate-400">{formatJalaliDate(pos.timestamp)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-700">{value}</p>
      </div>
    </div>
  );
}
