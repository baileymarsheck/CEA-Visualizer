import type { CEANode } from '../types/cea';

/**
 * Topologically sort nodes so dependencies are computed first.
 */
function topologicalSort(nodes: CEANode[]): CEANode[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const visited = new Set<string>();
  const sorted: CEANode[] = [];

  function visit(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    const node = nodeMap.get(id);
    if (!node) return;
    for (const dep of node.dependencies) {
      visit(dep);
    }
    sorted.push(node);
  }

  for (const node of nodes) {
    visit(node.id);
  }

  return sorted;
}

/**
 * Recalculate all derived values given base country values and user overrides.
 */
export function recalculate(
  graphDef: CEANode[],
  baseValues: Record<string, number>,
  overrides: Record<string, number>,
): Record<string, number> {
  const values: Record<string, number> = { ...baseValues, ...overrides };
  const sorted = topologicalSort(graphDef);

  for (const node of sorted) {
    if (node.compute) {
      // If the node is editable and has been overridden, keep the override
      if (node.editable && node.id in overrides) continue;
      values[node.id] = node.compute(values);
    }
  }

  return values;
}
