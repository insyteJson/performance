export default function TimeToggle({ mode, onChange }) {
  return (
    <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs font-medium">
      <button
        onClick={() => onChange('original')}
        className={`px-2.5 py-1 rounded-md transition-colors ${
          mode === 'original'
            ? 'bg-white text-indigo-600 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        Original
      </button>
      <button
        onClick={() => onChange('remaining')}
        className={`px-2.5 py-1 rounded-md transition-colors ${
          mode === 'remaining'
            ? 'bg-white text-indigo-600 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        Remaining
      </button>
    </div>
  );
}
