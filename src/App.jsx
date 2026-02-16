import { BarChart3, LayoutDashboard } from 'lucide-react';
import { SprintProvider, useSprint } from './context/SprintContext';
import DataInput from './components/DataInput';
import SummaryCards from './components/SummaryCards';
import CapacityGauges from './components/CapacityGauges';
import TeamLoadChart from './components/TeamLoadChart';
import RiskValueChart from './components/RiskValueChart';
import EpicDonutChart from './components/EpicDonutChart';
import SprintCutoffChart from './components/SprintCutoffChart';
import ExportPanel from './components/ExportPanel';

function Dashboard() {
  const { isLoaded } = useSprint();

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-lg">
                <BarChart3 size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">
                  Sprint Performance Dashboard
                </h1>
                <p className="text-xs text-slate-500 -mt-0.5">
                  Risk Analysis & Capacity Planning
                </p>
              </div>
            </div>
            {isLoaded && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <LayoutDashboard size={16} />
                <span>Planning Suite Active</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Data Input */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <DataInput />
            </div>
          </div>

          {/* Main Charts Area */}
          <div className="lg:col-span-3 space-y-6">
            {isLoaded ? (
              <>
                {/* Summary KPI Cards */}
                <SummaryCards />

                {/* Capacity Gauges */}
                <CapacityGauges />

                {/* Two-column layout for medium charts */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <TeamLoadChart />
                  <EpicDonutChart />
                </div>

                {/* Risk vs Value - full width */}
                <RiskValueChart />

                {/* Sprint Cut-off - full width */}
                <SprintCutoffChart />

                {/* Export Panel */}
                <ExportPanel />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl shadow-sm border border-slate-200">
                <BarChart3 size={48} className="text-slate-300 mb-4" />
                <h2 className="text-xl font-semibold text-slate-400">
                  No Data Loaded
                </h2>
                <p className="text-sm text-slate-400 mt-2 max-w-md text-center">
                  Upload an XML file or paste ticket data in the sidebar to
                  generate your sprint planning suite.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-xs text-slate-400 text-center">
            Sprint Performance & Risk Dashboard — Built with React, Tailwind CSS & Recharts
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <SprintProvider>
      <Dashboard />
    </SprintProvider>
  );
}
