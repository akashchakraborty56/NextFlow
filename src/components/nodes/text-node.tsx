'use client';
import { memo, useCallback } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Type } from 'lucide-react';
import { BaseNode } from './base-node';
import { useStore } from '@/store';
import type { WorkflowNodeData } from '@/types/nodes';

export const TextNode = memo(function TextNode({ id, data, selected }: NodeProps) {
  const d = data as WorkflowNodeData;
  const updateNodeData = useStore((s) => s.updateNodeData);

  const onChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNodeData(id, { config: { ...d.config, text: e.target.value } });
  }, [id, d.config, updateNodeData]);

  return (
    <BaseNode id={id} label={d.label} icon={<Type size={14} />} color="amber"
      status={d.status} error={d.error} selected={selected ?? false}
      outputHandles={[{ id: 'text-out', label: 'Text' }]}
      outputs={d.outputs?.reduce((a, o) => ({ ...a, [o.key]: o.value }), {})}
    >
      <textarea value={d.config?.text ?? ''} onChange={onChange} placeholder="Enter text..."
        rows={3} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 resize-none focus:outline-none focus:ring-1 focus:ring-amber-500/50 nodrag nowheel" />
    </BaseNode>
  );
});
