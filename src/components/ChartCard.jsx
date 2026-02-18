import { useRef, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { exportChartAsPNG } from '../utils/exportUtils';

export default function ChartCard({ title, subtitle, children, chartRef, id, actions }) {
  const internalRef = useRef(null);
  const ref = chartRef || internalRef;
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (ref.current && !exporting) {
      setExporting(true);
      try {
        const safeName = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        await exportChartAsPNG(ref.current, `${safeName}.png`);
      } catch (error) {
        console.error('Export failed:', error);
        alert('Failed to export chart. Please try again.');
      } finally {
        setExporting(false);
      }
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
        <div className="flex items-center gap-2">
          {actions}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export as PNG"
          >
            {exporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
