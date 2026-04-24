'use client';

import { memo, type ReactNode } from 'react';
import { Handle, Position } from '@xyflow/react';
import { cn } from '@/lib/utils';
import type { NodeStatus } from '@/types/nodes';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface BaseNodeProps {
  id: string;
  label: string;
  icon: ReactNode;
  color: string;
  status: NodeStatus;
  error: string | null;
  selected: boolean;
  inputHandles?: Array<{ id: string; label: string }>;
  outputHandles?: Array<{ id: string; label: string }>;
  outputs?: Record<string, any> | null;
  children: ReactNode;
}

const statusBorder: Record<NodeStatus, string> = {
  idle: 'border-zinc-700',
  pending: 'border-yellow-500/50',
  running: 'border-blue-500 animate-glow-pulse',
  success: 'border-emerald-500',
  error: 'border-red-500',
  skipped: 'border-zinc-600',
};

const colorHeader: Record<string, string> = {
  amber: 'bg-amber-500/10 text-amber-400',
  blue: 'bg-blue-500/10 text-blue-400',
  purple: 'bg-purple-500/10 text-purple-400',
  red: 'bg-red-500/10 text-red-400',
  emerald: 'bg-emerald-500/10 text-emerald-400',
};

const colorHandle: Record<string, string> = {
  amber: '!bg-amber-500', blue: '!bg-blue-500', purple: '!bg-purple-500',
  red: '!bg-red-500', emerald: '!bg-emerald-500',
};

export const BaseNode = memo(function BaseNode({
  id, label, icon, color, status, error, selected,
  inputHandles = [], outputHandles = [], outputs, children,
}: BaseNodeProps) {
  return (
    <div
      className={cn(
        'relative min-w-[240px] max-w-[320px] rounded-xl border-2 bg-zinc-900/95 backdrop-blur-sm',
        'transition-all duration-300',
        statusBorder[status],
        selected && 'ring-2 ring-white/20',
        status === 'running' && 'animate-pulse-ring',
      )}
    >
      {/* Status overlay */}
      {status === 'running' && (
        <div className="absolute -top-1 -right-1 z-10 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 items-center justify-center">
            <Loader2 size={10} className="animate-spin text-white" />
          </span>
        </div>
      )}
      {status === 'success' && (
        <div className="absolute -top-1 -right-1 z-10 animate-success-pop">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30">
            <CheckCircle size={12} className="text-white" />
          </div>
        </div>
      )}
      {status === 'error' && (
        <div className="absolute -top-1 -right-1 z-10">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 shadow-lg shadow-red-500/30">
            <XCircle size={12} className="text-white" />
          </div>
        </div>
      )}

      {/* Header */}
      <div className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-t-[10px] border-b border-zinc-800',
        colorHeader[color],
      )}>
        <span className="text-sm">{icon}</span>
        <span className="text-xs font-semibold tracking-wide uppercase truncate">{label}</span>
      </div>

      {/* Input Handles */}
      {inputHandles.map((handle, i) => (
        <Handle
          key={handle.id}
          id={handle.id}
          type="target"
          position={Position.Left}
          className={cn('w-3 h-3 !border-2 !border-zinc-900 rounded-full', colorHandle[color])}
          style={{ top: `${((i + 1) / (inputHandles.length + 1)) * 100}%` }}
        />
      ))}

      {/* Body */}
      <div className="p-3 space-y-2">{children}</div>

      {/* Error */}
      {error && (
        <div className="px-3 pb-2">
          <div className="text-[10px] text-red-400 bg-red-500/10 rounded px-2 py-1 truncate">{error}</div>
        </div>
      )}

      {/* Inline outputs */}
      {outputs && Object.keys(outputs).length > 0 && (
        <div className="border-t border-zinc-800 px-3 py-2 space-y-1">
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Output</span>
          {Object.entries(outputs).map(([key, value]) => {
            if (!value) return null;
            if (typeof value === 'string' && (key.includes('image') || key.includes('Image'))) {
              return <img key={key} src={value} alt={key} className="w-full h-24 object-cover rounded-md border border-zinc-700 mt-1" />;
            }
            if (typeof value === 'string') {
              return <p key={key} className="text-[11px] text-zinc-300 line-clamp-3 bg-zinc-800/50 rounded px-2 py-1 mt-1">{value}</p>;
            }
            return <div key={key} className="flex justify-between text-[11px]"><span className="text-zinc-500">{key}</span><span className="text-zinc-300">{String(value)}</span></div>;
          })}
        </div>
      )}

      {/* Output Handles */}
      {outputHandles.map((handle, i) => (
        <Handle
          key={handle.id}
          id={handle.id}
          type="source"
          position={Position.Right}
          className={cn('w-3 h-3 !border-2 !border-zinc-900 rounded-full', colorHandle[color])}
          style={{ top: `${((i + 1) / (outputHandles.length + 1)) * 100}%` }}
        />
      ))}
    </div>
  );
});
