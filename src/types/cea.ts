export type NodeKind = 'input' | 'derived' | 'adjustment' | 'output';
export type ValueFormat = 'currency' | 'number' | 'percentage' | 'multiplier' | 'uov';

export interface CEANode {
  id: string;
  label: string;
  section: string;
  nodeKind: NodeKind;
  format: ValueFormat;
  editable: boolean;
  description: string;
  formula?: string;
  compute?: (values: Record<string, number>) => number;
  dependencies: string[];
  /** How each dependency participates in the formula: ×, ÷, +, −, etc. */
  dependencyOps?: Record<string, string>;
}

export interface CountryData {
  id: string;
  name: string;
  values: Record<string, number>;
}

export interface LayoutSection {
  id: string;
  label: string;
  nodeIds: string[];
}

export interface SpreadsheetSection {
  title: string;
  rows: { nodeId: string; label: string }[];
}

export interface CEAModel {
  id: string;
  title: string;
  subtitle: string;
  regionLabel: string;
  logos?: string[];
  nodes: CEANode[];
  regions: CountryData[];
  layoutSections: LayoutSection[];
  spreadsheetSections: SpreadsheetSection[];
  getNarrative?: (values: Record<string, number>, regionName: string) => string;
}
