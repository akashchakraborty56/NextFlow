'use client';
import { useEffect } from 'react';
import { useStore } from '@/store';

export function useKeyboardShortcuts() {
  const saveWorkflow = useStore((s) => s.saveWorkflow);
  const executeWorkflow = useStore((s) => s.executeWorkflow);
  const selectedNodeId = useStore((s) => s.selectedNodeId);
  const removeNode = useStore((s) => s.removeNode);
  const selectNode = useStore((s) => s.selectNode);
  const isDirty = useStore((s) => s.isDirty);
  const isExecuting = useStore((s) => s.isExecuting);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName);

      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); if (isDirty) saveWorkflow(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); if (!isExecuting) saveWorkflow().then(() => executeWorkflow('full')); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); if (!isInput) undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'Z' && e.shiftKey) || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); if (!isInput) redo(); }
      if (e.key === 'Escape') selectNode(null);
      if (!isInput && (e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId) { removeNode(selectedNodeId); selectNode(null); }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [saveWorkflow, executeWorkflow, selectedNodeId, removeNode, selectNode, isDirty, isExecuting, undo, redo]);
}
