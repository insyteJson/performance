import { useState } from 'react';
import { BarChart3, LayoutDashboard, Upload, Users, Table2 } from 'lucide-react';
import { SprintProvider, useSprint } from './context/SprintContext';
import DataInput from './components/DataInput';
import TeamManagement from './components/TeamManagement';
import SummaryCards from './components/SummaryCards';
import CapacityGauges from './components/CapacityGauges';
import TeamLoadChart from './components/TeamLoadChart';
import RiskValueChart from './components/RiskValueChart';
import EpicDonutChart from './components/EpicDonutChart';
import SprintCutoffChart from './components/SprintCutoffChart';
import ExportPanel from './components/ExportPanel';
import TicketTable from './components/TicketTable';

function Dashboard() {
  const { isLoaded, devs, userStories } = useSprint();
  const [sidebarTab, setSidebarTab] = useState('import');
  const [view, setView] = useState('dashboard');

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
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setView('dashboard')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    view === 'dashboard'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <LayoutDashboard size={15} />
                  Dashboard
                </button>
                <button
                  onClick={() => setView('tickets')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    view === 'tickets'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Table2 size={15} />
                  Tickets
                  {userStories.length > 0 && (
                    <span className="text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                      {userStories.length}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'tickets' && isLoaded ? (
          /* Full-width Ticket Table view */
          <TicketTable />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr] gap-6 lg:gap-8">
            {/* Sidebar */}
            <div className="min-w-0">
              <div className="sticky top-24 flex flex-col max-h-[calc(100vh-7rem)] overflow-hidden">
                {/* Sidebar tab switcher */}
                <div className="flex bg-white rounded-t-xl border border-b-0 border-slate-200 overflow-hidden">
                  <button
                    onClick={() => setSidebarTab('import')}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors ${
                      sidebarTab === 'import'
                        ? 'text-indigo-600 bg-indigo-50/60 border-b-2 border-indigo-600'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Upload size={15} />
                    Import
                  </button>
                  <button
                    onClick={() => setSidebarTab('team')}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors ${
                      sidebarTab === 'team'
                        ? 'text-indigo-600 bg-indigo-50/60 border-b-2 border-indigo-600'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Users size={15} />
                    Team{devs.length > 0 ? ` (${devs.length})` : ''}
                  </button>
                </div>

                {/* Sidebar content — scrollable */}
                <div className="overflow-y-auto overflow-x-hidden flex-1 min-h-0">
                  {sidebarTab === 'import' ? <DataInput /> : <TeamManagement />}
                </div>
              </div>
            </div>

            {/* Main Charts Area */}
            <div className="min-w-0 space-y-6">
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
        )}
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
