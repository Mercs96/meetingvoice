"use client";

import { useAppStore } from "@/lib/store";
import { AudioLines, ListChecks, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Sidebar() {
  const { view, setView, sidebarOpen, setSidebar, meetings } = useAppStore();

  const nav = [
    { id: "dashboard" as const, label: "Reuniones", icon: ListChecks },
    { id: "settings" as const, label: "Ajustes", icon: Settings },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebar(false)}
        />
      )}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-72 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/30">
                <AudioLines className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight">MeetingVoice</h1>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Open Source · Gratis
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8"
              onClick={() => setSidebar(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* New meeting button */}
          <div className="px-4 pb-2">
            <Button
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white shadow-md shadow-indigo-500/30"
              onClick={() => setView("recording")}
            >
              <AudioLines className="w-4 h-4 mr-2" />
              Nueva reunión
            </Button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-3 space-y-1">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setView(item.id);
                    setSidebar(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Stats */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/40 p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground">
                  Total reuniones
                </span>
                <Badge
                  variant="secondary"
                  className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                >
                  {meetings.length}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Tus grabaciones se guardan localmente en este dispositivo.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
