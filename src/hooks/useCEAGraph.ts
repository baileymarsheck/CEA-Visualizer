import { useState, useMemo, useCallback, useEffect } from 'react';
import { type Node, type Edge } from '@xyflow/react';
import { recalculate } from '../engine/calculate';
import { getLayoutedElements } from '../layout/dagreLayout';
import type { CEAModel } from '../types/cea';

export function useCEAGraph(model: CEAModel) {
  const ceaNodes = model.nodes;

  const [countryId, setCountryId] = useState(model.regions[0].id);
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Reset state when model changes
  useEffect(() => {
    setCountryId(model.regions[0].id);
    setOverrides({});
    setSelectedNodeId(null);
    setHoveredNodeId(null);
  }, [model.id, model.regions]);

  const country = model.regions.find((c) => c.id === countryId) ?? model.regions[0];

  const computedValues = useMemo(
    () => recalculate(ceaNodes, country.values, overrides),
    [ceaNodes, country, overrides],
  );

  const baseComputedValues = useMemo(
    () => recalculate(ceaNodes, country.values, {}),
    [ceaNodes, country],
  );

  const handleInputChange = useCallback((nodeId: string, value: number) => {
    setOverrides((prev) => ({ ...prev, [nodeId]: value }));
  }, []);

  const handleCountryChange = useCallback((id: string) => {
    setCountryId(id);
    setOverrides({});
    setSelectedNodeId(null);
  }, []);

  // The active node: when a node is selected (focus mode), lock to it and ignore hovers
  const activeNodeId = selectedNodeId ?? hoveredNodeId;

  // Build the set of highlighted node IDs (active node + its direct dependencies only)
  const highlightedIds = useMemo(() => {
    if (!activeNodeId) return new Set<string>();

    const ids = new Set<string>();
    ids.add(activeNodeId);

    const nodeMap = new Map(ceaNodes.map((n) => [n.id, n]));
    const activeNode = nodeMap.get(activeNodeId);

    // Add direct inputs (one level up)
    if (activeNode) {
      for (const dep of activeNode.dependencies) {
        ids.add(dep);
      }
    }

    // Add direct outputs (one level down)
    for (const n of ceaNodes) {
      if (n.dependencies.includes(activeNodeId)) {
        ids.add(n.id);
      }
    }

    return ids;
  }, [activeNodeId, ceaNodes]);

  // Get the selected node's direct dependencies (for focus clustering)
  const selectedDeps = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();
    const deps = new Set<string>();
    const node = ceaNodes.find((n) => n.id === selectedNodeId);
    if (node) {
      for (const dep of node.dependencies) {
        deps.add(dep);
      }
    }
    for (const n of ceaNodes) {
      if (n.dependencies.includes(selectedNodeId)) {
        deps.add(n.id);
      }
    }
    return deps;
  }, [selectedNodeId, ceaNodes]);

  // Build a map of operation labels for dependency nodes when a node is selected
  const operationLabels = useMemo(() => {
    if (!selectedNodeId) return new Map<string, string>();
    const labels = new Map<string, string>();
    const selectedCeaNode = ceaNodes.find((n) => n.id === selectedNodeId);
    if (selectedCeaNode?.dependencyOps) {
      for (const [depId, op] of Object.entries(selectedCeaNode.dependencyOps)) {
        labels.set(depId, op);
      }
    }
    return labels;
  }, [selectedNodeId, ceaNodes]);

  const { nodes, edges } = useMemo(() => {
    const rfNodes: Node[] = ceaNodes.map((node) => ({
      id: node.id,
      type: node.nodeKind,
      position: { x: 0, y: 0 },
      data: {
        label: node.label,
        value: computedValues[node.id] ?? 0,
        format: node.format,
        formula: node.formula,
        editable: node.editable,
        highlighted: highlightedIds.has(node.id),
        dimmed: !!selectedNodeId && !selectedDeps.has(node.id) && node.id !== selectedNodeId,
        operation: operationLabels.get(node.id) ?? null,
        onChange: node.editable
          ? (val: number) => handleInputChange(node.id, val)
          : undefined,
        onClick: () => setSelectedNodeId(node.id === selectedNodeId ? null : node.id),
      },
    }));

    const rfEdges: Edge[] = ceaNodes.flatMap((node) =>
      node.dependencies.map((depId) => {
        const inPath = !selectedNodeId && highlightedIds.has(depId) && highlightedIds.has(node.id);
        const shouldDimEdges = !!selectedNodeId;
        return {
          id: `${depId}->${node.id}`,
          source: depId,
          target: node.id,
          type: 'smoothstep',
          animated: inPath,
          markerEnd: inPath ? { type: 'arrowclosed' as const, color: '#3b82f6' } : undefined,
          style: {
            stroke: inPath ? '#3b82f6' : shouldDimEdges ? '#e5e7eb' : '#d1d5db',
            strokeWidth: inPath ? 2.5 : 1,
          },
        };
      }),
    );

    // In focus mode, add colored arc overlay edges for the selected node's connections
    if (selectedNodeId) {
      const nodeKindColor: Record<string, string> = {
        input: '#10b981',
        derived: '#3b82f6',
        adjustment: '#f59e0b',
        output: '#d97706',
      };
      const nodeMap = new Map(ceaNodes.map((n) => [n.id, n]));
      const selNode = nodeMap.get(selectedNodeId);

      if (selNode) {
        // Arcs from upstream deps → selected node
        const upstreamCount = selNode.dependencies.length;
        selNode.dependencies.forEach((depId, i) => {
          const sourceNode = nodeMap.get(depId);
          if (!sourceNode) return;
          rfEdges.push({
            id: `arc-${depId}->${selectedNodeId}`,
            source: depId,
            target: selectedNodeId,
            sourceHandle: 'right',
            targetHandle: 'left',
            type: 'arcEdge',
            data: {
              color: nodeKindColor[sourceNode.nodeKind] ?? '#3b82f6',
              arcOffset: 80 + i * 30,
              direction: 'upstream',
              index: i,
              total: upstreamCount,
            },
          } as Edge);
        });

        // Arcs from selected node → downstream dependents
        const downstreamNodes = ceaNodes.filter((n) => n.dependencies.includes(selectedNodeId));
        const downstreamCount = downstreamNodes.length;
        downstreamNodes.forEach((dn, i) => {
          rfEdges.push({
            id: `arc-${selectedNodeId}->${dn.id}`,
            source: selectedNodeId,
            target: dn.id,
            sourceHandle: 'right',
            targetHandle: 'left',
            type: 'arcEdge',
            data: {
              color: nodeKindColor[selNode.nodeKind] ?? '#3b82f6',
              arcOffset: 80 + i * 30,
              direction: 'downstream',
              index: i,
              total: downstreamCount,
            },
          } as Edge);
        });
      }
    }

    const narrativeText = model.getNarrative?.(computedValues, country.name);
    const layouted = getLayoutedElements(rfNodes, rfEdges, model.layoutSections, model.title, narrativeText);

    // If a node is selected, pull its dependencies into a cluster around it
    if (selectedNodeId && selectedDeps.size > 0) {
      const selectedRfNode = layouted.nodes.find((n) => n.id === selectedNodeId);
      if (selectedRfNode) {
        const cx = selectedRfNode.position.x;
        const cy = selectedRfNode.position.y;

        // Separate inputs (upstream) and outputs (downstream)
        const ceaNode = ceaNodes.find((n) => n.id === selectedNodeId);
        const inputDeps = ceaNode ? ceaNode.dependencies : [];
        const outputDeps = ceaNodes
          .filter((n) => n.dependencies.includes(selectedNodeId))
          .map((n) => n.id);

        // Arrange inputs above the selected node
        const inputSpacing = 220;
        const inputTotalW = inputDeps.length * inputSpacing;
        const inputStartX = cx - inputTotalW / 2 + inputSpacing / 2;

        inputDeps.forEach((depId, i) => {
          const node = layouted.nodes.find((n) => n.id === depId);
          if (node) {
            node.position = {
              x: inputStartX + i * inputSpacing,
              y: cy - 120,
            };
          }
        });

        // Arrange outputs below the selected node
        const outputSpacing = 260;
        const outputTotalW = outputDeps.length * outputSpacing;
        const outputStartX = cx - outputTotalW / 2 + outputSpacing / 2;

        outputDeps.forEach((depId, i) => {
          const node = layouted.nodes.find((n) => n.id === depId);
          if (node) {
            node.position = {
              x: outputStartX + i * outputSpacing,
              y: cy + 120,
            };
          }
        });
      }
    }

    // Add transition style to all non-section nodes for smooth animation
    layouted.nodes = layouted.nodes.map((node) => {
      if (node.type === 'sectionLabel') return node;
      return {
        ...node,
        style: {
          ...((node.style as Record<string, unknown>) ?? {}),
          transition: 'transform 0.4s ease',
        },
      };
    });

    return layouted;
  }, [computedValues, country, highlightedIds, selectedNodeId, selectedDeps, operationLabels, handleInputChange, ceaNodes, model.layoutSections, model]);

  const selectedNode = selectedNodeId
    ? ceaNodes.find((n) => n.id === selectedNodeId) ?? null
    : null;

  const activeNode = activeNodeId
    ? ceaNodes.find((n) => n.id === activeNodeId) ?? null
    : null;

  return {
    model,
    nodes,
    edges,
    computedValues,
    baseComputedValues,
    countryId,
    country,
    selectedNode,
    activeNode,
    selectedNodeId,
    activeNodeId,
    highlightedIds,
    setSelectedNodeId,
    setHoveredNodeId,
    handleCountryChange,
    handleInputChange,
    overrides,
    setOverrides,
  };
}
