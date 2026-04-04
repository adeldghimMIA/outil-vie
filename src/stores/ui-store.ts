import { create } from "zustand";
import type { CalendarView, DashboardTab } from "@/types";

export type ActiveMode = "pro" | "perso" | "global";

interface UIState {
  activeTab: DashboardTab;
  activeMode: ActiveMode;
  calendarView: CalendarView;
  sidebarOpen: boolean;
  commandPaletteOpen: boolean;
  setActiveTab: (tab: DashboardTab) => void;
  setActiveMode: (mode: ActiveMode) => void;
  setCalendarView: (view: CalendarView) => void;
  setSidebarOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: "global",
  activeMode: "global",
  calendarView: "week",
  sidebarOpen: false,
  commandPaletteOpen: false,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveMode: (mode) => set({ activeMode: mode }),
  setCalendarView: (view) => set({ calendarView: view }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
}));
