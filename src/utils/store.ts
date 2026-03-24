'use client';

import { create } from 'zustand';
import { Database } from '@/types/database';

type Squad = Database['public']['Tables']['squads']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type Course = Database['public']['Tables']['courses']['Row'];

interface AppState {
  // Current user
  currentUser: Profile | null;
  setCurrentUser: (user: Profile | null) => void;

  // Current squad
  currentSquad: Squad | null;
  setCurrentSquad: (squad: Squad | null) => void;

  // Squads list
  squads: Squad[];
  setSquads: (squads: Squad[]) => void;

  // Current course
  currentCourse: Course | null;
  setCurrentCourse: (course: Course | null) => void;

  // UI state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // Theme
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;

  // Player state
  currentItemId: string | null;
  setCurrentItemId: (id: string | null) => void;

  playerReady: boolean;
  setPlayerReady: (ready: boolean) => void;

  currentTime: number;
  setCurrentTime: (time: number) => void;

  duration: number;
  setDuration: (duration: number) => void;

  // Notifications
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    timeout?: number;
  }>;
  addNotification: (
    message: string,
    type?: 'success' | 'error' | 'info' | 'warning',
    timeout?: number
  ) => void;
  removeNotification: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),

  currentSquad: null,
  setCurrentSquad: (squad) => set({ currentSquad: squad }),

  squads: [],
  setSquads: (squads) => set({ squads }),

  currentCourse: null,
  setCurrentCourse: (course) => set({ currentCourse: course }),

  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  theme: 'dark',
  setTheme: (theme) => set({ theme }),

  currentItemId: null,
  setCurrentItemId: (id) => set({ currentItemId: id }),

  playerReady: false,
  setPlayerReady: (ready) => set({ playerReady: ready }),

  currentTime: 0,
  setCurrentTime: (time) => set({ currentTime: time }),

  duration: 0,
  setDuration: (duration) => set({ duration }),

  notifications: [],
  addNotification: (message, type = 'info', timeout = 3000) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          id: Date.now().toString(),
          type,
          message,
          timeout,
        },
      ],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));

// Selection store for UI
interface UISelectionState {
  selectedSquadId: string | null;
  setSelectedSquadId: (id: string | null) => void;

  expandedCourseId: string | null;
  setExpandedCourseId: (id: string | null) => void;
}

export const useUISelection = create<UISelectionState>((set) => ({
  selectedSquadId: null,
  setSelectedSquadId: (id) => set({ selectedSquadId: id }),

  expandedCourseId: null,
  setExpandedCourseId: (id) => set({ expandedCourseId: id }),
}));
