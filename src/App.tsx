import { useState } from 'react';
import type { CEAModel } from './types/cea';
import { getModel } from './data/models';
import { FlowDiagram } from './components/FlowDiagram';
import { LandingPage } from './components/LandingPage';

type ActiveView = { kind: 'static'; id: string } | { kind: 'dynamic'; model: CEAModel };

function App() {
  const [activeView, setActiveView] = useState<ActiveView | null>(null);

  if (activeView) {
    const model = activeView.kind === 'static' ? getModel(activeView.id) : activeView.model;
    return <FlowDiagram model={model} onBack={() => setActiveView(null)} />;
  }

  return (
    <LandingPage
      onExploreCEA={(id) => setActiveView({ kind: 'static', id })}
      onLoadDynamicModel={(model) => setActiveView({ kind: 'dynamic', model })}
    />
  );
}

export default App;
