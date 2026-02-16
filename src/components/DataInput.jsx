import { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Plus,
  Trash2,
  UserPlus,
  Edit3,
  Check,
  X,
} from 'lucide-react';
import { useSprint } from '../context/SprintContext';
import { parseXML, parseText } from '../utils/xmlParser';

export default function DataInput() {
  const { setTickets, devs, addDev, updateDevCapacity, removeDev, tickets } =
    useSprint();
  const [activeTab, setActiveTab] = useState('xml');
  const [textInput, setTextInput] = useState('');
  const [error, setError] = useState('');
  const [newDevName, setNewDevName] = useState('');
  const [editingDev, setEditingDev] = useState(null);
  const [editCapacity, setEditCapacity] = useState('');
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
        setTickets(parsed);
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
      setTickets(parsed);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddDev = () => {
    if (!newDevName.trim()) return;
    addDev({ name: newDevName.trim() });
    setNewDevName('');
  };

  const startEdit = (dev) => {
    setEditingDev(dev.name);
    setEditCapacity(String(dev.capacity));
  };

  const saveEdit = () => {
    if (editingDev) {
      updateDevCapacity(editingDev, parseFloat(editCapacity) || 40);
      setEditingDev(null);
      setEditCapacity('');
    }
  };

  const handleLoadSample = () => {
    const sampleXML = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="0.92">
<channel>
<item>
  <key>PROJ-101</key>
  <summary>Implement user authentication flow</summary>
  <type>Story</type>
  <priority>Highest</priority>
  <status>Open</status>
  <assignee>Alice Chen</assignee>
  <reporter>PM Team</reporter>
  <timeoriginalestimate>28800</timeoriginalestimate>
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
  <label>customer-request</label>
  <customfield><customfieldname>Epic Link</customfieldname><customfieldvalue>Payments</customfieldvalue></customfield>
</item>
<item>
  <key>PROJ-103</key>
  <summary>Dashboard performance optimization</summary>
  <type>Task</type>
  <priority>High</priority>
  <status>Open</status>
  <assignee>Alice Chen</assignee>
  <reporter>Tech Lead</reporter>
  <timeoriginalestimate>36000</timeoriginalestimate>
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
  <label>client-request</label>
  <customfield><customfieldname>Epic Link</customfieldname><customfieldvalue>Reporting</customfieldvalue></customfield>
</item>
<item>
  <key>PROJ-105</key>
  <summary>Refactor notification service</summary>
  <type>Task</type>
  <priority>High</priority>
  <status>Open</status>
  <assignee>Bob Kumar</assignee>
  <reporter>Tech Lead</reporter>
  <timeoriginalestimate>28800</timeoriginalestimate>
  <customfield><customfieldname>Epic Link</customfieldname><customfieldvalue>Notifications</customfieldvalue></customfield>
</item>
<item>
  <key>PROJ-106</key>
  <summary>Redesign settings page UI</summary>
  <type>Story</type>
  <priority>High</priority>
  <status>Open</status>
  <assignee>Diana Park</assignee>
  <reporter>Design</reporter>
  <timeoriginalestimate>21600</timeoriginalestimate>
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
  <label>external</label>
  <customfield><customfieldname>Epic Link</customfieldname><customfieldvalue>Emails</customfieldvalue></customfield>
</item>
<item>
  <key>PROJ-109</key>
  <summary>Update dependency versions</summary>
  <type>Task</type>
  <priority>Low</priority>
  <status>Open</status>
  <assignee>Alice Chen</assignee>
  <reporter>Tech Lead</reporter>
  <timeoriginalestimate>7200</timeoriginalestimate>
  <customfield><customfieldname>Epic Link</customfieldname><customfieldvalue>Maintenance</customfieldvalue></customfield>
</item>
<item>
  <key>PROJ-110</key>
  <summary>Write integration tests for checkout</summary>
  <type>Task</type>
  <priority>High</priority>
  <status>Open</status>
  <assignee>Bob Kumar</assignee>
  <reporter>QA</reporter>
  <timeoriginalestimate>18000</timeoriginalestimate>
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
  <customfield><customfieldname>Epic Link</customfieldname><customfieldvalue>Security</customfieldvalue></customfield>
</item>
<item>
  <key>PROJ-115</key>
  <summary>Onboarding wizard improvements</summary>
  <type>Story</type>
  <priority>High</priority>
  <status>Open</status>
  <assignee>Diana Park</assignee>
  <reporter>Product</reporter>
  <timeoriginalestimate>28800</timeoriginalestimate>
  <label>customer-request</label>
  <customfield><customfieldname>Epic Link</customfieldname><customfieldvalue>Onboarding</customfieldvalue></customfield>
</item>
</item>
</channel>
</rss>`;
    try {
      const parsed = parseXML(sampleXML);
      setTickets(parsed);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800">Data Input</h2>
        <p className="text-sm text-slate-500 mt-1">
          Upload XML or paste ticket data to begin
        </p>
      </div>

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
            <button
              onClick={handleLoadSample}
              className="w-full py-2.5 px-4 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              Load Sample Data (15 tickets, 4 devs)
            </button>
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

        {tickets.length > 0 && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
            {tickets.length} tickets loaded successfully
          </div>
        )}
      </div>

      {/* DEV Management */}
      <div className="border-t border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <UserPlus size={16} />
          Team Members (DEVs)
        </h3>

        {devs.length > 0 && (
          <div className="space-y-2 mb-4">
            {devs.map((dev) => (
              <div
                key={dev.name}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <span className="text-sm font-medium text-slate-700">
                  {dev.name}
                </span>
                <div className="flex items-center gap-2">
                  {editingDev === dev.name ? (
                    <>
                      <input
                        type="number"
                        value={editCapacity}
                        onChange={(e) => setEditCapacity(e.target.value)}
                        className="w-20 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                      />
                      <span className="text-xs text-slate-500">hrs</span>
                      <button
                        onClick={saveEdit}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => setEditingDev(null)}
                        className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-sm text-slate-500">
                        {dev.capacity}h
                      </span>
                      <button
                        onClick={() => startEdit(dev)}
                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => removeDev(dev.name)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={newDevName}
            onChange={(e) => setNewDevName(e.target.value)}
            placeholder="Add team member..."
            className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            onKeyDown={(e) => e.key === 'Enter' && handleAddDev()}
          />
          <button
            onClick={handleAddDev}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-1"
          >
            <Plus size={16} />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
