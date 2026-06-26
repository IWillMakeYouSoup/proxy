import { useState } from 'react';
import type { EndpointSummary } from '../types';
import type { ClearMode } from '../api';
import { ClearModal } from './ClearModal';

interface Props {
  endpoints: EndpointSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRefresh: () => void;
  onClear: (mode: ClearMode) => Promise<void>;
}

const methodColor: Record<string, string> = {
  GET: 'text-emerald-700 bg-emerald-50',
  POST: 'text-blue-700 bg-blue-50',
  PUT: 'text-amber-700 bg-amber-50',
  PATCH: 'text-amber-700 bg-amber-50',
  DELETE: 'text-red-700 bg-red-50',
};

export function Drawer({
  endpoints,
  selectedId,
  onSelect,
  onRefresh,
  onClear,
}: Props) {
  const [filter, setFilter] = useState('');
  const [showClear, setShowClear] = useState(false);

  const query = filter.trim().toLowerCase();
  const filtered = query
    ? endpoints.filter(
        (e) =>
          e.path.toLowerCase().includes(query) ||
          e.method.toLowerCase().includes(query),
      )
    : endpoints;

  const handleClear = async (mode: ClearMode) => {
    await onClear(mode);
    setShowClear(false);
  };

  return (
    <aside className="w-96 border-r border-slate-200 bg-white flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <h1 className="font-semibold text-slate-700">Endpoints</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="text-xs text-slate-500 hover:text-slate-900"
          >
            refresh
          </button>
          <button
            onClick={() => setShowClear(true)}
            className="text-xs text-red-600 hover:text-red-700"
          >
            clear
          </button>
        </div>
      </div>
      <div className="px-3 py-2 border-b border-slate-200">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter endpoints…"
          className="w-full text-sm px-2 py-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-400"
        />
      </div>
      <ul className="flex-1 overflow-y-auto">
        {endpoints.length === 0 && (
          <li className="p-4 text-sm text-slate-400">
            No endpoints captured yet. Make a request through the proxy.
          </li>
        )}
        {endpoints.length > 0 && filtered.length === 0 && (
          <li className="p-4 text-sm text-slate-400">
            No endpoints match “{filter}”.
          </li>
        )}
        {filtered.map((e) => {
          const active = e.id === selectedId;
          const method = e.method.toUpperCase();
          return (
            <li key={e.id}>
              <button
                onClick={() => onSelect(e.id)}
                className={`w-full text-left px-3 py-2 border-b border-slate-100 hover:bg-slate-50 ${
                  active ? 'bg-slate-100' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded ${
                      methodColor[method] ?? 'text-slate-700 bg-slate-100'
                    }`}
                  >
                    {method}
                  </span>
                  <span className="text-sm text-slate-800 truncate">
                    {e.path}
                  </span>
                </div>
                <div className="flex gap-1 mt-1 ml-1">
                  {e.hasRequestReplacer && (
                    <span className="text-[10px] uppercase tracking-wide bg-purple-100 text-purple-700 px-1 rounded">
                      req replacer
                    </span>
                  )}
                  {e.hasResponseReplacer && (
                    <span className="text-[10px] uppercase tracking-wide bg-purple-100 text-purple-700 px-1 rounded">
                      res replacer
                    </span>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
      {showClear && (
        <ClearModal
          onConfirm={handleClear}
          onCancel={() => setShowClear(false)}
        />
      )}
    </aside>
  );
}
