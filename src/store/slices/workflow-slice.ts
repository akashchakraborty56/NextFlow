import { type StateCreator } from 'zustand';
import { type Node, type Edge, type Connection } from '@xyflow/react';
import { nanoid } from 'nanoid';
import { api } from '@/lib/api-client';
import { NODE_REGISTRY } from '@/lib/node-registry';
import { wouldCreateCycle } from '@/lib/dag';
import type { WorkflowNodeData, NodeType } from '@/types/nodes';
import type { AppStore } from '../index';

/**
 * Check if a source output type is compatible with a target input type.
 */
function isTypeCompatible(outputType: string, inputType: string): boolean {
  if (outputType === inputType) return true;
  if (outputType === 'text' && inputType === 'textarea') return true;
  if (outputType === 'image' && inputType === 'file-image') return true;
  if (outputType === 'video' && inputType === 'file-video') return true;
  return false;
}

export interface WorkflowSlice {
  workflowId: string | null;
  workflowName: string;
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
  past: { nodes: Node<WorkflowNodeData>[]; edges: Edge[] }[];
  future: { nodes: Node<WorkflowNodeData>[]; edges: Edge[] }[];
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: Date | null;

  addNode: (type: NodeType, position: { x: number; y: number }) => void;
  updateNodeData: (nodeId: string, data: Partial<WorkflowNodeData>) => void;
  removeNode: (nodeId: string) => void;
  setNodes: (nodes: Node<WorkflowNodeData>[]) => void;
  addEdge: (connection: Connection) => void;
  setEdges: (edges: Edge[]) => void;
  isValidConnection: (connection: Connection) => boolean;
  loadWorkflow: (id: string) => Promise<void>;
  saveWorkflow: () => Promise<void>;
  createWorkflow: (name: string) => Promise<string>;
  setWorkflowName: (name: string) => void;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
}

export const createWorkflowSlice: StateCreator<
  AppStore, [], [], WorkflowSlice
