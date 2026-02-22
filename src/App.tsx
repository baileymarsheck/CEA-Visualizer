import { useState } from 'react';
import { FlowDiagram } from './components/FlowDiagram';
import { LandingPage } from './components/LandingPage';

function App() {
  const [activeCEA, setActiveCEA] = useState<string | null>(null);

  if (activeCEA) {
    return <FlowDiagram modelId={activeCEA} onBack={() => setActiveCEA(null)} />;
  }

  return <LandingPage onExploreCEA={(id) => setActiveCEA(id)} />;
}

export default App;
