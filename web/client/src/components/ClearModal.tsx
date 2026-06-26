import { useState } from 'react';
import type { ClearMode } from '../api';

interface Props {
  onConfirm: (mode: ClearMode) => Promise<void> | void;
  onCancel: () => void;
}

export function ClearModal({ onConfirm, onCancel }: Props) {
  const [mode, setMode] = useState<ClearMode>('all');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm(mode);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-96 max-w-[90vw] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-semibold text-slate-800 mb-1">Clear requests</h2>
        <p className="text-sm text-slate-500 mb-4">
          Choose which captured requests to remove.
        </p>

        <div className="flex flex-col gap-2 mb-4">
          <label className="flex items-start gap-2 p-2 rounded border border-slate-200 cursor-pointer hover:bg-slate-50">
            <input
              type="radio"
              name="clear-mode"
              className="mt-1"
              checked={mode === 'all'}
              onChange={() => setMode('all')}
            />
            <span>
              <span className="block text-sm font-medium text-slate-800">
                Clear everything
              </span>
              <span className="block text-xs text-slate-500">
                Remove all captured requests.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-2 p-2 rounded border border-slate-200 cursor-pointer hover:bg-slate-50">
            <input
              type="radio"
              name="clear-mode"
              className="mt-1"
              checked={mode === 'keepModified'}
              onChange={() => setMode('keepModified')}
            />
            <span>
              <span className="block text-sm font-medium text-slate-800">
                Keep modified
              </span>
              <span className="block text-xs text-slate-500">
                Remove only requests without an active replacer.
              </span>
            </span>
          </label>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-2 text-sm mb-3 rounded">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={busy}
            className="px-3 py-1.5 text-sm rounded bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={busy}
            className="px-3 py-1.5 text-sm rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {busy ? 'Clearing…' : 'Clear'}
          </button>
        </div>
      </div>
    </div>
  );
}
