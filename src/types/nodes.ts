export type NodeType =
  | 'text'
  | 'upload-image'
  | 'upload-video'
  | 'llm'
  | 'crop-image'
  | 'extract-frame';

export type NodeStatus = 'idle' | 'pending' | 'running' | 'success' | 'error' | 'skipped';

export interface NodeInputDef {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'file-image' | 'file-video' | 'select';
  required: boolean;
  handleId: string;
  value?: any;
  connected?: boolean;
}

export interface NodeOutputDef {
  key: string;
  label: string;
  type: 'text' | 'image' | 'video' | 'json';
  handleId: string;
  value?: any;
}

export interface WorkflowNodeData {
  [key: string]: unknown;
  type: NodeType;
  label: string;
  inputs: NodeInputDef[];
  outputs: NodeOutputDef[];
  status: NodeStatus;
  error: string | null;
  config: Record<string, any>;
}

export interface NodeRegistryEntry {
  type: NodeType;
  label: string;
  description: string;
  icon: string;
  color: string;
  inputs: Omit<NodeInputDef, 'value' | 'connected'>[];
  outputs: Omit<NodeOutputDef, 'value'>[];
  defaultConfig: Record<string, any>;
}
