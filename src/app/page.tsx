'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { Plus, Workflow, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkflowItem {
  id: string;
  name: string;
  description: string | null;
  updatedAt: string;
  _count: { nodes: number; executionRuns: number };
}

export default function DashboardPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [templates, setTemplates] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.listWorkflows(),
      api.listTemplates(),
    ]).then(([wfData, tplData]) => {
      setWorkflows(wfData);
      setTemplates(tplData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleCreate = useCallback(async () => {
    try {
      const workflow = await api.createWorkflow({ name: 'Untitled Workflow' });
      router.push(`/workflows/${workflow.id}`);
    } catch (err) {
      console.error('Failed to create workflow:', err);
    }
  }, [router]);

  const handleCreateFromTemplate = useCallback(async (templateId: string) => {
    try {
      const workflow = await api.createWorkflow({ name: 'Product Marketing Kit', templateId });
      router.push(`/workflows/${workflow.id}`);
    } catch (err) {
      console.error('Failed to create from template:', err);
    }
  }, [router]);

  const handleDelete = useCallback(async (id: string) => {
    await api.deleteWorkflow(id);
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <span className="text-white font-bold">N</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-zinc-100 tracking-tight">NextFlow</h1>
              <p className="text-[11px] text-zinc-500">AI Workflow Builder</p>
            </div>
          </div>
          <button onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-violet-600/20">
            <Plus size={16} /> New Workflow
          </button>
        </div>
      </header>

      {/* Body */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-10">
        {/* Templates Section */}
        {!loading && templates.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Templates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((tpl) => (
                <div key={tpl.id}
                  className="group bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 cursor-pointer hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all animate-fade-in">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">{tpl.name}</h3>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">Template</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mb-4">{tpl.description ?? 'No description'}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">{tpl._count.nodes} nodes</span>
                    <button onClick={() => handleCreateFromTemplate(tpl.id)}
                      className="ml-auto text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
                      Use Template →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Workflows Section */}
        <section>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Your Workflows</h2>

          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-zinc-500" size={32} />
            </div>
          )}

          {!loading && workflows.length === 0 && (
            <div className="text-center py-20 animate-fade-in">
              <Workflow size={48} className="mx-auto text-zinc-700 mb-4" />
              <p className="text-zinc-500">No workflows yet. Create your first one!</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflows.map((wf) => (
              <div key={wf.id}
                onClick={() => router.push(`/workflows/${wf.id}`)}
                className="group bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 cursor-pointer hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/5 transition-all animate-fade-in">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">{wf.name}</h3>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(wf.id); }}
                    className="p-1 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
                <p className="text-[11px] text-zinc-500 mb-4">{wf.description ?? 'No description'}</p>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">{wf._count.nodes} nodes</span>
                  <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">{wf._count.executionRuns} runs</span>
                  <span className="text-[10px] text-zinc-600 ml-auto">{new Date(wf.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
