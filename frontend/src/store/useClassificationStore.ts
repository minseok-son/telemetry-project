import { create } from 'zustand';
import type { UnlabeledTitle } from '../types/classification';
import type { Category } from '../types/shared';

interface ClassificationState {
  pendingTitles: UnlabeledTitle[];
  selectedTitle: UnlabeledTitle | null;
  isLoading: boolean;
  setPendingTitles: (titles: UnlabeledTitle[]) => void;
  setSelectedTitle: (title: UnlabeledTitle | null) => void;
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