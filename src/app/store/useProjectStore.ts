import { create } from 'zustand';
import {Matrix4, BufferGeometry, Material, Object3D} from "three";
import {SimpleVoxelGrid} from "@/app/utils/simpleVoxelGrid";

type Part = {
  id: string
  name: string
  matrix: Matrix4
  geometry?: BufferGeometry
  material?: Material | Material[]
  children?: Part[]
}

type ValidityReport = {
  validatedAt: Date
  success: boolean
  summary: string
}

type Project = {
  name: string
  parts: Part[]
  validityReport: ValidityReport | null
  voxelGrid: SimpleVoxelGrid | null
  sceneRoot: Object3D | null
  isPrintReady: boolean
}

type ProjectStore = {
  project: Project | null

  // Actions
  loadProject: (name: string, parts: Part[], sceneRoot: Object3D) => void
  updatePartMatrix: (partId: string, newMatrix: Matrix4) => void
  setValidityReport: (report: ValidityReport) => void
  setVoxelGrid: (voxelGrid: SimpleVoxelGrid) => void
  setPrintReady: (ready: boolean) => void
  resetProject: () => void
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  project: null,

  loadProject: (name, parts, sceneRoot) => set({
    project: {
      name,
      parts,
      validityReport: null,
      voxelGrid: null,
      sceneRoot,
      isPrintReady: false,
    },
  }),

  updatePartMatrix: (partId, newMatrix) => {
    const updateMatrixRecursive = (parts: Part[]): Part[] =>
      parts.map(part =>
        part.id === partId
          ? { ...part, matrix: newMatrix.clone() }
          : {
              ...part,
              children: part.children ? updateMatrixRecursive(part.children) : undefined,
            }
      )

    set((state) => ({
      project: state.project
        ? {
            ...state.project,
            parts: updateMatrixRecursive(state.project.parts),
          }
        : null,
    }))
  },

  setValidityReport: (report) => {
    set((state) => ({
      project: state.project
        ? { ...state.project, validityReport: report }
        : null,
    }))
  },

  setVoxelGrid: (voxelGrid: SimpleVoxelGrid) => {
    set((state) => ({
      project: state.project
        ? {...state.project, voxelGrid: voxelGrid}
        : null,
    }))
  },

  setPrintReady: (ready: boolean) => {
    set((state) => ({
      project: state.project
        ? {...state.project, isPrintReady: ready}
        : null,
    }))
  },

  resetProject: () => set({ project: null }),
}))
