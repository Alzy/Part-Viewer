import { create } from 'zustand';

type ViewMode = 'textured' | 'wireframe' | 'flat';

type ViewerStore = {
  viewMode: ViewMode;

  // Actions
  setViewMode: (mode: ViewMode) => void;
  resetViewMode: () => void;
}

export const useViewerStore = create<ViewerStore>((set) => ({
  viewMode: 'textured',

  setViewMode: (mode) => set({ viewMode: mode }),

  resetViewMode: () => set({ viewMode: 'textured' }),
}));