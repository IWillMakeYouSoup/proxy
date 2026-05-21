import { useEffect, useState } from 'react';
import { getEndpoint, getReplacer } from '../api';
import type { EndpointSummary, Replacer, StoredRecord, Tab } from '../types';
import { ReadView } from './ReadView';
import { EditView } from './EditView';
import { EditedView } from './EditedView';

type Mode = 'read' | 'edit' | 'edited';

interface Props {
  endpoint: EndpointSummary;
  onReplacerChanged: () => void;
}

export function MainPanel({ endpoint, onReplacerChanged }: Props) {
  const [record, setRecord] = useState<StoredRecord | null>(null);
  const [requestReplacer, setRequestReplacer] = useState<Replacer | null>(null);
  const [responseReplacer, setResponseReplacer] = useState<Replacer | null>(null);
  const [tab, setTab] = useState<Tab>('request');
  const [mode, setMode] = useState<Mode>('read');
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setError(null);
    try {
      const [r, reqRep, resRep] = await Promise.all([
        getEndpoint(endpoint.id),
        getReplacer(endpoint.method, endpoint.path, 'request'),
        getReplacer(endpoint.method, endpoint.path, 'response'),
      ]);
      setRecord(r);
      setRequestReplacer(reqRep);
      setResponseReplacer(resRep);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint.id]);

  useEffect(() => {
    const replacer = tab === 'request' ? requestReplacer : responseReplacer;
    setMode(replacer ? 'edited' : 'read');
  }, [tab, requestReplacer, responseReplacer]);

  if (!record) {
    return <div className="p-4 text-slate-400">Loading…</div>;
  }

  const activeReplacer = tab === 'request' ? requestReplacer : responseReplacer;
  const original = tab === 'request' ? record.request : record.response;

  const handleReplacerSaved = async () => {
    await refresh();
    onReplacerChanged();
    setMode('edited');
  };

  const handleReplacerDeleted = async () => {
    await refresh();
    onReplacerChanged();
    setMode('read');
  };

  return (
    <div className="flex flex-col h-full">
      <header className="px-4 py-3 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">
            {endpoint.method.toUpperCase()}
          </span>
          <span className="font-mono text-sm text-slate-700 truncate">
            {endpoint.path}
          </span>
        </div>
        <div className="mt-3 flex gap-2">
          <TabButton active={tab === 'request'} onClick={() => setTab('request')}>
            Request
          </TabButton>
          <TabButton active={tab === 'response'} onClick={() => setTab('response')}>
            Response
          </TabButton>
        </div>
      </header>

      {error && (
        <div className="bg-red-100 text-red-700 p-2 text-sm">{error}</div>
      )}

      <div className="flex-1 overflow-hidden">
        {mode === 'read' && (
          <ReadView
            data={original}
            onCreateReplacer={() => setMode('edit')}
          />
        )}
        {mode === 'edit' && (
          <EditView
            method={endpoint.method}
            path={endpoint.path}
            type={tab}
            original={original}
            initialContent={activeReplacer?.content ?? original}
            onSaved={handleReplacerSaved}
            onCancel={() => setMode(activeReplacer ? 'edited' : 'read')}
          />
        )}
        {mode === 'edited' && activeReplacer && (
          <EditedView
            method={endpoint.method}
            path={endpoint.path}
            type={tab}
            original={original}
            replacer={activeReplacer}
            onEdit={() => setMode('edit')}
            onDeleted={handleReplacerDeleted}
          />
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-sm px-3 py-1 rounded ${
        active
          ? 'bg-slate-900 text-white'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      }`}
    >
      {children}
    </button>
  );
}
