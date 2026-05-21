import { useState } from 'react';
import { JsonPane } from './JsonPane';
import { deleteReplacer } from '../api';
import type { Replacer, ReplacerType } from '../types';

interface Props {
  method: string;
  path: string;
  type: ReplacerType;
  original: unknown;
  replacer: Replacer;
  onEdit: () => void;
  onDeleted: () => void;
}

export function EditedView({
  method,
  path,
  type,
  original,
  replacer,
  onEdit,
  onDeleted,
}: Props) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!confirm('Delete this replacer?')) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteReplacer(method, path, type);
      onDeleted();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 bg-white border-b border-slate-200 flex justify-end gap-2">
        <button
          onClick={onEdit}
          className="text-sm px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          Edit
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-sm px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
        >
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
      {error && <div className="bg-red-100 text-red-700 p-2 text-sm">{error}</div>}
      <div className="flex-1 grid grid-cols-2 overflow-hidden">
        <div className="border-r border-slate-200 overflow-hidden flex flex-col">
          <div className="px-3 py-1 text-xs uppercase tracking-wide text-slate-500 bg-white border-b border-slate-200">
            Original
          </div>
          <div className="flex-1 overflow-hidden">
            <JsonPane data={original} />
          </div>
        </div>
        <div className="overflow-hidden flex flex-col">
          <div className="px-3 py-1 text-xs uppercase tracking-wide text-slate-500 bg-white border-b border-slate-200">
            Replacer content
          </div>
          <div className="flex-1 overflow-hidden">
            <JsonPane data={replacer.content} />
          </div>
        </div>
      </div>
    </div>
  );
}
