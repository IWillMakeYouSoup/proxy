import { useEffect, useState } from 'react';
import { Drawer } from './components/Drawer';
import { MainPanel } from './components/MainPanel';
import { clearEndpoints, listEndpoints } from './api';
import type { ClearMode } from './api';
import type { EndpointSummary } from './types';

export default function App() {
  const [endpoints, setEndpoints] = useState<EndpointSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const list = await listEndpoints();
      setEndpoints(list);
      if (!selectedId && list.length > 0) {
        setSelectedId(list[0].id);
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleClear = async (mode: ClearMode) => {
    try {
      await clearEndpoints(mode);
      const list = await listEndpoints();
      setEndpoints(list);
      if (selectedId && !list.some((e) => e.id === selectedId)) {
        setSelectedId(list.length > 0 ? list[0].id : null);
      }
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = endpoints.find((e) => e.id === selectedId) ?? null;

  return (
    <div className="flex h-full">
      <Drawer
        endpoints={endpoints}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onRefresh={refresh}
        onClear={handleClear}
      />
      <div className="flex-1 overflow-hidden">
        {error && (
          <div className="bg-red-100 text-red-700 p-2 text-sm">{error}</div>
        )}
        {selected ? (
          <MainPanel endpoint={selected} onReplacerChanged={refresh} />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            Select an endpoint from the left
          </div>
        )}
      </div>
    </div>
  );
}