> = (set, get) => ({
  workflowId: null,
  workflowName: 'Untitled Workflow',
  nodes: [],
  edges: [],
  past: [],
  future: [],
  isDirty: false,
  isSaving: false,
  lastSavedAt: null,

  pushHistory: () => {
    const { nodes, edges, past } = get();
    set({
      past: [...past, { nodes, edges }].slice(-50), // keep last 50
      future: [],
    });
  },

  undo: () => {
    const { nodes, edges, past, future } = get();
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    set({
      past: past.slice(0, -1),
      future: [{ nodes, edges }, ...future],
      nodes: previous.nodes,
      edges: previous.edges,
      isDirty: true,
    });
  },

  redo: () => {
    const { nodes, edges, past, future } = get();
    if (future.length === 0) return;
    const next = future[0];
    set({
      past: [...past, { nodes, edges }],
      future: future.slice(1),
      nodes: next.nodes,
      edges: next.edges,
      isDirty: true,
    });
  },

  addNode: (type, position) => {
    get().pushHistory();
    const def = NODE_REGISTRY[type];
    if (!def) return;

    const id = `node_${nanoid(8)}`;
    const newNode: Node<WorkflowNodeData> = {
      id,
      type,
      position,
      data: {
        type,
        label: def.label,
        inputs: def.inputs.map((inp) => ({ ...inp, value: null, connected: false })),
        outputs: def.outputs.map((out) => ({ ...out, value: null })),
        status: 'idle',
        error: null,
        config: { ...def.defaultConfig },
      },
    };

    set((state) => ({ nodes: [...state.nodes, newNode], isDirty: true }));
  },

  updateNodeData: (nodeId, data) => {
    get().pushHistory();
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } as WorkflowNodeData }
          : node
      ),
      isDirty: true,
    }));
  },

  removeNode: (nodeId) => {
    get().pushHistory();
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      isDirty: true,
    }));
  },

  setNodes: (nodes) => {
    get().pushHistory();
    set({ nodes });
  },

  addEdge: (connection) => {
    const { nodes, edges } = get();
    if (!connection.source || !connection.target) return;
    if (wouldCreateCycle(connection.source, connection.target, nodes, edges)) return;

    get().pushHistory();

    const newEdge: Edge = {
      id: `edge_${nanoid(8)}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle ?? undefined,
      targetHandle: connection.targetHandle ?? undefined,
      type: 'default',
    };

    set({ edges: [...edges, newEdge], isDirty: true });
  },

  setEdges: (edges) => {
    get().pushHistory();
    set({ edges });
  },

  isValidConnection: (connection) => {
    const { nodes, edges } = get();
    if (!connection.source || !connection.target) return false;
    if (connection.source === connection.target) return false;

    // Find source and target nodes
    const sourceNode = nodes.find((n) => n.id === connection.source);
    const targetNode = nodes.find((n) => n.id === connection.target);
    if (!sourceNode || !targetNode) return false;

    // Find registry definitions
    const sourceDef = NODE_REGISTRY[sourceNode.data.type];
    const targetDef = NODE_REGISTRY[targetNode.data.type];
    if (!sourceDef || !targetDef) return false;

    // Check if source handle exists in registry
    const sourceOutput = sourceDef.outputs.find((o) => o.handleId === connection.sourceHandle);
    if (!sourceOutput) return false;

    // Check if target handle exists in registry
    const targetInput = targetDef.inputs.find((i) => i.handleId === connection.targetHandle);
    if (!targetInput) return false;

    // Check type compatibility using registry type definitions
    if (!isTypeCompatible(sourceOutput.type, targetInput.type)) {
      return false;
    }

    // Prevent multiple connections to the same target handle (except images which can have multiple)
    if (connection.targetHandle !== 'image-in') {
      const exists = edges.some(
        (e) => e.target === connection.target && e.targetHandle === connection.targetHandle
      );
      if (exists) return false;
    }

    return !wouldCreateCycle(connection.source, connection.target, nodes, edges);
  },

  loadWorkflow: async (id) => {
    try {
      const workflow = await api.getWorkflow(id);

      const nodes: Node<WorkflowNodeData>[] = workflow.nodes.map((n: any) => {
        const nodeType = n.nodeType.toLowerCase().replace('_', '-') as NodeType;
        return {
          id: n.id,
          type: nodeType,
          position: { x: n.positionX, y: n.positionY },
          data: {
            type: nodeType,
            label: n.label,
            inputs: n.inputs as any[],
            outputs: n.outputs as any[],
            status: 'idle' as const,
            error: null,
            config: n.config as Record<string, any>,
          },
        };
      });

      const edges: Edge[] = workflow.edges.map((e: any) => ({
        id: e.id,
        source: e.sourceNodeId,
        target: e.targetNodeId,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        type: 'default',
      }));

      set({
        workflowId: workflow.id,
        workflowName: workflow.name,
        nodes,
        edges,
        past: [],
        future: [],
        isDirty: false,
        lastSavedAt: new Date(workflow.updatedAt),
      });
    } catch (error) {
      console.error('Failed to load workflow:', error);
    }
  },

  saveWorkflow: async () => {
    const { workflowId, workflowName, nodes, edges } = get();
    if (!workflowId) return;

    set({ isSaving: true });

    try {
      await api.saveWorkflow(workflowId, {
        name: workflowName,
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.type,
          position: n.position,
          data: n.data,
        })),
        edges: edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle,
        })),
        canvasState: null,
      });

      set({ isDirty: false, isSaving: false, lastSavedAt: new Date() });
    } catch (error) {
      console.error('Failed to save workflow:', error);
      set({ isSaving: false });
    }
  },

  createWorkflow: async (name) => {
    const workflow = await api.createWorkflow({ name });
    set({ workflowId: workflow.id, workflowName: workflow.name, nodes: [], edges: [], past: [], future: [], isDirty: false });
    return workflow.id;
  },

  setWorkflowName: (name) => set({ workflowName: name, isDirty: true }),
});

