'use client';
import { memo, useCallback } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Film } from 'lucide-react';
import { BaseNode } from './base-node';
import { useStore } from '@/store';
import type { WorkflowNodeData } from '@/types/nodes';

export const ExtractFrameNode = memo(function ExtractFrameNode({ id, data, selected }: NodeProps) {
  const d = data as WorkflowNodeData;
  const updateNodeData = useStore((s) => s.updateNodeData);
  const edges = useStore((s) => s.edges);
  const isConnected = edges.some((e) => e.target === id && e.targetHandle === 'video-in');

  const onTimestamp = useCallback((value: number) => {
    updateNodeData(id, { config: { ...d.config, timestamp: value } });
  }, [id, d.config, updateNodeData]);

  const onModeChange = useCallback((mode: string) => {
    updateNodeData(id, { config: { ...d.config, timestampMode: mode } });
  }, [id, d.config, updateNodeData]);

  const mode = d.config?.timestampMode ?? 'seconds';
  const max = mode === 'percentage' ? 100 : 300;
  const step = mode === 'percentage' ? 1 : 0.5;
  const unit = mode === 'percentage' ? '%' : 's';

  return (
    <BaseNode id={id} label={d.label} icon={<Film size={14} />} color="emerald"
      status={d.status} error={d.error} selected={selected ?? false}
      inputHandles={[{ id: 'video-in', label: 'Video' }]}
      outputHandles={[{ id: 'image-out', label: 'Frame' }]}
      outputs={d.outputs?.reduce((a, o) => ({ ...a, [o.key]: o.value }), {})}
    >
      {!isConnected && <p className="text-[10px] text-zinc-500 italic">Connect a video input ←</p>}
      
      <div className="flex gap-1 mb-1">
        <button
          onClick={() => onModeChange('seconds')}
          className={`flex-1 text-[10px] font-medium py-0.5 rounded transition-colors ${mode === 'seconds' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'}`}
        >
          Seconds
        </button>
        <button
          onClick={() => onModeChange('percentage')}
          className={`flex-1 text-[10px] font-medium py-0.5 rounded transition-colors ${mode === 'percentage' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'}`}
        >
          Percentage
        </button>
      </div>

      <div>
        <label className="text-[10px] text-zinc-500 font-medium">Timestamp ({mode})</label>
        <div className="flex items-center gap-2 mt-0.5">
          <input type="range" value={d.config?.timestamp ?? 0} onChange={(e) => onTimestamp(parseFloat(e.target.value))}
            min={0} max={max} step={step} className="flex-1 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 nodrag" />
          <input type="number" value={d.config?.timestamp ?? 0} onChange={(e) => onTimestamp(parseFloat(e.target.value) || 0)}
            min={0} step={step} className="w-14 bg-zinc-800 border border-zinc-700 rounded px-1.5 py-0.5 text-[11px] text-zinc-200 text-center focus:outline-none nodrag" />
          <span className="text-[10px] text-zinc-500">{unit}</span>
        </div>
      </div>
    </BaseNode>
  );
});
