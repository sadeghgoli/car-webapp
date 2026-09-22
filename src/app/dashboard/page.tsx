import { Header } from "@/components/layout/header";
import { LayerPanel } from "@/components/panels/layer-panel";
import { MapSection } from "@/components/map/map-section";

export default function DashboardPage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <MapSection />
        <LayerPanel />
      </div>
    </div>
  );
}
