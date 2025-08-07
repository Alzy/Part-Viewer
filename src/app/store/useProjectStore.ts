import { create } from 'zustand';
import {Matrix4, BufferGeometry, Material} from "three";

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
}

type ProjectStore = {
  project: Project | null

  // Actions
  loadProject: (name: string, parts: Part[]) => void
  updatePartMatrix: (partId: string, newMatrix: Matrix4) => void
  setValidityReport: (report: ValidityReport) => void
  resetProject: () => void
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  project: null,

  loadProject: (name, parts) => set({
    project: {
      name,
      parts,
      validityReport: null,
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

  resetProject: () => set({ project: null }),
}))
