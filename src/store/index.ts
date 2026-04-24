import { create } from 'zustand';
import { createWorkflowSlice, type WorkflowSlice } from './slices/workflow-slice';
import { createExecutionSlice, type ExecutionSlice } from './slices/execution-slice';
import { createUISlice, type UISlice } from './slices/ui-slice';

export type AppStore = WorkflowSlice & ExecutionSlice & UISlice;

export const useStore = create<AppStore>()((...a) => ({
  ...createWorkflowSlice(...a),
  ...createExecutionSlice(...a),
  ...createUISlice(...a),
}));
