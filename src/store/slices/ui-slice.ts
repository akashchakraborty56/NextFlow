import { type StateCreator } from 'zustand';
import type { AppStore } from '../index';

export interface UISlice {
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  selectedNodeId: string | null;

  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  selectNode: (nodeId: string | null) => void;
}

export const createUISlice: StateCreator<
  AppStore, [], [], UISlice
> = (set) => ({
  leftSidebarOpen: true,
  rightSidebarOpen: true,
  selectedNodeId: null,

  toggleLeftSidebar: () => set((s) => ({ leftSidebarOpen: !s.leftSidebarOpen })),
  toggleRightSidebar: () => set((s) => ({ rightSidebarOpen: !s.rightSidebarOpen })),
  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
});
