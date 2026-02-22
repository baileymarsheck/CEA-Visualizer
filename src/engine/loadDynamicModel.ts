import type { CEAModel, CEANode } from '../types/cea';

interface JSONNode extends Omit<CEANode, 'compute'> {
  compute?: string;
}

interface JSONModel extends Omit<CEAModel, 'nodes' | 'getNarrative'> {
  nodes: JSONNode[];
  getNarrative?: string;
}

export function loadDynamicModel(raw: unknown): CEAModel {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid JSON: expected an object.');
  }
  const json = raw as JSONModel;

  if (!json.id || !json.title || !Array.isArray(json.nodes) || !Array.isArray(json.regions)) {
    throw new Error('Missing required fields: id, title, nodes, regions.');
  }

  const nodes: CEANode[] = json.nodes.map((n) => {
    if (!n.compute) return n as CEANode;
    let computeFn: (values: Record<string, number>) => number;
    try {
      computeFn = new Function('v', `return ${n.compute}`) as typeof computeFn;
    } catch {
      throw new Error(`Invalid compute expression for node "${n.id}": ${n.compute}`);
    }
    return { ...n, compute: computeFn } as CEANode;
  });

  let getNarrative: CEAModel['getNarrative'];
  if (json.getNarrative) {
    try {
      getNarrative = new Function(
        'v',
        'region',
        `return ${json.getNarrative}`,
      ) as typeof getNarrative;
    } catch {
      // Non-fatal: diagram renders fine without a narrative
    }
  }

  return { ...json, nodes, getNarrative };
}
