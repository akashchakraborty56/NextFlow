import { type StateCreator } from 'zustand';
import { api } from '@/lib/api-client';
import type { AppStore } from '../index';

export interface NodeExecutionResult {
  nodeId: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  outputs: Record<string, any> | null;
  resolvedInputs: Record<string, any> | null;
  error: string | null;
  durationMs: number | null;
}

export interface ExecutionRun {
  id: string;
  workflowId: string;
  status: string;
  mode: string;
  startedAt: string;
  completedAt: string | null;
  duration: number | null;
  nodeResults: Map<string, NodeExecutionResult>;
}

export interface ExecutionSlice {
  currentRun: ExecutionRun | null;
  history: ExecutionRun[];
  isExecuting: boolean;
  pollingInterval: ReturnType<typeof setInterval> | null;

  executeWorkflow: (mode: 'full' | 'partial' | 'single_node', fromNodeId?: string) => Promise<void>;
  executeNode: (nodeId: string) => Promise<void>;
  cancelExecution: () => void;
  loadHistory: (workflowId: string) => Promise<void>;
  startPolling: (executionId: string) => void;
  stopPolling: () => void;
}

const POLL_INTERVAL_MS = 2000;

export const createExecutionSlice: StateCreator<
  AppStore, [], [], ExecutionSlice
> = (set, get) => ({
  currentRun: null,
  history: [],
  isExecuting: false,
  pollingInterval: null,

  executeWorkflow: async (mode, fromNodeId) => {
    const { workflowId } = get();
    if (!workflowId) return;

    set({ isExecuting: true });
    set((state) => ({
      nodes: state.nodes.map((n) => ({
        ...n,
        data: { ...n.data, status: 'pending' as const, error: null },
      })),
    }));

    try {
      const { executionId } = await api.executeWorkflow(workflowId, mode, fromNodeId);
      set({
        currentRun: {
          id: executionId, workflowId, status: 'pending', mode,
          startedAt: new Date().toISOString(), completedAt: null,
          duration: null, nodeResults: new Map(),
        },
      });
      get().startPolling(executionId);
    } catch (error: any) {
      console.error('Failed to execute workflow:', error);
      set({ isExecuting: false });
      set((state) => ({
        nodes: state.nodes.map((n) => ({
          ...n,
          data: { ...n.data, status: 'idle' as const },
        })),
      }));
      alert('Execution failed: ' + (error.message || 'Unknown error'));
    }
  },

  executeNode: async (nodeId) => {
    const { workflowId } = get();
    if (!workflowId) return;

    set({ isExecuting: true });
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, status: 'pending' as const, error: null } }
          : n
      ),
    }));

    try {
      const { executionId } = await api.executeNode(workflowId, nodeId);
      set({
        currentRun: {
          id: executionId, workflowId, status: 'pending', mode: 'single_node',
          startedAt: new Date().toISOString(), completedAt: null,
          duration: null, nodeResults: new Map(),
        },
      });
      get().startPolling(executionId);
    } catch (error: any) {
      console.error('Failed to execute node:', error);
      set({ isExecuting: false });
      alert('Node execution failed: ' + (error.message || 'Unknown error'));
    }
  },

  cancelExecution: () => {
    get().stopPolling();
    set({ isExecuting: false });
  },

  loadHistory: async (workflowId: string) => {
    try {
      const { executions } = await api.listExecutions(workflowId);
      const runs: ExecutionRun[] = executions.map((execution: any) => {
        const nodeResults = new Map<string, NodeExecutionResult>();
        for (const ne of execution.nodeExecutions ?? []) {
          nodeResults.set(ne.workflowNodeId, {
            nodeId: ne.workflowNodeId,
            status: ne.status.toLowerCase(),
            outputs: ne.outputs,
            resolvedInputs: ne.resolvedInputs,
            error: ne.error,
            durationMs: ne.durationMs,
          });
        }
        return {
          id: execution.id,
          workflowId: execution.workflowId,
          status: execution.status.toLowerCase(),
          mode: (execution.mode || 'FULL').toLowerCase(),
          startedAt: execution.startedAt,
          completedAt: execution.completedAt,
          duration: execution.durationMs,
          nodeResults,
        };
      });
      set({ history: runs });
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  },

  startPolling: (executionId) => {
    const existing = get().pollingInterval;
    if (existing) clearInterval(existing);

    let attempts = 0;
    const MAX_ATTEMPTS = 150; // 5 minutes (2000ms * 150)

    const poll = async () => {
      attempts++;
      if (attempts > MAX_ATTEMPTS) {
        console.warn('Polling timeout: Max attempts reached');
        get().stopPolling();
        set({ isExecuting: false });
        alert('Execution timed out. Please check the history panel for status.');
        return;
      }
      try {
        const execution = await api.getExecution(executionId);
        const nodeResults = new Map<string, NodeExecutionResult>();
        for (const ne of execution.nodeExecutions ?? []) {
          nodeResults.set(ne.workflowNodeId, {
            nodeId: ne.workflowNodeId,
            status: ne.status.toLowerCase(),
            outputs: ne.outputs,
            resolvedInputs: ne.resolvedInputs,
            error: ne.error,
            durationMs: ne.durationMs,
          });
        }

        const run: ExecutionRun = {
          id: execution.id,
          workflowId: execution.workflowId,
          status: execution.status.toLowerCase(),
          mode: (execution.mode || 'FULL').toLowerCase(),
          startedAt: execution.startedAt,
          completedAt: execution.completedAt,
          duration: execution.durationMs,
          nodeResults,
        };

        set({ currentRun: run });

        // Sync node statuses to canvas
        set((state) => ({
          nodes: state.nodes.map((node) => {
            const result = nodeResults.get(node.id);
            if (!result) return node;
            const nodeData = node.data as any;
            return {
              ...node,
              data: {
                ...nodeData,
                status: result.status,
                error: result.error,
                outputs: result.outputs
                  ? nodeData.outputs.map((o: any) => ({
                      ...o, value: result.outputs?.[o.key] ?? o.value,
                    }))
                  : nodeData.outputs,
              },
            };
          }),
        }));

        // Stop if complete
        if (['success', 'failed', 'cancelled'].includes(run.status)) {
          get().stopPolling();
          set((state) => ({
            isExecuting: false,
            history: [run, ...state.history.filter((h) => h.id !== run.id)].slice(0, 20),
          }));

          if (run.status === 'success') {
            alert('Workflow execution completed successfully!');
          } else if (run.status === 'failed') {
            const failedNodes = Array.from(run.nodeResults.values()).filter((r) => r.status === 'failed');
            const errorMsg = failedNodes.map((n) => `${n.nodeId}: ${n.error}`).join('\n');
            alert('Workflow execution failed.\n' + errorMsg);
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    set({ pollingInterval: interval });
  },

  stopPolling: () => {
    const interval = get().pollingInterval;
    if (interval) clearInterval(interval);
    set({ pollingInterval: null });
  },
});

