import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import axios from 'axios';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  FileText, 
  BrainCircuit, 
  Download, 
  Copy, 
  Check, 
  TrendingUp, 
  AlertOctagon,
  Clock,
  Printer
} from 'lucide-react';

const Analytics = () => {
  const { API_BASE, loading } = useApp();

  // Chart data states
  const [utilizationData, setUtilizationData] = useState([]);
  const [peakHoursData, setPeakHoursData] = useState([]);
  const [wastageData, setWastageData] = useState([]);
  const [restockingData, setRestockingData] = useState([]);
  const [chartsLoading, setChartsLoading] = useState(true);

  // Report States
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportText, setReportText] = useState('');
  const [copied, setCopied] = useState(false);

  // Fetch charts telemetry data
  const fetchChartsData = async () => {
    try {
      setChartsLoading(true);
      const [uRes, pRes, wRes, rRes] = await Promise.all([
        axios.get(`${API_BASE}/analytics/utilization`),
        axios.get(`${API_BASE}/analytics/peak-hours`),
        axios.get(`${API_BASE}/analytics/wastage`),
        axios.get(`${API_BASE}/analytics/restocking`)
      ]);
      setUtilizationData(uRes.data);
      setPeakHoursData(pRes.data);
      setWastageData(wRes.data);
      setRestockingData(rRes.data);
    } catch (e) {
      console.error('Error fetching charts telemetry:', e);
    } finally {
      setChartsLoading(false);
    }
  };

  useEffect(() => {
    fetchChartsData();
  }, []);

  // Request AI CMD status report
  const handleGenerateReport = async () => {
    try {
      setGeneratingReport(true);
      setReportText('');
      const res = await axios.post(`${API_BASE}/analytics/report`);
      setReportText(res.data.report);
    } catch (err) {
      console.error(err);
      setReportText('Failed to generate operational report. Verify AI API models.');
    } finally {
      setGeneratingReport(false);
    }
  };

  // Copy report to clipboard
  const handleCopyReport = () => {
    if (!reportText) return;
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple Markdown parsing helper for clean UI formatting
  const renderFormattedReport = (markdown) => {
    return markdown.split('\n').map((line, idx) => {
      if (line.startsWith('# ')) {
        return <h2 key={idx} className="report-h1">{line.replace('# ', '')}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="report-h3">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('* **')) {
        return <p key={idx} className="report-bullet">{line}</p>;
      }
      if (line.startsWith('- ')) {
        return <li key={idx} className="report-li">{line.replace('- ', '')}</li>;
      }
      if (line.startsWith('**Generated on**')) {
        return <div key={idx} className="report-date-tag">{line}</div>;
      }
      if (line.trim() === '---') {
        return <hr key={idx} className="report-hr" />;
      }
      return <p key={idx} className="report-p">{line}</p>;
    });
  };

  // Custom tooltips styling for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-chart-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((p, idx) => (
            <p key={idx} className="tooltip-value" style={{ color: p.color || p.fill }}>
              {p.name}: <strong>{p.value}</strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="analytics-page-wrapper">
      {/* 1. Executive Summary & AI Report Panel */}
      <section className="report-generation-section glass-panel">
        <div className="report-prompt-row">
          <div className="prompt-left">
            <div className="prompt-icon-wrapper">
              <FileText className="file-icon" size={24} />
            </div>
            <div className="prompt-text">
              <h3>One-Click Plain English Executive Report</h3>
              <p>Compile a complete medical administration summary of current hospital resources, critical alert status, and clinical intake ratios. Powered by Decision Triage AI.</p>
            </div>
          </div>
          <button 
            onClick={handleGenerateReport} 
            disabled={generatingReport}
            className="btn-primary generate-report-btn"
          >
            <BrainCircuit size={16} className={generatingReport ? 'pulse-anim' : ''} />
            <span>{generatingReport ? 'Analyzing Dashboard Metrics...' : 'Generate Executive Report'}</span>
          </button>
        </div>

        {/* AI Report display card */}
        {(generatingReport || reportText) && (
          <div className="report-display-container glass-panel animate-slide">
            <div className="report-panel-header">
              <div className="header-badge">
                <BrainCircuit size={13} />
                <span>CMD EXECUTIVE STATUS</span>
              </div>
              <div className="report-actions">
                <button onClick={handleCopyReport} className="action-icon-btn" title="Copy to Clipboard">
                  {copied ? <Check size={14} className="text-green" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button onClick={() => window.print()} className="action-icon-btn" title="Print Report">
                  <Printer size={14} />
                  <span>Print</span>
                </button>
              </div>
            </div>

            {generatingReport ? (
              <div className="report-loading-state">
                <div className="loading-spinner"></div>
                <span>Synthesizing critical timelines, bed factors, and emergency metrics into text...</span>
              </div>
            ) : (
              <div className="report-text-scroll">
                {renderFormattedReport(reportText)}
              </div>
            )}
          </div>
        )}
      </section>

      {/* 2. Primary Analytics Charts Section */}
      <h3 className="section-subtitle">Operational Telemetry & Charts</h3>
      
      {chartsLoading ? (
        <div className="loading-charts-panel glass-panel">
          <div className="loading-spinner"></div>
          <span>Parsing historical update logs and aggregating data metrics...</span>
        </div>
      ) : (
        <div className="charts-grid-layout">
          {/* Chart 1: 7-Day Resource Utilization */}
          <div className="chart-card glass-panel">
            <div className="chart-header-row">
              <TrendingUp size={16} className="text-teal" />
              <h4>Resource Occupancy over 7 Days</h4>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={utilizationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIcu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorEr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorGeneral" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={36} fontSize={11} iconSize={8} />
                  <Area type="monotone" dataKey="ICU Beds (%)" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorIcu)" />
                  <Area type="monotone" dataKey="Emergency Beds (%)" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorEr)" />
                  <Area type="monotone" dataKey="General Beds (%)" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorGeneral)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Peak Demand Hours */}
          <div className="chart-card glass-panel">
            <div className="chart-header-row">
              <Clock size={16} className="text-cyan" />
              <h4>Peak Demand Hours (Allocations)</h4>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={peakHoursData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="hour" stroke="#64748b" fontSize={9} tickLine={false} interval={3} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Allocations Count" fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={30}>
                    {peakHoursData.map((entry, index) => {
                      // Highlight typical peak hours (e.g. afternoon or late night)
                      const isPeak = entry.hourNum >= 12 && entry.hourNum <= 18;
                      return <Cell key={`cell-${index}`} fill={isPeak ? '#06b6d4' : '#1e3a8a'} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Restocking Frequency */}
          <div className="chart-card glass-panel">
            <div className="chart-header-row">
              <TrendingUp size={16} className="text-blue" />
              <h4>Restocking Frequency (7 Days)</h4>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={restockingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={36} fontSize={11} iconSize={8} />
                  <Line type="monotone" dataKey="Medicines Replenished" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="Oxygen Cylinders" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="Blood Standby" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Wastage Rates */}
          <div className="chart-card glass-panel">
            <div className="chart-header-row">
              <AlertOctagon size={16} className="text-rose" />
              <h4>Wastage & Expiry Rates (Units)</h4>
            </div>
            <div className="chart-container pie-layout">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={wastageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {wastageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pie-legend-custom">
                {wastageData.map((entry, index) => (
                  <div key={index} className="pie-legend-item">
                    <span className="legend-dot" style={{ backgroundColor: entry.color }}></span>
                    <span className="legend-label">{entry.name}:</span>
                    <strong className="legend-val">{entry.value}u</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .analytics-page-wrapper {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .report-generation-section {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.04) 0%, rgba(99, 102, 241, 0.04) 100%);
          border-color: rgba(59, 130, 246, 0.15);
        }

        .report-prompt-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .prompt-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .prompt-icon-wrapper {
          width: 48px;
          height: 48px;
          background: rgba(59, 130, 246, 0.1);
          color: var(--accent-blue);
          border: 1px solid rgba(59, 130, 246, 0.25);
          border-radius: var(--border-radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .prompt-text h3 {
          font-size: 1.15rem;
          font-weight: 600;
        }

        .prompt-text p {
          font-size: 0.775rem;
          color: var(--text-secondary);
          max-width: 600px;
        }

        .generate-report-btn {
          font-size: 0.8rem;
          padding: 10px 16px;
        }

        .report-display-container {
          padding: 20px;
          background: var(--bg-tertiary);
          border-color: rgba(6, 182, 212, 0.15);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .report-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 12px;
        }

        .header-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.675rem;
          font-weight: 800;
          color: var(--accent-cyan);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border: 1px solid rgba(6, 182, 212, 0.2);
          background: rgba(6, 182, 212, 0.04);
          padding: 3px 8px;
          border-radius: 4px;
        }

        .report-actions {
          display: flex;
          gap: 8px;
        }

        .action-icon-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: var(--button-hover);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          font-size: 0.7rem;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .action-icon-btn:hover {
          background: var(--button-hover);
          color: var(--text-primary);
          border-color: var(--border-color);
        }

        .text-green {
          color: var(--status-sufficient);
        }

        .report-loading-state {
          padding: 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          color: var(--text-muted);
          font-size: 0.8rem;
          text-align: center;
        }

        .report-text-scroll {
          max-height: 400px;
          overflow-y: auto;
          padding-right: 8px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* Generated markdown report styling */
        .report-h1 {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .report-h3 {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--accent-cyan);
          text-transform: uppercase;
          letter-spacing: 0.025em;
          margin-top: 10px;
        }

        .report-p {
          font-size: 0.775rem;
          line-height: 1.5;
          color: var(--text-primary);
        }

        .report-bullet {
          font-size: 0.775rem;
          line-height: 1.5;
          color: var(--text-secondary);
          padding-left: 12px;
          border-left: 2px solid var(--border-color);
        }

        .report-li {
          font-size: 0.775rem;
          color: var(--text-secondary);
          list-style-type: square;
          margin-left: 16px;
        }

        .report-date-tag {
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        .report-hr {
          border: none;
          border-top: 1px solid var(--border-color);
        }

        /* Charts grid list */
        .charts-grid-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .chart-card {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .chart-header-row {
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          padding-bottom: 10px;
        }

        .chart-header-row h4 {
          font-size: 0.9rem;
          font-weight: 600;
        }

        .text-teal { color: var(--status-sufficient); }
        .text-cyan { color: var(--accent-cyan); }
        .text-blue { color: var(--accent-blue); }
        .text-rose { color: var(--status-critical); }

        .chart-container {
          width: 100%;
        }

        .chart-container.pie-layout {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          height: 260px;
        }

        .pie-legend-custom {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 50%;
        }

        .pie-legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.7rem;
          color: var(--text-secondary);
        }

        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .legend-label {
          color: var(--text-muted);
          flex-grow: 1;
        }

        .legend-val {
          color: var(--text-primary);
        }

        /* Custom Recharts Tooltip styling */
        .custom-chart-tooltip {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          padding: 8px 12px;
          box-shadow: var(--shadow-md);
        }

        .tooltip-label {
          font-size: 0.725rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .tooltip-value {
          font-size: 0.7rem;
          margin-bottom: 2px;
        }

        .loading-charts-panel {
          padding: 100px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          color: var(--text-muted);
          font-size: 0.85rem;
        }

        @media (max-width: 900px) {
          .charts-grid-layout {
            grid-template-columns: 1fr;
          }
          .chart-container.pie-layout {
            flex-direction: column;
            height: auto;
            gap: 12px;
          }
          .pie-legend-custom {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default Analytics;
