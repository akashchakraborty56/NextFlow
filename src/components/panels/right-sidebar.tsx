'use client';
import { useStore } from '@/store';
import { cn } from '@/lib/utils';
import { Clock, CheckCircle, XCircle, Loader2, SkipForward, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDuration } from '@/lib/utils';
import { useState, useEffect } from 'react';

const statusConfig: Record<string, { icon: any; color: string }> = {
  pending: { icon: Clock, color: 'text-zinc-400' },
  running: { icon: Loader2, color: 'text-blue-400' },
  success: { icon: CheckCircle, color: 'text-emerald-400' },
  failed: { icon: XCircle, color: 'text-red-400' },
  cancelled: { icon: SkipForward, color: 'text-zinc-400' },
};

export function RightSidebar() {
  const isOpen = useStore((s) => s.rightSidebarOpen);
  const history = useStore((s) => s.history);
  const nodes = useStore((s) => s.nodes);
  const workflowId = useStore((s) => s.workflowId);
  const loadHistory = useStore((s) => s.loadHistory);
  const [expandedRuns, setExpandedRuns] = useState(new Set());

  useEffect(() => {
    if (isOpen && workflowId) {
      loadHistory(workflowId);
    }
  }, [isOpen, workflowId, loadHistory]);

  const toggleRun = (runId: string) => {
    setExpandedRuns(prev => {
      const next = new Set(prev);
      if (next.has(runId)) next.delete(runId);
      else next.add(runId);
      return next;
    });
  };

  return (
    <div className={cn('relative flex flex-col bg-zinc-900/95 border-l border-zinc-800 transition-all duration-300', isOpen ? 'w-72' : 'w-0 overflow-hidden')}>
      <div className="p-3 border-b border-zinc-800">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Run History</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {history.length === 0 && <p className="text-[11px] text-zinc-600 text-center py-8">No runs yet</p>}
        {history.map((run) => {
          const cfg = statusConfig[run.status] ?? statusConfig.pending;
          const StatusIcon = cfg.icon;
          const isExpanded = expandedRuns.has(run.id);

          return (
            <div key={run.id} className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-2.5 space-y-2">
              <div 
                className="flex items-center justify-between cursor-pointer hover:bg-zinc-700/30 p-1 -m-1 rounded transition-colors"
                onClick={() => toggleRun(run.id)}
              >
                <div className="flex items-center gap-1.5">
                  <StatusIcon size={14} className={cn(cfg.color, run.status === 'running' && 'animate-spin')} />
                  <span className={cn('text-xs font-medium', cfg.color)}>{run.status.toUpperCase()}</span>
                  <span className="text-[10px] text-zinc-500 ml-1">{formatDuration(run.duration)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                    {run.mode?.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-zinc-500">{new Date(run.startedAt).toLocaleTimeString()}</span>
                  {isExpanded ? <ChevronUp size={12} className="text-zinc-500" /> : <ChevronDown size={12} className="text-zinc-500" />}
                </div>
              </div>
              
              {isExpanded && run.nodeResults && run.nodeResults.size > 0 && (
                <div className="pt-2 border-t border-zinc-700/50 space-y-1.5">
                  {Array.from(run.nodeResults.values()).map(nr => {
                    const nodeLabel = nodes.find(n => n.id === nr.nodeId)?.data?.label ?? 'Node';
                    const ncfg = statusConfig[nr.status] ?? statusConfig.pending;
                    const NStatusIcon = ncfg.icon;
                    return (
                      <div key={nr.nodeId} className="bg-zinc-900/50 border border-zinc-800 rounded p-1.5 text-[10px]">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-1.5">
                            <NStatusIcon size={10} className={cn(ncfg.color, nr.status === 'running' && 'animate-spin')} />
                            <span className="font-medium text-zinc-300">{nodeLabel}</span>
                          </div>
                          <span className="text-zinc-500">{formatDuration(nr.durationMs)}</span>
                        </div>
                        {nr.error && <div className="text-red-400 mt-1 line-clamp-2">{nr.error}</div>}
                        {nr.resolvedInputs && Object.keys(nr.resolvedInputs).length > 0 && (
                          <div className="mt-1 space-y-0.5 border-t border-zinc-800 pt-1">
                            <span className="text-[8px] text-zinc-500 uppercase font-semibold">Inputs</span>
                            {Object.entries(nr.resolvedInputs).map(([k, v]) => (
                              <div key={k} className="flex justify-between">
                                <span className="text-zinc-500">{k}:</span>
                                <span className="text-zinc-300 truncate max-w-[120px]">{typeof v === 'string' && v.length > 50 ? v.slice(0, 50) + '...' : String(v)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {nr.outputs && Object.keys(nr.outputs).length > 0 && (
                          <div className="mt-1 space-y-0.5 border-t border-zinc-800 pt-1">
                            <span className="text-[8px] text-zinc-500 uppercase font-semibold">Outputs</span>
                            {Object.entries(nr.outputs).map(([k, v]) => (
                              <div key={k} className="flex justify-between">
                                <span className="text-zinc-500">{k}:</span>
                                <span className="text-zinc-300 truncate max-w-[120px]">{typeof v === 'string' && v.length > 50 ? v.slice(0, 50) + '...' : String(v)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
