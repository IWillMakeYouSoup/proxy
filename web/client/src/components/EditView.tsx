import { useState } from 'react';
import { JsonPane } from './JsonPane';
import { saveReplacer } from '../api';
import type { ReplacerType } from '../types';

interface Props {
  method: string;
  path: string;
  type: ReplacerType;
  original: unknown;
  initialContent: unknown;
  onSaved: () => void;
  onCancel: () => void;
}

export function EditView({
  method,
  path,
  type,
  original,
  initialContent,
  onSaved,
  onCancel,
}: Props) {
  const [text, setText] = useState(() => JSON.stringify(initialContent, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setError(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      setError(`Invalid JSON: ${(err as Error).message}`);
      return;
    }
    setSaving(true);
    try {
      await saveReplacer(method, path, type, parsed);
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 bg-white border-b border-slate-200 flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="text-sm px-3 py-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-sm px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
      {error && <div className="bg-red-100 text-red-700 p-2 text-sm">{error}</div>}
      <div className="flex-1 grid grid-cols-2 overflow-hidden">
        <div className="border-r border-slate-200 overflow-hidden">
          <div className="px-3 py-1 text-xs uppercase tracking-wide text-slate-500 bg-white border-b border-slate-200">
            Original
          </div>
          <div className="h-[calc(100%-1.75rem)]">
            <JsonPane data={original} />
          </div>
        </div>
        <div className="flex flex-col overflow-hidden">
          <div className="px-3 py-1 text-xs uppercase tracking-wide text-slate-500 bg-white border-b border-slate-200">
            Replacer content
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            className="flex-1 p-3 text-xs font-mono bg-white outline-none resize-none"
          />
        </div>
      </div>
    </div>
  );
}
