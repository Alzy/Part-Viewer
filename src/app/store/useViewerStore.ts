import { create } from 'zustand';

type ViewMode = 'textured' | 'wireframe' | 'flat';

type ViewerStore = {
  viewMode: ViewMode;
  selectedPartId: string | null;

  // Actions
  setViewMode: (mode: ViewMode) => void;
  resetViewMode: () => void;
  selectPart: (id: string | null) => void;
  resetSelection: () => void;
}

export const useViewerStore = create<ViewerStore>((set) => ({
  viewMode: 'textured',
  selectedPartId: null,

  setViewMode: (mode) => set({ viewMode: mode }),

  resetViewMode: () => set({ viewMode: 'textured' }),

  selectPart: (id) => set({ selectedPartId: id }),

  resetSelection: () => set({ selectedPartId: null }),
}));