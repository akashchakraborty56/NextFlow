'use client';
import { useEffect } from 'react';
import { useStore } from '@/store';

export function useExecution() {
  const stopPolling = useStore((s) => s.stopPolling);
  useEffect(() => () => { stopPolling(); }, [stopPolling]);
}
