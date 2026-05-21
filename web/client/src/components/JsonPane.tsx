interface Props {
  data: unknown;
  className?: string;
}

export function JsonPane({ data, className }: Props) {
  return (
    <pre
      className={`overflow-auto h-full p-3 text-xs font-mono bg-slate-50 text-slate-800 ${
        className ?? ''
      }`}
    >
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
