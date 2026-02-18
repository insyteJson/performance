import { useState } from 'react';
import { FileArchive, FileText, Loader2 } from 'lucide-react';
import { useSprint } from '../context/SprintContext';
import { exportAllAsZIP } from '../utils/exportUtils';

export default function ExportPanel() {
  const { userStories } = useSprint();

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  if (userStories.length === 0) return null;

  const getChartElements = () => {
    const ids = [
      'chart-capacity',
      'chart-team-load',
      'chart-risk-value',
      'chart-epic',
      'chart-cutoff',
    ];
    return ids.map((id) => document.getElementById(id)).filter(Boolean);
  };

  const chartNames = [
    'capacity-gauges',
    'team-load-balance',
    'risk-vs-value',
    'epic-distribution',
    'sprint-cutoff',
  ];

  const handleExportZIP = async () => {
    setExporting(true);
    setExportError('');
    try {
      const elements = getChartElements();
      if (elements.length === 0) {
        setExportError('No charts found on page. Make sure data is loaded.');
        return;
      }
      await exportAllAsZIP(elements, chartNames);
    } catch (err) {
      console.error('ZIP export failed:', err);
      setExportError(`ZIP export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <FileText size={20} />
        Export Charts
      </h3>

      {exportError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {exportError}
        </div>
      )}

      <button
        onClick={handleExportZIP}
        disabled={exporting}
        className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
      >
        {exporting ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <FileArchive size={16} />
        )}
        Download All Charts (ZIP)
      </button>
    </div>
  );
}
