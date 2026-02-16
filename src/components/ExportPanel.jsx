import { useState } from 'react';
import { FileDown, FileArchive, FileText, Loader2 } from 'lucide-react';
import { useSprint } from '../context/SprintContext';
import { exportAllAsPDF, exportAllAsZIP } from '../utils/exportUtils';

export default function ExportPanel() {
  const {
    tickets,
    totalCapacity,
    totalAssigned,
    loadPercentage,
    overloadedCount,
    atRiskTickets,
    lowPriorityCount,
    devLoads,
  } = useSprint();

  const [exporting, setExporting] = useState(null);

  if (tickets.length === 0) return null;

  // Build summary text
  const overloadedDevNames = devLoads
    .filter((d) => d.loadPercent > 100)
    .map((d) => d.name);

  const summaryLines = [
    `Total Sprint Load: ${loadPercentage}% (${Math.round(totalAssigned)}h / ${totalCapacity}h)`,
  ];

  if (loadPercentage > 100) {
    const excessHours = Math.round(totalAssigned - totalCapacity);
    summaryLines.push(
      `The sprint is over-committed by ${excessHours} hours.`
    );
  }

  if (overloadedCount > 0) {
    summaryLines.push(
      `${overloadedCount} developer(s) over capacity: ${overloadedDevNames.join(', ')}.`
    );
  }

  if (atRiskTickets.length > 0) {
    summaryLines.push(
      `${atRiskTickets.length} ticket(s) are at risk of not finishing this sprint.`
    );
  }

  if (loadPercentage > 100 && lowPriorityCount > 0) {
    const ticketsToMove = Math.min(
      lowPriorityCount,
      Math.ceil((totalAssigned - totalCapacity) / 4)
    );
    summaryLines.push(
      `Recommendation: Move ${ticketsToMove} Low-priority ticket(s) to next sprint.`
    );
  } else if (loadPercentage <= 80) {
    summaryLines.push(
      `Team has capacity headroom. Consider pulling in stretch goals.`
    );
  }

  const summaryText = summaryLines.join('\n');

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

  const handleExportPDF = async () => {
    setExporting('pdf');
    try {
      await exportAllAsPDF(getChartElements(), summaryText);
    } catch (err) {
      console.error('PDF export failed:', err);
    }
    setExporting(null);
  };

  const handleExportZIP = async () => {
    setExporting('zip');
    try {
      await exportAllAsZIP(getChartElements(), chartNames);
    } catch (err) {
      console.error('ZIP export failed:', err);
    }
    setExporting(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <FileText size={20} />
        Sprint Summary & Export
      </h3>

      {/* Summary */}
      <div className="bg-slate-50 rounded-lg p-4 mb-5 border border-slate-200">
        {summaryLines.map((line, i) => (
          <p
            key={i}
            className={`text-sm ${
              i === 0 ? 'font-semibold text-slate-800 mb-1' : 'text-slate-600'
            }`}
          >
            {line}
          </p>
        ))}
      </div>

      {/* Export Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleExportPDF}
          disabled={exporting !== null}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {exporting === 'pdf' ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <FileDown size={16} />
          )}
          Generate Stakeholder Report (PDF)
        </button>
        <button
          onClick={handleExportZIP}
          disabled={exporting !== null}
          className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          {exporting === 'zip' ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <FileArchive size={16} />
          )}
          Download All Charts (ZIP)
        </button>
      </div>
    </div>
  );
}
