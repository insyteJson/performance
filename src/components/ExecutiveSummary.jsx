import { useState, useMemo } from 'react';
import {
  Target,
  Calendar,
  Shield,
  AlertTriangle,
  TrendingUp,
  FileDown,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { useSprint } from '../context/SprintContext';
import { exportAllAsPDF } from '../utils/exportUtils';

const CONFIDENCE_OPTIONS = [
  { value: 'green', label: 'Green', color: 'bg-emerald-500', desc: 'On track, no concerns' },
  { value: 'yellow', label: 'Yellow', color: 'bg-amber-400', desc: 'Some concerns, monitoring' },
  { value: 'red', label: 'Red', color: 'bg-red-500', desc: 'Significant risks identified' },
];

const FORECAST_OPTIONS = [
  { value: 'on-track', label: 'On track', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { value: 'at-risk', label: 'At risk', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { value: 'needs-attention', label: 'Needs attention', color: 'text-red-700 bg-red-50 border-red-200' },
];

export default function ExecutiveSummary() {
  const {
    executiveSummary,
    updateExecutiveSummary,
    userStories,
    totalCapacity,
    totalWork,
    loadPercentage,
    sprintProgress,
    overloadedCount,
    atRiskTickets,
    lowPriorityCount,
    devLoads,
    totalTimeSpent,
    totalAssigned,
  } = useSprint();

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  const {
    sprintGoal,
    sprintStartDate,
    sprintEndDate,
    confidenceLevel,
    keyRisks,
    deliveryForecast,
  } = executiveSummary;

  // Calculate days remaining
  const daysRemaining = useMemo(() => {
    if (!sprintEndDate) return null;
    const end = new Date(sprintEndDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff;
  }, [sprintEndDate]);

  // Check if all required fields are filled
  const allFieldsFilled =
    sprintGoal.trim() !== '' &&
    sprintStartDate !== '' &&
    sprintEndDate !== '' &&
    confidenceLevel !== '' &&
    keyRisks.trim() !== '' &&
    deliveryForecast !== '';

  const handleChange = (field, value) => {
    updateExecutiveSummary({ [field]: value });
  };

  // Build summary text for PDF (same logic as ExportPanel had)
  const buildSummaryText = () => {
    const overloadedDevNames = devLoads
      .filter((d) => d.loadPercent > 100)
      .map((d) => d.name);

    const lines = [];

    // Executive summary fields
    lines.push(`Sprint Goal: ${sprintGoal}`);
    lines.push(`Sprint Dates: ${sprintStartDate} to ${sprintEndDate}${daysRemaining != null ? ` (${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining)` : ''}`);
    lines.push(`Confidence Level: ${CONFIDENCE_OPTIONS.find(o => o.value === confidenceLevel)?.label || confidenceLevel}`);
    lines.push(`Delivery Forecast: ${FORECAST_OPTIONS.find(o => o.value === deliveryForecast)?.label || deliveryForecast}`);
    lines.push(`Key Risks: ${keyRisks}`);
    lines.push('');

    // Auto-generated metrics
    lines.push(`Total Sprint Load: ${loadPercentage}% (${Math.round(totalWork)}h / ${totalCapacity}h)`);

    if (totalTimeSpent > 0) {
      lines.push(
        `Time Tracking: ${Math.round(totalTimeSpent)}h spent, ${Math.round(totalAssigned)}h remaining (${sprintProgress}% complete)`
      );
    }

    if (loadPercentage > 100) {
      const excessHours = Math.round(totalWork - totalCapacity);
      lines.push(`The sprint is over-committed by ${excessHours} hours.`);
    }

    if (overloadedCount > 0) {
      lines.push(
        `${overloadedCount} developer(s) over capacity: ${overloadedDevNames.join(', ')}.`
      );
    }

    if (atRiskTickets.length > 0) {
      lines.push(
        `${atRiskTickets.length} ticket(s) are at risk of not finishing this sprint.`
      );
    }

    if (loadPercentage > 100 && lowPriorityCount > 0) {
      const ticketsToMove = Math.min(
        lowPriorityCount,
        Math.ceil((totalWork - totalCapacity) / 4)
      );
      lines.push(
        `Recommendation: Move ${ticketsToMove} Low-priority ticket(s) to next sprint.`
      );
    } else if (loadPercentage <= 80) {
      lines.push(
        'Team has capacity headroom. Consider pulling in stretch goals.'
      );
    }

    return lines.join('\n');
  };

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

  const handleExportPDF = async () => {
    setExporting(true);
    setExportError('');
    try {
      const elements = getChartElements();
      if (elements.length === 0) {
        setExportError('No charts found on page. Make sure data is loaded.');
        return;
      }
      await exportAllAsPDF(elements, buildSummaryText());
    } catch (err) {
      console.error('PDF export failed:', err);
      setExportError(`PDF export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const confidenceOption = CONFIDENCE_OPTIONS.find(
    (o) => o.value === confidenceLevel
  );
  const forecastOption = FORECAST_OPTIONS.find(
    (o) => o.value === deliveryForecast
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header bar */}
      <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield size={22} className="text-white/90" />
          <div>
            <h2 className="text-lg font-bold text-white">Executive Summary</h2>
            <p className="text-indigo-100 text-xs">Sprint overview for stakeholders</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {confidenceLevel && (
            <div className="flex items-center gap-2 bg-white/15 rounded-lg px-3 py-1.5">
              <div className={`w-3 h-3 rounded-full ${confidenceOption?.color}`} />
              <span className="text-white text-sm font-medium">
                {confidenceOption?.label}
              </span>
            </div>
          )}
          {forecastOption && (
            <span
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${forecastOption.color}`}
            >
              {forecastOption.label}
            </span>
          )}
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Sprint Goal */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1.5">
            <Target size={15} className="text-indigo-500" />
            Sprint Goal
            <span className="text-red-400 text-xs">*</span>
          </label>
          <input
            type="text"
            value={sprintGoal}
            onChange={(e) => handleChange('sprintGoal', e.target.value)}
            placeholder="e.g., Deliver user authentication module and complete API integration"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Sprint Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1.5">
              <Calendar size={15} className="text-indigo-500" />
              Start Date
              <span className="text-red-400 text-xs">*</span>
            </label>
            <input
              type="date"
              value={sprintStartDate}
              onChange={(e) => handleChange('sprintStartDate', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1.5">
              <Calendar size={15} className="text-indigo-500" />
              End Date
              <span className="text-red-400 text-xs">*</span>
            </label>
            <input
              type="date"
              value={sprintEndDate}
              onChange={(e) => handleChange('sprintEndDate', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex items-end">
            {daysRemaining != null && (
              <div
                className={`w-full px-3 py-2 rounded-lg text-sm font-medium text-center ${
                  daysRemaining < 0
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : daysRemaining <= 2
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {daysRemaining < 0
                  ? `${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) !== 1 ? 's' : ''} overdue`
                  : daysRemaining === 0
                  ? 'Sprint ends today'
                  : `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`}
              </div>
            )}
          </div>
        </div>

        {/* Confidence Level & Delivery Forecast */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1.5">
              <Shield size={15} className="text-indigo-500" />
              Confidence Level
              <span className="text-red-400 text-xs">*</span>
            </label>
            <div className="flex gap-2">
              {CONFIDENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleChange('confidenceLevel', opt.value)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    confidenceLevel === opt.value
                      ? 'border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50'
                      : 'border-slate-300 hover:border-slate-400 bg-white'
                  }`}
                  title={opt.desc}
                >
                  <div className={`w-3 h-3 rounded-full ${opt.color}`} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1.5">
              <TrendingUp size={15} className="text-indigo-500" />
              Delivery Forecast
              <span className="text-red-400 text-xs">*</span>
            </label>
            <div className="relative">
              <select
                value={deliveryForecast}
                onChange={(e) => handleChange('deliveryForecast', e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white pr-10"
              >
                <option value="">Select forecast...</option>
                {FORECAST_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* Key Risks */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1.5">
            <AlertTriangle size={15} className="text-amber-500" />
            Key Risks / Blockers
            <span className="text-red-400 text-xs">*</span>
          </label>
          <textarea
            value={keyRisks}
            onChange={(e) => handleChange('keyRisks', e.target.value)}
            placeholder="e.g., 1. Backend API dependency not yet available&#10;2. Key developer on PTO next week&#10;3. QA environment instability"
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
          />
        </div>

        {/* Export Error */}
        {exportError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {exportError}
          </div>
        )}

        {/* Generate Report Button */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="text-xs text-slate-400">
            {allFieldsFilled
              ? 'All fields completed — ready to generate report'
              : 'Fill in all required fields (*) to enable report generation'}
          </div>
          <button
            onClick={handleExportPDF}
            disabled={!allFieldsFilled || exporting}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title={
              !allFieldsFilled
                ? 'Complete all required fields to generate the report'
                : 'Generate stakeholder report as PDF'
            }
          >
            {exporting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <FileDown size={16} />
            )}
            Generate Stakeholder Report
          </button>
        </div>
      </div>
    </div>
  );
}
