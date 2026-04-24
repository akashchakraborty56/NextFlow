'use client';
import { memo, useCallback } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Crop } from 'lucide-react';
import { BaseNode } from './base-node';
import { useStore } from '@/store';
import type { WorkflowNodeData } from '@/types/nodes';

export const CropImageNode = memo(function CropImageNode({ id, data, selected }: NodeProps) {
  const d = data as WorkflowNodeData;
  const updateNodeData = useStore((s) => s.updateNodeData);
  const edges = useStore((s) => s.edges);
  const isConnected = edges.some((e) => e.target === id && e.targetHandle === 'image-in');

  const onConfig = useCallback((key: string, value: number) => {
    updateNodeData(id, { config: { ...d.config, [key]: value } });
  }, [id, d.config, updateNodeData]);

  return (
    <BaseNode id={id} label={d.label} icon={<Crop size={14} />} color="emerald"
      status={d.status} error={d.error} selected={selected ?? false}
      inputHandles={[{ id: 'image-in', label: 'Image' }]}
      outputHandles={[{ id: 'image-out', label: 'Cropped' }]}
      outputs={d.outputs?.reduce((a, o) => ({ ...a, [o.key]: o.value }), {})}
    >
      {!isConnected && <p className="text-[10px] text-zinc-500 italic">Connect an image input ←</p>}
      <div className="grid grid-cols-2 gap-1.5">
        {([
          { key: 'xPercent', label: 'X %' },
          { key: 'yPercent', label: 'Y %' },
          { key: 'widthPercent', label: 'W %' },
          { key: 'heightPercent', label: 'H %' },
        ] as const).map(({ key, label }) => (
          <div key={key}>
            <label className="text-[10px] text-zinc-500 font-medium uppercase">{label}</label>
            <input type="number" value={d.config?.[key] ?? 0} onChange={(e) => onConfig(key, Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))} min={0} max={100} step={0.1}
              className="w-full mt-0.5 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-[11px] text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 nodrag" />
          </div>
        ))}
      </div>
    </BaseNode>
  );
});
