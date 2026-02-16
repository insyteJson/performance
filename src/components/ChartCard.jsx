import { useRef } from 'react';
import { Download } from 'lucide-react';
import { exportChartAsPNG } from '../utils/exportUtils';

export default function ChartCard({ title, subtitle, children, chartRef, id }) {
  const internalRef = useRef(null);
  const ref = chartRef || internalRef;

  const handleExport = () => {
    if (ref.current) {
      const safeName = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      exportChartAsPNG(ref.current, `${safeName}.png`);
    }
  };

  return (
    <div
      id={id}
      ref={ref}
      className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        <button
          onClick={handleExport}
          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          title="Export as PNG"
        >
          <Download size={18} />
        </button>
      </div>
      {children}
    </div>
  );
}
