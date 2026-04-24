'use client';
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store';
import { useShallow } from 'zustand/react/shallow';
import {
  Play, Save, Loader2, Download, Upload, Zap, PlayCircle,
  ArrowLeft, PanelLeft, PanelRight, Undo2, Redo2, Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function WorkflowToolbar() {
  const router = useRouter();
  const { workflowName, isDirty, isSaving } = useStore(
    useShallow((s) => ({ workflowName: s.workflowName, isDirty: s.isDirty, isSaving: s.isSaving }))
  );
  const setWorkflowName = useStore((s) => s.setWorkflowName);
  const saveWorkflow = useStore((s) => s.saveWorkflow);
  const executeNode = useStore((s) => s.executeNode);
  const executeWorkflow = useStore((s) => s.executeWorkflow);
  const selectedNodeId = useStore((s) => s.selectedNodeId);
  const isExecuting = useStore((s) => s.isExecuting);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const leftSidebarOpen = useStore((s) => s.leftSidebarOpen);
  const rightSidebarOpen = useStore((s) => s.rightSidebarOpen);
  const toggleLeftSidebar = useStore((s) => s.toggleLeftSidebar);
  const toggleRightSidebar = useStore((s) => s.toggleRightSidebar);
  const removeNode = useStore((s) => s.removeNode);

  const handleRun = useCallback(async () => {
    if (isExecuting) return;
    await saveWorkflow();
    await executeWorkflow('full');
  }, [isExecuting, saveWorkflow, executeWorkflow]);

  const handleRunPartial = useCallback(async () => {
    if (!selectedNodeId || isExecuting) return;
    await saveWorkflow();
    await executeWorkflow('partial', selectedNodeId);
  }, [isExecuting, saveWorkflow, executeWorkflow, selectedNodeId]);

  const handleRunSingle = useCallback(async () => {
    if (!selectedNodeId || isExecuting) return;
    await saveWorkflow();
    await executeNode(selectedNodeId);
  }, [isExecuting, saveWorkflow, executeNode, selectedNodeId]);

  const handleExport = useCallback(() => {
    const { nodes, edges } = useStore.getState();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ nodes, edges }));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `${workflowName || 'workflow'}.json`;
    a.click();
  }, [workflowName]);

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const obj = JSON.parse(event.target?.result as string);
        
        if (!obj.nodes || !Array.isArray(obj.nodes)) {
          alert('Invalid workflow file: missing nodes array');
          return;
        }
        if (!obj.edges || !Array.isArray(obj.edges)) {
          alert('Invalid workflow file: missing edges array');
          return;
        }
        
        for (const node of obj.nodes as any[]) {
          const n = node as any;
          if (!n.id || !n.type || !n.position || !n.data) {
            alert('Invalid workflow file: node missing required fields');
            return;
          }
        }
        
        for (const edge of obj.edges as any[]) {
          const ed = edge as any;
          if (!ed.id || !ed.source || !ed.target) {
            alert('Invalid workflow file: edge missing required fields');
            return;
          }
        }
        
        const nodeIds = new Set<string>(obj.nodes.map((n: any) => n.id as string));
        const adjacency = new Map<string, string[]>();
        for (const id of nodeIds) adjacency.set(id, []);
        for (const edge of obj.edges as any[]) {
          if (nodeIds.has(edge.source as string) && nodeIds.has(edge.target as string)) {
            adjacency.get(edge.source as string)?.push(edge.target as string);
          }
        }
        
        const visited = new Set<string>();
        const recStack = new Set<string>();
        function hasCycleDFS(id: string): boolean {
          visited.add(id);
          recStack.add(id);
          for (const neighbor of adjacency.get(id) ?? []) {
            if (!visited.has(neighbor)) {
              if (hasCycleDFS(neighbor)) return true;
            } else if (recStack.has(neighbor)) {
              return true;
            }
          }
          recStack.delete(id);
          return false;
        }
        
        for (const id of nodeIds) {
          if (!visited.has(id)) {
            if (hasCycleDFS(id)) {
              alert('Invalid workflow file: contains cycles');
              return;
            }
          }
        }
        
        useStore.getState().setNodes(obj.nodes);
        useStore.getState().setEdges(obj.edges);
      } catch (e) {
        alert('Failed to parse workflow file: invalid JSON');
        console.error("Import failed:", e);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  const handleDeleteSelected = useCallback(() => {
    if (selectedNodeId) {
      removeNode(selectedNodeId);
    }
  }, [selectedNodeId, removeNode]);

  return (
    <div className="flex items-center justify-between px-3 py-2 bg-zinc-900/95 border-b border-zinc-800 backdrop-blur-sm">
      {/* Left Section */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700 transition-all"
          title="Back to Dashboard"
        >
          <ArrowLeft size={13} />
        </button>

        <div className="w-px h-5 bg-zinc-700 mx-1" />

        <button
          onClick={toggleLeftSidebar}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium border transition-all',
            leftSidebarOpen
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
          )}
          title="Toggle Nodes Panel"
        >
          <PanelLeft size={13} />
        </button>

        <button
          onClick={toggleRightSidebar}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium border transition-all',
            rightSidebarOpen
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
          )}
          title="Toggle History Panel"
        >
          <PanelRight size={13} />
        </button>

        <div className="w-px h-5 bg-zinc-700 mx-1" />

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">N</span>
          </div>
          <span className="text-sm font-bold text-zinc-200 tracking-tight hidden sm:inline">NextFlow</span>
        </div>

        <div className="w-px h-5 bg-zinc-700 mx-1" />

        <input
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          className="bg-transparent text-sm font-semibold text-zinc-200 border-b border-transparent hover:border-zinc-700 focus:border-violet-500 focus:outline-none px-1 py-0.5 transition-colors w-40 sm:w-56 truncate"
          placeholder="Untitled Workflow"
        />
        {isDirty && <span className="text-[10px] text-zinc-500 animate-pulse">•</span>}
      </div>

      {/* Center Section */}
      <div className="hidden md:flex items-center gap-1.5">
        <button onClick={undo} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700 transition-all" title="Undo (Ctrl+Z)">
          <Undo2 size={12} />
        </button>
        <button onClick={redo} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700 transition-all" title="Redo (Ctrl+Y)">
          <Redo2 size={12} />
        </button>
        {selectedNodeId && (
          <button onClick={handleDeleteSelected} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all animate-fade-in" title="Delete Selected Node">
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700 cursor-pointer transition-all">
          <Upload size={12} />
          <span className="hidden sm:inline">Import</span>
          <input type="file" accept=".json" onChange={handleImport} className="hidden" />
        </label>
        <button onClick={handleExport} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700 transition-all">
          <Download size={12} />
          <span className="hidden sm:inline">Export</span>
        </button>

        <div className="w-px h-5 bg-zinc-800 mx-1" />

        {selectedNodeId && (
          <div className="flex items-center gap-1.5 border-r border-zinc-800 pr-3 mr-1 animate-fade-in">
            <button onClick={handleRunSingle} disabled={isExecuting} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-violet-500/20 text-violet-400 border border-violet-500/30 hover:bg-violet-500/30 transition-all disabled:opacity-40">
              {isExecuting ? <Loader2 size={11} className="animate-spin" /> : <Zap size={11} />}
              <span className="hidden sm:inline">Single</span>
            </button>
            <button onClick={handleRunPartial} disabled={isExecuting} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-all disabled:opacity-40">
              {isExecuting ? <Loader2 size={11} className="animate-spin" /> : <PlayCircle size={11} />}
              <span className="hidden sm:inline">Partial</span>
            </button>
          </div>
        )}

        <button onClick={() => saveWorkflow()} disabled={!isDirty || isSaving} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all', isDirty && !isSaving ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border border-zinc-700' : 'bg-zinc-800/50 text-zinc-600 border border-zinc-800 cursor-not-allowed')}>
          {isSaving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
          <span className="hidden sm:inline">Save</span>
        </button>

        <button onClick={handleRun} disabled={isExecuting} className={cn('flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-lg', isExecuting ? 'bg-red-500/20 text-red-400 border border-red-500/30 shadow-red-500/10' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 shadow-emerald-500/10')}>
          {isExecuting ? (<><Loader2 size={12} className="animate-spin" /> Running...</>) : (<><Play size={12} /> Run</>)}
        </button>
      </div>
    </div>
  );
}
