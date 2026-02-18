import { useState, useRef } from 'react';
import { Upload, FileText, ChevronRight, ChevronDown } from 'lucide-react';
import { useSprint } from '../context/SprintContext';
import { parseXML, parseText } from '../utils/xmlParser';

function ImportSection({ title, description, onImport, loadedCount, collapsible = false, defaultOpen = true }) {
  const [activeTab, setActiveTab] = useState('xml');
  const [textInput, setTextInput] = useState('');
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = parseXML(event.target.result);
        if (parsed.length === 0) {
          setError('No tickets found in the XML file. Check the format.');
          return;
        }
        onImport(parsed);
      } catch (err) {
        setError(err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleTextParse = () => {
    setError('');
    try {
      const parsed = parseText(textInput);
      if (parsed.length === 0) {
        setError(
          'No tickets parsed. Use format: KEY, Summary, Priority, Assignee, Hours, Epic'
        );
        return;
      }
      onImport(parsed);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      {/* Section Header */}
      <div
        className={`px-6 py-4 border-b border-slate-200 ${collapsible ? 'cursor-pointer hover:bg-slate-50' : ''}`}
        onClick={collapsible ? () => setIsOpen(!isOpen) : undefined}
      >
        <div className="flex items-center gap-2">
          {collapsible && (
            isOpen
              ? <ChevronDown size={16} className="text-slate-400" />
              : <ChevronRight size={16} className="text-slate-400" />
          )}
          <div>
            <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{description}</p>
          </div>
        </div>
      </div>

      {isOpen && (
        <>
          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('xml')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'xml'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Upload size={16} className="inline mr-2 -mt-0.5" />
              XML Upload
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'text'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <FileText size={16} className="inline mr-2 -mt-0.5" />
              Plain Text
            </button>
          </div>

          {/* Input Area */}
          <div className="p-6">
            {activeTab === 'xml' ? (
              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors"
                >
                  <Upload size={32} className="mx-auto text-slate-400 mb-3" />
                  <p className="text-sm font-medium text-slate-600">
                    Click to upload XML file
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Jira RSS/XML export format
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xml"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={`Paste ticket data (one per line):\nKEY, Summary, Priority, Assignee, Hours, Epic\n\nExample:\nPROJ-1, Build login page, High, Alice, 8, Auth\nPROJ-2, Fix bug #42, Highest, Bob, 4, Bugfix`}
                  className="w-full h-40 p-3 border border-slate-300 rounded-lg text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  onClick={handleTextParse}
                  className="w-full py-2.5 px-4 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Parse Tickets
                </button>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            {loadedCount > 0 && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
                {loadedCount} tickets loaded successfully
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function DataInput() {
  const { setTickets, setPreviousSprintTickets, tickets, previousSprintTickets } = useSprint();

  const handleLoadSample = () => {
    const sampleXML = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="0.92">
<channel>
<item>
  <key>PROJ-101</key>
  <summary>Implement user authentication flow</summary>
  <type>Story</type>
  <priority>Highest</priority>
  <status>In Progress</status>
  <assignee>Alice Chen</assignee>
  <reporter>PM Team</reporter>
  <timeoriginalestimate>28800</timeoriginalestimate>
  <timeestimate>18000</timeestimate>
  <timespent>10800</timespent>
  <label>customer</label>
  <customfield><customfieldname>Epic Link</customfieldname><customfieldvalue>Auth Overhaul</customfieldvalue></customfield>
</item>
<item>
  <key>PROJ-102</key>
  <summary>Fix payment gateway timeout errors</summary>
  <type>Bug</type>
  <priority>Highest</priority>
  <status>In Progress</status>
  <assignee>Bob Kumar</assignee>
  <reporter>Support</reporter>
  <timeoriginalestimate>21600</timeoriginalestimate>
  <timeestimate>7200</timeestimate>
  <timespent>14400</timespent>
  <label>customer-request</label>
  <customfield><customfieldname>Epic Link</customfieldname><customfieldvalue>Payments</customfieldvalue></customfield>
</item>
<item>
  <key>PROJ-103</key>
  <summary>Dashboard performance optimization</summary>
  <type>Task</type>
  <priority>High</priority>
  <status>In Progress</status>
  <assignee>Alice Chen</assignee>
  <reporter>Tech Lead</reporter>
  <timeoriginalestimate>36000</timeoriginalestimate>
  <timeestimate>25200</timeestimate>
  <timespent>10800</timespent>
  <customfield><customfieldname>Epic Link</customfieldname><customfieldvalue>Performance</customfieldvalue></customfield>
</item>
<item>
  <key>PROJ-104</key>
  <summary>Add CSV export to reports module</summary>
  <type>Story</type>
  <priority>High</priority>
  <status>Open</status>
  <assignee>Carol Davis</assignee>
  <reporter>Product</reporter>
  <timeoriginalestimate>14400</timeoriginalestimate>
  <timeestimate>14400</timeestimate>
  <timespent>0</timespent>
  <label>client-request</label>
  <customfield><customfieldname>Epic Link</customfieldname><customfieldvalue>Reporting</customfieldvalue></customfield>
</item>
<item>
  <key>PROJ-105</key>
  <summary>Refactor notification service</summary>
  <type>Task</type>
  <priority>High</priority>
  <status>In Progress</status>
  <assignee>Bob Kumar</assignee>
  <reporter>Tech Lead</reporter>
  <timeoriginalestimate>28800</timeoriginalestimate>
  <timeestimate>21600</timeestimate>
  <timespent>7200</timespent>
  <customfield><customfieldname>Epic Link</customfieldname><customfieldvalue>Notifications</customfieldvalue></customfield>
</item>
<item>
  <key>PROJ-106</key>
  <summary>Redesign settings page UI</summary>
  <type>Story</type>
  <priority>High</priority>
  <status>In Progress</status>
  <assignee>Diana Park</assignee>
  <reporter>Design</reporter>
  <timeoriginalestimate>21600</timeoriginalestimate>
  <timeestimate>14400</timeestimate>
  <timespent>7200</timespent>
  <customfield><customfieldname>Epic Link</customfieldname><customfieldvalue>UI Refresh</customfieldvalue></customfield>
</item>
<item>
  <key>PROJ-107</key>
  <summary>API rate limiting implementation</summary>
  <type>Task</type>
  <priority>Highest</priority>
  <status>Open</status>
  <assignee>Carol Davis</assignee>
  <reporter>Security</reporter>
  <timeoriginalestimate>36000</timeoriginalestimate>
  <timeestimate>36000</timeestimate>
  <timespent>0</timespent>
  <customfield><customfieldname>Epic Link</customfieldname><customfieldvalue>Security</customfieldvalue></customfield>
</item>
<item>
  <key>PROJ-108</key>
  <summary>Mobile responsive email templates</summary>
  <type>Story</type>
  <priority>Low</priority>
  <status>Open</status>
  <assignee>Diana Park</assignee>
  <reporter>Marketing</reporter>
  <timeoriginalestimate>14400</timeoriginalestimate>
  <timeestimate>14400</timeestimate>
  <timespent>0</timespent>
  <label>external</label>
  <customfield><customfieldname>Epic Link</customfieldname><customfieldvalue>Emails</customfieldvalue></customfield>
</item>
<item>
  <key>PROJ-109</key>
  <summary>Update dependency versions</summary>
  <type>Task</type>
  <priority>Low</priority>
  <status>Resolved</status>
  <assignee>Alice Chen</assignee>
  <reporter>Tech Lead</reporter>
  <timeoriginalestimate>7200</timeoriginalestimate>
  <timeestimate>0</timeestimate>
  <timespent>5400</timespent>
  <customfield><customfieldname>Epic Link</customfieldname><customfieldvalue>Maintenance</customfieldvalue></customfield>
</item>
<item>
  <key>PROJ-110</key>
  <summary>Write integration tests for checkout</summary>
  <type>Task</type>
  <priority>High</priority>
  <status>In Progress</status>
  <assignee>Bob Kumar</assignee>
  <reporter>QA</reporter>
  <timeoriginalestimate>18000</timeoriginalestimate>
  <timeestimate>10800</timeestimate>
  <timespent>7200</timespent>
  <customfield><customfieldname>Epic Link</customfieldname><customfieldvalue>Payments</customfieldvalue></customfield>
</item>
<item>
  <key>PROJ-111</key>
  <summary>Explore GraphQL migration</summary>
  <type>Spike</type>
  <priority>Lowest</priority>
  <status>Open</status>
  <assignee>Carol Davis</assignee>
  <reporter>Tech Lead</reporter>
  <timeoriginalestimate>14400</timeoriginalestimate>
  <timeestimate>14400</timeestimate>
  <timespent>0</timespent>
  <customfield><customfieldname>Epic Link</customfieldname><customfieldvalue>Architecture</customfieldvalue></customfield>
</item>
<item>
  <key>PROJ-112</key>
  <summary>Dark mode theme support</summary>
  <type>Story</type>
  <priority>Low</priority>
  <status>Open</status>
  <assignee>Diana Park</assignee>
  <reporter>Product</reporter>
  <timeoriginalestimate>21600</timeoriginalestimate>
  <timeestimate>21600</timeestimate>
  <timespent>0</timespent>
  <label>customer</label>
  <customfield><customfieldname>Epic Link</customfieldname><customfieldvalue>UI Refresh</customfieldvalue></customfield>
</item>
<item>
  <key>PROJ-113</key>
  <summary>Implement webhook retry logic</summary>
  <type>Task</type>
  <priority>High</priority>
  <status>Open</status>
  <assignee>Alice Chen</assignee>
  <reporter>Tech Lead</reporter>
  <timeoriginalestimate>14400</timeoriginalestimate>
  <timeestimate>14400</timeestimate>
  <timespent>0</timespent>
  <customfield><customfieldname>Epic Link</customfieldname><customfieldvalue>Integrations</customfieldvalue></customfield>
</item>
<item>
  <key>PROJ-114</key>
  <summary>Audit log viewer for admins</summary>
  <type>Story</type>
  <priority>Lowest</priority>
  <status>Open</status>
  <assignee>Bob Kumar</assignee>
  <reporter>Compliance</reporter>
  <timeoriginalestimate>28800</timeoriginalestimate>
  <timeestimate>28800</timeestimate>
  <timespent>0</timespent>
  <customfield><customfieldname>Epic Link</customfieldname><customfieldvalue>Security</customfieldvalue></customfield>
</item>
<item>
  <key>PROJ-115</key>
  <summary>Onboarding wizard improvements</summary>
  <type>Story</type>
  <priority>High</priority>
  <status>In Progress</status>
  <assignee>Diana Park</assignee>
  <reporter>Product</reporter>
  <timeoriginalestimate>28800</timeoriginalestimate>
  <timeestimate>18000</timeestimate>
  <timespent>10800</timespent>
  <label>customer-request</label>
  <customfield><customfieldname>Epic Link</customfieldname><customfieldvalue>Onboarding</customfieldvalue></customfield>
</item>
</channel>
</rss>`;
    try {
      const parsed = parseXML(sampleXML);
      setTickets(parsed);
    } catch {
      // sample data should always parse successfully
    }
  };

  return (
    <div className="bg-white rounded-b-xl shadow-sm border border-slate-200">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800">Data Input</h2>
        <p className="text-sm text-slate-500 mt-1">
          Upload XML or paste ticket data to begin
        </p>
      </div>

      {/* Upcoming Sprint Import */}
      <ImportSection
        title="Upcoming Sprint"
        description="Tickets for the next sprint — shown in all charts and tables"
        onImport={setTickets}
        loadedCount={tickets.length}
      />

      {/* Sample Data Button */}
      <div className="px-6 pb-4">
        <button
          onClick={handleLoadSample}
          className="w-full py-2.5 px-4 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
        >
          Load Sample Data (15 tickets, 4 devs)
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-200" />

      {/* Previous Sprint Import */}
      <ImportSection
        title="Previous Sprint"
        description="Stored for upcoming features — not shown in charts or tables"
        onImport={setPreviousSprintTickets}
        loadedCount={previousSprintTickets.length}
        collapsible
        defaultOpen={false}
      />
    </div>
  );
}
