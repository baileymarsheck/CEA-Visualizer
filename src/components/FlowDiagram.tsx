import {
  ReactFlow,
  Background,
  Controls,
  type NodeTypes,
  type EdgeTypes,
  type NodeMouseHandler,
  type EdgeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { InputNode } from './nodes/InputNode';
import { CalculationNode } from './nodes/CalculationNode';
import { AdjustmentNode } from './nodes/AdjustmentNode';
import { OutputNode } from './nodes/OutputNode';
import { SectionLabelNode } from './nodes/SectionLabelNode';
import { GraphTitleNode } from './nodes/GraphTitleNode';
import { NarrativeSummaryNode } from './nodes/NarrativeSummaryNode';
import { ArcEdge } from './edges/ArcEdge';
import { useCEAGraph } from '../hooks/useCEAGraph';
import { NodeTooltip } from './NodeTooltip';
import { SpreadsheetPanel } from './panels/SpreadsheetPanel';
import { CountrySelector } from './panels/CountrySelector';
import { Legend } from './Legend';
import { SensitivityPanel } from './panels/SensitivityPanel';
import { ChangeSummary } from './panels/ChangeSummary';
import { WalkthroughModal } from './WalkthroughModal';
import { useCallback, useMemo, useRef, useState } from 'react';

const nodeTypes: NodeTypes = {
  input: InputNode,
  derived: CalculationNode,
  adjustment: AdjustmentNode,
  output: OutputNode,
  sectionLabel: SectionLabelNode,
  graphTitle: GraphTitleNode,
  narrativeSummary: NarrativeSummaryNode,
};

const edgeTypes: EdgeTypes = {
  arcEdge: ArcEdge,
};

interface TooltipRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FlowDiagramProps {
  modelId: string;
  onBack?: () => void;
}

export function FlowDiagram({ modelId, onBack }: FlowDiagramProps) {
  const {
    model,
    nodes,
    edges,
    computedValues,
    baseComputedValues,
    countryId,
    country,
    selectedNodeId,
    activeNodeId,
    highlightedIds,
    setSelectedNodeId,
    setHoveredNodeId,
    handleCountryChange,
    handleInputChange,
    overrides,
    setOverrides,
  } = useCEAGraph(modelId);

  const [tooltipRect, setTooltipRect] = useState<TooltipRect | null>(null);
  const [tooltipNodeId, setTooltipNodeId] = useState<string | null>(null);
  const [spreadsheetWidth, setSpreadsheetWidth] = useState(420);
  const [showSensitivity, setShowSensitivity] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [glowNodeId, setGlowNodeId] = useState<string | null>(null);
  const isDragging = useRef(false);

  const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    const startX = e.clientX;
    const startWidth = spreadsheetWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.max(280, Math.min(startWidth + delta, 700));
      setSpreadsheetWidth(newWidth);
    };

    const onMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [spreadsheetWidth]);

  const onNodeMouseEnter: NodeMouseHandler = useCallback(
    (_event, node) => {
      if (node.type === 'sectionLabel' || node.type === 'graphTitle' || node.type === 'narrativeSummary') return;
      if (selectedNodeId && !highlightedIds.has(node.id)) return;
      setHoveredNodeId(node.id);
      setTooltipNodeId(node.id);
      const el = document.querySelector(`[data-id="${node.id}"]`);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTooltipRect({ x: rect.x, y: rect.y, width: rect.width, height: rect.height });
      }
    },
    [setHoveredNodeId, selectedNodeId, highlightedIds],
  );

  const onNodeMouseLeave: NodeMouseHandler = useCallback(
    (_event, node) => {
      if (node.type === 'sectionLabel' || node.type === 'graphTitle' || node.type === 'narrativeSummary') return;
      setHoveredNodeId(null);
      setTooltipNodeId(null);
      setTooltipRect(null);
    },
    [setHoveredNodeId],
  );

  const onEdgeMouseEnter: EdgeMouseHandler = useCallback(
    (_event, edge) => {
      if (edge.type !== 'arcEdge') return;
      setGlowNodeId(edge.source);
    },
    [],
  );

  const onEdgeMouseLeave: EdgeMouseHandler = useCallback(
    (_event, edge) => {
      if (edge.type !== 'arcEdge') return;
      setGlowNodeId(null);
    },
    [],
  );

  const handleSpreadsheetRowHover = useCallback(
    (nodeId: string | null, rect?: TooltipRect) => {
      setHoveredNodeId(nodeId);
      setTooltipNodeId(nodeId);
      setTooltipRect(rect ?? null);
    },
    [setHoveredNodeId],
  );

  // Inject glowing flag into nodes when an arc is hovered
  const enhancedNodes = useMemo(() => {
    if (!glowNodeId) return nodes;
    return nodes.map((node) =>
      node.id === glowNodeId
        ? { ...node, data: { ...node.data, glowing: true } }
        : node,
    );
  }, [nodes, glowNodeId]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Back to home"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {model.title}
            </h1>
            <p className="text-xs text-gray-500">
              {model.subtitle}
            </p>
          </div>
          {model.logos && model.logos.length > 1 && (
            <img
              src={model.logos[model.logos.length - 1]}
              alt=""
              className="h-8 object-contain opacity-80 ml-2"
              style={{ maxWidth: 120 }}
            />
          )}
        </div>
        <div className="flex items-center gap-3">
          <CountrySelector regions={model.regions} selectedId={countryId} onChange={handleCountryChange} />
        </div>
      </div>

      {/* What changed summary banner */}
      <ChangeSummary
        overrides={overrides}
        baseValues={country.values}
        baseComputedValues={baseComputedValues}
        computedValues={computedValues}
        ceaNodes={model.nodes}
        onReset={() => setOverrides({})}
      />

      {/* Main area: spreadsheet | flow diagram */}
      <div className="flex-1 flex min-h-0">
        {/* Spreadsheet panel (left) */}
        <SpreadsheetPanel
          ceaNodes={model.nodes}
          sections={model.spreadsheetSections}
          spreadsheetTitle={model.subtitle}
          width={spreadsheetWidth}
          values={computedValues}
          activeNodeId={activeNodeId}
          selectedNodeId={selectedNodeId}
          highlightedIds={highlightedIds}
          onRowClick={(nodeId) =>
            setSelectedNodeId(nodeId === selectedNodeId ? null : nodeId)
          }
          onRowHover={handleSpreadsheetRowHover}
          onInputChange={handleInputChange}
          overrides={overrides}
          countryName={country.name}
        />

        {/* Draggable divider */}
        <div
          onMouseDown={handleDividerMouseDown}
          className="w-1.5 bg-gray-200 hover:bg-blue-400 cursor-col-resize flex-shrink-0 transition-colors"
        />

        {/* Flow diagram (right) */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={enhancedNodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodeMouseEnter={onNodeMouseEnter}
            onNodeMouseLeave={onNodeMouseLeave}
            onEdgeMouseEnter={onEdgeMouseEnter}
            onEdgeMouseLeave={onEdgeMouseLeave}
            onPaneClick={() => { setSelectedNodeId(null); setShowSensitivity(false); }}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            proOptions={{ hideAttribution: true }}
            minZoom={0.3}
            maxZoom={1.5}
          >
            <Background color="#c9cdd4" gap={20} bgColor="#e2e4e9" />
            <Controls showInteractive={false} />
          </ReactFlow>

          {/* Legend overlay */}
          <div className="absolute bottom-3 left-14 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm border border-gray-200">
            <Legend />
            <div className="text-[10px] text-gray-400 mt-1">
              Hover any node for details
              {selectedNodeId && (
                <>
                  {' '}&middot;{' '}
                  <button
                    onClick={() => { setSelectedNodeId(null); setShowSensitivity(false); }}
                    className="text-blue-500 hover:text-blue-700 underline"
                  >
                    Clear selection
                  </button>
                </>
              )}
            </div>
          </div>

          {/* How to use button */}
          {!showWalkthrough && (
            <button
              onClick={() => setShowWalkthrough(true)}
              className="absolute top-3 right-3 flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 bg-white/90 backdrop-blur-sm border border-gray-200 hover:border-gray-400 px-2.5 py-1.5 rounded-lg shadow-sm transition-colors z-10"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              How to use
            </button>
          )}

          {/* Sensitivity Analysis button — appears when a node is selected */}
          {selectedNodeId && !showSensitivity && (
            <button
              onClick={() => setShowSensitivity(true)}
              className="absolute top-3 right-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-md transition-colors z-50"
            >
              Sensitivity Analysis
            </button>
          )}

          {/* Sensitivity Panel */}
          {selectedNodeId && showSensitivity && (
            <SensitivityPanel
              ceaNodes={model.nodes}
              selectedNodeId={selectedNodeId}
              computedValues={computedValues}
              countryValues={country.values}
              overrides={overrides}
              onInputChange={handleInputChange}
              onClose={() => setShowSensitivity(false)}
            />
          )}
        </div>
      </div>

      {/* Floating tooltip — always shows the hovered node, not the selected one */}
      {tooltipNodeId && tooltipRect && (() => {
        const tooltipNode = model.nodes.find((n) => n.id === tooltipNodeId);
        if (!tooltipNode) return null;
        return (
          <NodeTooltip
            node={tooltipNode}
            value={computedValues[tooltipNode.id] ?? 0}
            values={computedValues}
            ceaNodes={model.nodes}
            rect={tooltipRect}
          />
        );
      })()}

      {/* Walkthrough modal */}
      {showWalkthrough && <WalkthroughModal onClose={() => setShowWalkthrough(false)} />}
    </div>
  );
}
