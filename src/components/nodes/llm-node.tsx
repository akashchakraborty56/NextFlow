'use client';
import { memo, useCallback } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Brain } from 'lucide-react';
import { BaseNode } from './base-node';
import { useStore } from '@/store';
import type { WorkflowNodeData } from '@/types/nodes';

export const LLMNode = memo(function LLMNode({ id, data, selected }: NodeProps) {
  const d = data as WorkflowNodeData;
  const updateNodeData = useStore((s) => s.updateNodeData);
  const edges = useStore((s) => s.edges);
  const connected = new Set(edges.filter((e) => e.target === id).map((e) => e.targetHandle));

  const onInput = useCallback((key: string, value: string) => {
    const updatedInputs = d.inputs.map((inp) => inp.key === key ? { ...inp, value } : inp);
    updateNodeData(id, { inputs: updatedInputs });
  }, [id, d.inputs, updateNodeData]);

  const onConfig = useCallback((key: string, value: any) => {
    updateNodeData(id, { config: { ...d.config, [key]: value } });
  }, [id, d.config, updateNodeData]);

  return (
    <BaseNode id={id} label={d.label} icon={<Brain size={14} />} color="red"
      status={d.status} error={d.error} selected={selected ?? false}
      inputHandles={[
        { id: 'user-message-in', label: 'User Message' },
        { id: 'system-prompt-in', label: 'System Prompt' },
        { id: 'image-in', label: 'Images' },
      ]}
      outputHandles={[{ id: 'text-out', label: 'Output' }]}
      outputs={d.outputs?.reduce((a, o) => ({ ...a, [o.key]: o.value }), {})}
    >
      <div>
        <label className="text-[10px] text-zinc-500 font-medium">User Message</label>
        <textarea value={d.inputs.find((i) => i.key === 'user_message')?.value ?? ''} onChange={(e) => onInput('user_message', e.target.value)}
          disabled={connected.has('user-message-in')} placeholder={connected.has('user-message-in') ? '← Connected' : 'Enter user message...'} rows={2}
          className="w-full mt-0.5 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-[11px] text-zinc-200 placeholder:text-zinc-600 resize-none focus:outline-none focus:ring-1 focus:ring-red-500/50 disabled:opacity-40 disabled:cursor-not-allowed nodrag nowheel" />
      </div>
      <div>
        <label className="text-[10px] text-zinc-500 font-medium">System Prompt</label>
        <textarea value={d.inputs.find((i) => i.key === 'system_prompt')?.value ?? ''} onChange={(e) => onInput('system_prompt', e.target.value)}
          disabled={connected.has('system-prompt-in')} placeholder={connected.has('system-prompt-in') ? '← Connected' : 'Optional system prompt...'} rows={1}
          className="w-full mt-0.5 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-[11px] text-zinc-200 placeholder:text-zinc-600 resize-none focus:outline-none focus:ring-1 focus:ring-red-500/50 disabled:opacity-40 disabled:cursor-not-allowed nodrag nowheel" />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[10px] text-zinc-500 font-medium">Model</label>
          <select value={d.config?.model ?? 'gemini-2.0-flash'} onChange={(e) => onConfig('model', e.target.value)}
            className="w-full mt-0.5 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-[11px] text-zinc-200 focus:outline-none nodrag">
            <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
            <option value="gemini-2.0-flash-001">Gemini 2.0 Flash (v001)</option>
            <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
            <option value="gemini-flash-latest">Gemini Flash Latest</option>
          </select>
        </div>
        <div className="w-16">
          <label className="text-[10px] text-zinc-500 font-medium">Temp</label>
          <input type="number" value={d.config?.temperature ?? 0.7} onChange={(e) => onConfig('temperature', parseFloat(e.target.value))}
            min={0} max={2} step={0.1} className="w-full mt-0.5 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-[11px] text-zinc-200 focus:outline-none nodrag" />
        </div>
      </div>
    </BaseNode>
  );
});
