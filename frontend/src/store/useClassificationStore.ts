import { create } from 'zustand';
import type { UnlabeledSummary } from '../types/classification';

interface ClassificationState {
  pendingTitles: UnlabeledSummary[];
  selectedTitle: UnlabeledSummary | null;
  isLoading: boolean;
  setPendingTitles: (titles: UnlabeledSummary[]) => void;
  setSelectedTitle: (title: UnlabeledSummary | null) => void;
  removeTitle: (windowTitle: string) => void;
}

export const useClassificationStore = create<ClassificationState>((set) => ({
  pendingTitles: [],
  selectedTitle: null,
  isLoading: false,
  setPendingTitles: (titles) => set({ pendingTitles: titles }),
  setSelectedTitle: (title) => set({ selectedTitle: title }),
  removeTitle: (windowTitle) => set((state) => ({
    pendingTitles: state.pendingTitles.filter(t => t.title !== windowTitle),
    selectedTitle: state.selectedTitle?.title === windowTitle ? null : state.selectedTitle
  })),
}));