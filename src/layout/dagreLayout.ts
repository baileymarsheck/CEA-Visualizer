import { type Node, type Edge } from '@xyflow/react';
import type { LayoutSection } from '../types/cea';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 76;
const OUTPUT_WIDTH = 240;
const OUTPUT_HEIGHT = 96;

/**
 * Layout with:
 *   - Horizontal axis: spreadsheet sections (left → right), separated by dotted dividers
 *   - Vertical axis: node-type swim lanes (inputs → calculations → adjustments → outputs)
 *   - Within a section's swim lane, multiple nodes sit side by side
 */

// Type-row indices (swim lanes, top → bottom)
const TYPE_ROWS = ['input', 'derived', 'adjustment', 'output'] as const;
const typeRowIndex: Record<string, number> = {
  input: 0,
  derived: 1,
  adjustment: 2,
  output: 3,
};

// Layout constants
const SECTION_GAP = 50;        // horizontal gap between section boxes
const NODE_HGAP = 14;          // horizontal gap between side-by-side nodes in same lane
const SECTION_PAD_X = 20;      // horizontal padding inside section box
const SECTION_PAD_TOP = 32;    // top padding (room for section label)
const SECTION_PAD_BOTTOM = 16;
const ROW_GAP = 24;            // vertical gap between swim-lane bands

export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  sectionDefs: LayoutSection[],
  graphTitle?: string,
  narrativeText?: string,
): { nodes: Node[]; edges: Edge[] } {
  // Build a map of node id → Node for easy lookup
  const nodeMap = new Map<string, Node>(nodes.map((n) => [n.id, n]));

  // For each section, group its nodes by type-row
  // sectionTypeNodes[sectionIdx][typeRowIdx] = Node[]
  const sectionTypeNodes: Node[][][] = sectionDefs.map(() =>
    TYPE_ROWS.map(() => [] as Node[]),
  );

  for (let secIdx = 0; secIdx < sectionDefs.length; secIdx++) {
    const sec = sectionDefs[secIdx];
    for (const nodeId of sec.nodeIds) {
      const node = nodeMap.get(nodeId);
      if (!node) continue;
      const rowIdx = typeRowIndex[node.type ?? 'derived'] ?? 1;
      sectionTypeNodes[secIdx][rowIdx].push(node);
    }
  }

  // Calculate the width each section needs (widest swim lane row)
  const sectionWidths: number[] = sectionDefs.map((_, secIdx) => {
    let maxRowWidth = 0;
    for (let r = 0; r < TYPE_ROWS.length; r++) {
      const rowNodes = sectionTypeNodes[secIdx][r];
      if (rowNodes.length === 0) continue;
      let rowW = 0;
      for (const n of rowNodes) {
        const w = n.type === 'output' ? OUTPUT_WIDTH : NODE_WIDTH;
        rowW += w + NODE_HGAP;
      }
      rowW -= NODE_HGAP; // remove trailing gap
      maxRowWidth = Math.max(maxRowWidth, rowW);
    }
    return Math.max(maxRowWidth, NODE_WIDTH) + SECTION_PAD_X * 2;
  });

  // Calculate the height of each swim-lane row (same across all sections)
  // Each row's height = max node height in that row across all sections, or 0 if empty globally
  const rowHeights: number[] = TYPE_ROWS.map((_, r) => {
    let hasAny = false;
    let maxH = 0;
    for (let s = 0; s < sectionDefs.length; s++) {
      if (sectionTypeNodes[s][r].length > 0) {
        hasAny = true;
        for (const n of sectionTypeNodes[s][r]) {
          const h = n.type === 'output' ? OUTPUT_HEIGHT : NODE_HEIGHT;
          maxH = Math.max(maxH, h);
        }
      }
    }
    return hasAny ? maxH : 0;
  });

  // Calculate Y offset for each swim-lane row
  const rowY: number[] = [];
  let currentY = SECTION_PAD_TOP;
  for (let r = 0; r < TYPE_ROWS.length; r++) {
    rowY.push(currentY);
    if (rowHeights[r] > 0) {
      currentY += rowHeights[r] + ROW_GAP;
    }
  }
  const totalHeight = currentY - ROW_GAP + SECTION_PAD_BOTTOM;

  // Now position all nodes and create section labels
  const layoutedNodes: Node[] = [];
  const sectionLabelNodes: Node[] = [];
  let xOffset = 0;

  for (let s = 0; s < sectionDefs.length; s++) {
    const sec = sectionDefs[s];
    const secWidth = sectionWidths[s];

    // Place nodes in each swim-lane row
    for (let r = 0; r < TYPE_ROWS.length; r++) {
      const rowNodes = sectionTypeNodes[s][r];
      if (rowNodes.length === 0) continue;

      // Calculate total width of nodes in this row
      let totalRowW = 0;
      for (const n of rowNodes) {
        totalRowW += (n.type === 'output' ? OUTPUT_WIDTH : NODE_WIDTH) + NODE_HGAP;
      }
      totalRowW -= NODE_HGAP;

      // Center the row within the section
      let nodeX = xOffset + (secWidth - totalRowW) / 2;

      for (const node of rowNodes) {
        const w = node.type === 'output' ? OUTPUT_WIDTH : NODE_WIDTH;
        const h = node.type === 'output' ? OUTPUT_HEIGHT : NODE_HEIGHT;

        // Vertically center within the row band
        const y = rowY[r] + (rowHeights[r] - h) / 2;

        layoutedNodes.push({
          ...node,
          position: { x: nodeX, y },
        });

        nodeX += w + NODE_HGAP;
      }
    }

    // Section label/divider node
    sectionLabelNodes.push({
      id: `section-${sec.id}`,
      type: 'sectionLabel',
      position: { x: xOffset, y: 0 },
      data: {
        label: sec.label,
        width: secWidth,
        height: totalHeight,
      },
      draggable: false,
      selectable: false,
      connectable: false,
      zIndex: -1,
      style: { pointerEvents: 'none' },
    } as Node);

    xOffset += secWidth + SECTION_GAP;
  }

  const totalWidth = xOffset - SECTION_GAP; // total width of all sections

  // Add a title node centered above the graph
  const titleNodes: Node[] = [];
  if (graphTitle) {
    titleNodes.push({
      id: '__graph-title__',
      type: 'graphTitle',
      position: { x: 0, y: -90 },
      data: { label: graphTitle, width: totalWidth },
      draggable: false,
      selectable: false,
      connectable: false,
      zIndex: -1,
      style: { pointerEvents: 'none' },
    } as Node);
  }

  // Add a narrative summary node below the sections
  const narrativeNodes: Node[] = [];
  if (narrativeText) {
    narrativeNodes.push({
      id: '__narrative-summary__',
      type: 'narrativeSummary',
      position: { x: 0, y: totalHeight + 32 },
      data: { text: narrativeText, width: totalWidth },
      draggable: false,
      selectable: false,
      connectable: false,
      zIndex: -1,
      style: { pointerEvents: 'none' },
    } as Node);
  }

  return {
    nodes: [...titleNodes, ...sectionLabelNodes, ...layoutedNodes, ...narrativeNodes],
    edges,
  };
}
