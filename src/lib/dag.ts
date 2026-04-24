import { type Edge, type Node } from '@xyflow/react';

/**
 * Check if adding a connection would create a cycle.
 * Uses DFS from the target node to see if the source is reachable.
 */
export function wouldCreateCycle(
  source: string,
  target: string,
  nodes: Node[],
  edges: Edge[]
): boolean {
  if (source === target) return true;

  const visited = new Set<string>();
  const stack = [target];

  const allEdges = [...edges, { source, target, id: 'temp' }];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === source) return true;
    if (visited.has(current)) continue;
    visited.add(current);

    const outgoingTargets = allEdges
      .filter((e) => e.source === current)
      .map((e) => e.target);

    stack.push(...outgoingTargets);
  }

  return false;
}
