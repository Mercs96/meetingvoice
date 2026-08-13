"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Dashboard } from "@/components/dashboard/dashboard";
import { RecordingView } from "@/components/recording/recording-view";
import { MeetingDetail } from "@/components/meeting/meeting-detail";
import { SettingsView } from "@/components/dashboard/settings-view";
import { Menu, AudioLines } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { view, setView, setSidebar, sidebarOpen } = useAppStore();

  // Register service worker for PWA
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* ignore */
      });
    }
  }, []);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar — hidden on mobile when in recording view */}
      {view !== "recording" && <Sidebar />}

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-30 bg-background/95 backdrop-blur border-b pt-safe">
          <div className="flex items-center justify-between px-4 h-14">
            {view !== "recording" ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setSidebar(!sidebarOpen)}
              >
                <Menu className="w-5 h-5" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView("dashboard")}
                className="text-sm"
              >
                Cancelar
              </Button>
            )}
            <button
              onClick={() => setView("dashboard")}
              className="flex items-center gap-2"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                <AudioLines className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-sm">MeetingVoice</span>
            </button>
            <div className="w-9" />
          </div>
        </header>

        <div className="flex-1 pb-safe">
          {view === "dashboard" && <Dashboard />}
          {view === "recording" && <RecordingView />}
          {view === "detail" && <MeetingDetail />}
          {view === "settings" && <SettingsView />}
        </div>
      </main>
    </div>
  );
}
