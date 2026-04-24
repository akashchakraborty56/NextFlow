'use client';
import { useEffect, useRef } from 'react';
import { useStore } from '@/store';

const AUTO_SAVE_DELAY_MS = 2000;

export function useAutoSave() {
  const isDirty = useStore((s) => s.isDirty);
  const isSaving = useStore((s) => s.isSaving);
  const isExecuting = useStore((s) => s.isExecuting);
  const saveWorkflow = useStore((s) => s.saveWorkflow);
  const workflowId = useStore((s) => s.workflowId);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isDirty || isSaving || isExecuting || !workflowId) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => saveWorkflow(), AUTO_SAVE_DELAY_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isDirty, isSaving, isExecuting, workflowId, saveWorkflow]);
}
