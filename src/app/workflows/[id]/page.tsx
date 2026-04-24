'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useStore } from '@/store';
import { WorkflowCanvas } from '@/components/canvas/workflow-canvas';
import { LeftSidebar } from '@/components/panels/left-sidebar';
import { RightSidebar } from '@/components/panels/right-sidebar';
import { WorkflowToolbar } from '@/components/toolbar/workflow-toolbar';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { useAutoSave } from '@/hooks/use-auto-save';
import { useExecution } from '@/hooks/use-execution';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

export default function WorkflowEditorPage() {
  const { id } = useParams<{ id: string }>();
  const loadWorkflow = useStore((s) => s.loadWorkflow);

  useAutoSave();
  useExecution();
  useKeyboardShortcuts();

  useEffect(() => {
    if (id) loadWorkflow(id);
  }, [id, loadWorkflow]);

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      <ErrorBoundary>
        <WorkflowToolbar />
      </ErrorBoundary>
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden lg:block">
          <ErrorBoundary>
            <LeftSidebar />
          </ErrorBoundary>
        </div>
        <div className="flex-1 relative min-w-0">
          <ErrorBoundary>
            <WorkflowCanvas />
          </ErrorBoundary>
        </div>
        <div className="hidden xl:block">
          <ErrorBoundary>
            <RightSidebar />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
