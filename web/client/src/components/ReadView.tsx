import { JsonPane } from './JsonPane';

interface Props {
  data: unknown;
  onCreateReplacer: () => void;
}

export function ReadView({ data, onCreateReplacer }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 bg-white border-b border-slate-200 flex justify-end">
        <button
          onClick={onCreateReplacer}
          className="text-sm px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          Create replacer
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        <JsonPane data={data} />
      </div>
    </div>
  );
}
