import { create } from 'zustand';

type ViewMode = 'textured' | 'wireframe' | 'flat';
type StressDataViewMode = 'voxels' | 'vertex_shading';

type ViewerStore = {
  viewMode: ViewMode;
  selectedPartId: string | null;
  showStressData: boolean;
  stressDataViewMode: StressDataViewMode;

  // Actions
  setViewMode: (mode: ViewMode) => void;
  resetViewMode: () => void;
  selectPart: (id: string | null) => void;
  resetSelection: () => void;
  setShowStressData: (show: boolean) => void;
  setStressDataViewMode: (mode: StressDataViewMode) => void;
  resetStressSettings: () => void;
}

export const useViewerStore = create<ViewerStore>((set) => ({
  viewMode: 'textured',
  selectedPartId: null,
  showStressData: false,
  stressDataViewMode: 'voxels',

  setViewMode: (mode) => set({ viewMode: mode }),

  resetViewMode: () => set({ viewMode: 'textured' }),

  selectPart: (id) => set({ selectedPartId: id }),

  resetSelection: () => set({ selectedPartId: null }),

  setShowStressData: (show) => set({ showStressData: show }),

  setStressDataViewMode: (mode) => set({ stressDataViewMode: mode }),

  resetStressSettings: () => set({ showStressData: false, stressDataViewMode: 'voxels' }),
}));