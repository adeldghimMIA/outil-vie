import { create } from "zustand";
import type { CalendarView, DashboardTab } from "@/types";

interface UIState {
  activeTab: DashboardTab;
  calendarView: CalendarView;
  sidebarOpen: boolean;
  commandPaletteOpen: boolean;
  setActiveTab: (tab: DashboardTab) => void;
  setCalendarView: (view: CalendarView) => void;
  setSidebarOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: "global",
  calendarView: "week",
  sidebarOpen: false,
  commandPaletteOpen: false,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setCalendarView: (view) => set({ calendarView: view }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
}));
