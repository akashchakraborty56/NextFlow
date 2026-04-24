'use client';
import { memo } from 'react';
import { BaseEdge, getSmoothStepPath, type EdgeProps } from '@xyflow/react';

export const CustomEdge = memo(function CustomEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, style, markerEnd,
}: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
    borderRadius: 12,
  });

  return (
    <>
      <BaseEdge id={`${id}-glow`} path={edgePath}
        style={{ stroke: 'rgba(139,92,246,0.15)', strokeWidth: 8, filter: 'blur(4px)' }} />
      <BaseEdge id={id} path={edgePath}
        style={{ stroke: 'rgba(139,92,246,0.6)', strokeWidth: 2, ...style }} markerEnd={markerEnd} />
      <circle r={3} fill="#8b5cf6">
        <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
      </circle>
    </>
  );
});
