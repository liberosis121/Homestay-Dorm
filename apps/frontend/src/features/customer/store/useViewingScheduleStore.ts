import { create } from 'zustand';

interface ViewingScheduleState {
  activeTab: 'upcoming' | 'past';
  searchQuery: string;
  cancellingId: string | null;
  reschedulingId: string | null;
  rescheduleDate: string;
  rescheduleTime: string;
  
  setActiveTab: (tab: 'upcoming' | 'past') => void;
  setSearchQuery: (q: string) => void;
  setCancellingId: (id: string | null) => void;
  setReschedulingId: (id: string | null) => void;
  setRescheduleDate: (d: string) => void;
  setRescheduleTime: (t: string) => void;
  reset: () => void;
}

export const useViewingScheduleStore = create<ViewingScheduleState>((set) => ({
  activeTab: 'upcoming',
  searchQuery: '',
  cancellingId: null,
  reschedulingId: null,
  rescheduleDate: '',
  rescheduleTime: '',

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setCancellingId: (id) => set({ cancellingId: id }),
  setReschedulingId: (id) => set({ reschedulingId: id }),
  setRescheduleDate: (d) => set({ rescheduleDate: d }),
  setRescheduleTime: (t) => set({ rescheduleTime: t }),
  reset: () => set({ cancellingId: null, reschedulingId: null, rescheduleDate: '', rescheduleTime: '' }),
}));
