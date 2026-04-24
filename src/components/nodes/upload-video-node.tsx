'use client';
import { memo, useCallback, useState } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Video, Upload, X } from 'lucide-react';
import { BaseNode } from './base-node';
import { useStore } from '@/store';
import { api } from '@/lib/api-client';
import type { WorkflowNodeData } from '@/types/nodes';

export const UploadVideoNode = memo(function UploadVideoNode({ id, data, selected }: NodeProps) {
  const d = data as WorkflowNodeData;
  const updateNodeData = useStore((s) => s.updateNodeData);
  const [uploading, setUploading] = useState(false);
  const fileUrl = d.config?.fileUrl;

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    try {
      const { params, signature } = await api.getTransloaditParams('video');
      const formData = new FormData();
      formData.append('params', params);
      formData.append('signature', signature);
      formData.append('file', file);

      const res = await fetch('https://api2.transloadit.com/assemblies', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);

      // Transloadit polling logic
      let assembly = data;
      while (assembly.ok && assembly.ok !== 'ASSEMBLY_COMPLETED' && assembly.ok !== 'ASSEMBLY_CANCELED') {
        await new Promise(r => setTimeout(r, 1500));
        const stRes = await fetch(assembly.assembly_ssl_url);
        assembly = await stRes.json();
      }

      if (assembly.error) throw new Error(assembly.error);

      // Extract result URL: try results first, fallback to original uploads
      let fileUrl = '';
      const resultKeys = Object.keys(assembly.results);
      
      if (resultKeys.length > 0) {
        fileUrl = assembly.results[resultKeys[0]][0].ssl_url;
      } else if (assembly.uploads && assembly.uploads.length > 0) {
        fileUrl = assembly.uploads[0].ssl_url;
      } else {
        throw new Error("No results or uploads found from Transloadit");
      }

      updateNodeData(id, { config: { ...d.config, fileUrl, fileName: file.name, mimeType: file.type } });
    } catch(err) {
      console.error('Transloadit video upload failed:', err);
    } finally {
      setUploading(false);
    }
  }, [id, d.config, updateNodeData]);

  const handleClear = useCallback(() => {
    updateNodeData(id, { config: { ...d.config, fileUrl: undefined, fileName: undefined } });
  }, [id, d.config, updateNodeData]);

  return (
    <BaseNode id={id} label={d.label} icon={<Video size={14} />} color="purple"
      status={d.status} error={d.error} selected={selected ?? false}
      outputHandles={[{ id: 'video-out', label: 'Video' }]}
      outputs={d.outputs?.reduce((a, o) => ({ ...a, [o.key]: o.value }), {})}
    >
      {fileUrl ? (
        <div className="relative group">
          <video src={fileUrl} className="w-full h-28 object-cover rounded-lg border border-zinc-700" controls={false} muted />
          <button onClick={handleClear} className="absolute top-1 right-1 p-1 bg-zinc-900/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            <X size={12} className="text-zinc-400" />
          </button>
          <p className="text-[10px] text-zinc-500 mt-1 truncate">{d.config?.fileName}</p>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer hover:border-purple-500/50 transition-colors nodrag">
          <Upload size={18} className="text-zinc-500 mb-1" />
          <span className="text-[10px] text-zinc-500">{uploading ? 'Uploading...' : 'Click to upload video'}</span>
          <input type="file" accept="video/*" onChange={handleUpload} className="hidden" disabled={uploading} />
        </label>
      )}
    </BaseNode>
  );
});
