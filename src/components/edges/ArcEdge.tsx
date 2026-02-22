import { useInternalNode, type EdgeProps } from '@xyflow/react';

interface ArcEdgeData {
  color: string;
  arcOffset: number;
  direction: 'upstream' | 'downstream';
  index: number;
  total: number;
}

/**
 * Compute an evenly-spaced offset along a node edge.
 * Given `index` out of `total` items and the available `length`,
 * returns an offset from the center so items are spread out and never overlap.
 */
function spreadOffset(index: number, total: number, length: number): number {
  if (total <= 1) return 0;
  const spacing = Math.min(20, (length * 0.7) / (total - 1));
  return (index - (total - 1) / 2) * spacing;
}

export function ArcEdge({
  id,
  source,
  target,
  data,
}: EdgeProps & { data?: ArcEdgeData }) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  if (!sourceNode || !targetNode || !data) return null;

  const color = data.color ?? '#3b82f6';
  const baseOffset = data.arcOffset ?? 80;
  const idx = data.index ?? 0;
  const total = data.total ?? 1;

  // Get node dimensions and positions
  const sW = sourceNode.measured?.width ?? 180;
  const sH = sourceNode.measured?.height ?? 60;
  const tW = targetNode.measured?.width ?? 180;
  const tH = targetNode.measured?.height ?? 60;

  const sx = sourceNode.internals.positionAbsolute.x;
  const sy = sourceNode.internals.positionAbsolute.y;
  const tx = targetNode.internals.positionAbsolute.x;
  const ty = targetNode.internals.positionAbsolute.y;

  const scx = sx + sW / 2;
  const scy = sy + sH / 2;
  const tcx = tx + tW / 2;
  const tcy = ty + tH / 2;

  const dx = tcx - scx;
  const dy = tcy - scy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Scale the offset proportionally to distance, with extra clearance for large nodes
  const maxNodeWidth = Math.max(sW, tW);
  const maxNodeHeight = Math.max(sH, tH);
  const nodeSizeBonus = maxNodeWidth > 200 ? maxNodeWidth * 0.7 : 0;
  const offset = baseOffset + dist * 0.4 + nodeSizeBonus;

  // Determine swing direction based on source position relative to target
  const sourceIsRight = scx >= tcx;
  const side = sourceIsRight ? 1 : -1;

  const isVertical = Math.abs(dy) > Math.abs(dx) * 0.3;

  let startX: number, startY: number, endX: number, endY: number;

  if (isVertical) {
    // Spread attachment points vertically along the side of each node
    const sourceSpread = spreadOffset(idx, total, sH);
    const targetSpread = spreadOffset(idx, total, tH);

    if (side > 0) {
      startX = sx + sW;
      startY = scy + sourceSpread;
      endX = tx + tW;
      endY = tcy + targetSpread;
    } else {
      startX = sx;
      startY = scy + sourceSpread;
      endX = tx;
      endY = tcy + targetSpread;
    }

    // Ensure control point clears the widest node by at least half its width
    const outerEdge = side > 0
      ? Math.max(startX, endX)
      : Math.min(startX, endX);
    const minClearance = maxNodeWidth * 0.5;
    const cpx = outerEdge + Math.max(offset, minClearance) * side;
    const cpy1 = startY + (endY - startY) * 0.3;
    const cpy2 = startY + (endY - startY) * 0.7;

    const path = `M ${startX} ${startY} C ${cpx} ${cpy1}, ${cpx} ${cpy2}, ${endX} ${endY}`;
    return renderArc(id, path, color);
  } else {
    // Spread attachment points horizontally along the top/bottom of each node
    const sourceSpread = spreadOffset(idx, total, sW);
    const targetSpread = spreadOffset(idx, total, tW);
    const vertDir = sourceIsRight ? 1 : -1;

    if (vertDir > 0) {
      startX = scx + sourceSpread;
      startY = sy + sH;
      endX = tcx + targetSpread;
      endY = ty + tH;
    } else {
      startX = scx + sourceSpread;
      startY = sy;
      endX = tcx + targetSpread;
      endY = ty;
    }

    const outerEdge = vertDir > 0
      ? Math.max(startY, endY)
      : Math.min(startY, endY);
    const minClearanceV = maxNodeHeight * 0.5;
    const cpy = outerEdge + Math.max(offset, minClearanceV) * vertDir;
    const cpx1 = startX + (endX - startX) * 0.3;
    const cpx2 = startX + (endX - startX) * 0.7;

    const path = `M ${startX} ${startY} C ${cpx1} ${cpy}, ${cpx2} ${cpy}, ${endX} ${endY}`;
    return renderArc(id, path, color);
  }
}

function renderArc(id: string, path: string, color: string) {
  const markerId = `arc-arrow-${id}`;
  return (
    <g className="react-flow__edge-interaction">
      <defs>
        <marker
          id={markerId}
          markerWidth="14"
          markerHeight="10"
          refX="12"
          refY="5"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d="M 0 0 L 14 5 L 0 10 Z" fill={color} />
        </marker>
      </defs>
      {/* Wide invisible hit area for hover detection */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        style={{ pointerEvents: 'stroke' }}
      />
      {/* Visible arc */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={3.5}
        strokeOpacity={0.8}
        strokeDasharray="8 4"
        markerEnd={`url(#${markerId})`}
        style={{ pointerEvents: 'none' }}
      />
    </g>
  );
}
