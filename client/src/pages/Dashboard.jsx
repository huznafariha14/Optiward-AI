import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import ResourceCard from '../components/dashboard/ResourceCard';
import { 
  ShieldAlert, 
  Activity, 
  Search, 
  Hospital,
  AlertTriangle,
  UserCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Lightweight, visually premium SVG-based Sparkline mini-chart component
const Sparkline = ({ data, color }) => {
  if (!data || data.length === 0) return null;
  
  const width = 60;
  const height = 26;
  const padding = 4;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;
  
  const points = data.map((val, index) => {
    const x = padding + (index * (width - padding * 2)) / (data.length - 1);
    const y = height - padding - ((val - min) * (height - padding * 2)) / range;
    return `${x},${y}`;
  }).join(' ');
  
  const firstX = padding;
  const lastX = width - padding;
  const fillPoints = `${firstX},${height} ${points} ${lastX},${height}`;
  
  const gradientId = React.useId ? React.useId() : `spark-grad-${Math.random()}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="kpi-sparkline">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      
      {/* Area Under Path */}
      <polygon
        points={fillPoints}
        fill={`url(#${gradientId})`}
      />
      
      {/* Stroke Path */}
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      
      {/* Pulsing End Dot */}
      {data.length > 0 && (() => {
        const lastVal = data[data.length - 1];
        const lastX = padding + ((data.length - 1) * (width - padding * 2)) / (data.length - 1);
        const lastY = height - padding - ((lastVal - min) * (height - padding * 2)) / range;
        return (
          <circle
            cx={lastX}
            cy={lastY}
            r="2"
            fill={color}
            className="sparkline-dot"
          />
        );
      })()}
    </svg>
  );
};

const Dashboard = ({ onQuickUpdateClick }) => {
  const { resources, alerts, loading, selectedDepartment } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChip, setSelectedChip] = useState('All types');
  const [isAlertFeedExpanded, setIsAlertFeedExpanded] = useState(true);

  // 1. Client-Side Department Filter (Soft transition without full API refetch flickers)
  const departmentFilteredResources = selectedDepartment === 'All'
    ? resources
    : resources.filter(r => r.department === selectedDepartment);

  // 2. Calculations for upper KPI panel (Scoped to selected department)
  const criticalAlertsCount = alerts.filter(a => 
    a.severity === 'critical' && 
    (selectedDepartment === 'All' || a.department === selectedDepartment || resources.find(r => r.id === a.resourceId)?.department === selectedDepartment)
  ).length;

  const warningAlertsCount = alerts.filter(a => 
    a.severity === 'warning' && 
    (selectedDepartment === 'All' || a.department === selectedDepartment || resources.find(r => r.id === a.resourceId)?.department === selectedDepartment)
  ).length;

  const icuBed = departmentFilteredResources.find(r => r.subType === 'ICU' && r.type === 'beds');
  const icuOccupancy = icuBed ? Math.round(((icuBed.totalCapacity - icuBed.currentCount) / icuBed.totalCapacity) * 100) : 0;

  const erBed = departmentFilteredResources.find(r => r.subType === 'Emergency' && r.type === 'beds');
  const erOccupancy = erBed ? Math.round(((erBed.totalCapacity - erBed.currentCount) / erBed.totalCapacity) * 100) : 0;

  const activeStaffResources = departmentFilteredResources.filter(r => r.type === 'staff');
  const staffCount = activeStaffResources.reduce((sum, r) => sum + r.currentCount, 0);

  // 3. Search and Chip Type Filters
  const filteredResources = departmentFilteredResources.filter(r => {
    // Search input query
    const matchesSearch = searchQuery === '' || 
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.subType.toLowerCase().includes(searchQuery.toLowerCase());
      
    // Quick inline filter chip selection
    let matchesChip = true;
    if (selectedChip === 'Beds') {
      matchesChip = r.type === 'beds';
    } else if (selectedChip === 'Oxygen') {
      matchesChip = r.type === 'oxygen';
    } else if (selectedChip === 'Staff') {
      matchesChip = r.type === 'staff';
    } else if (selectedChip === 'Equipment') {
      matchesChip = r.type === 'equipment' || r.type === 'ventilators';
    }
    
    return matchesSearch && matchesChip;
  });

  // Relative Time Helper
  const formatRelativeTime = (timestamp) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filterChips = [
    { id: 'All types', label: 'All types' },
    { id: 'Beds', label: 'Beds' },
    { id: 'Oxygen', label: 'Oxygen' },
    { id: 'Staff', label: 'Staff' },
    { id: 'Equipment', label: 'Equipment' }
  ];

  // Scoped alerts list for the Alert Feed Widget
  const filteredAlerts = alerts.filter(a => {
    if (selectedDepartment === 'All') return true;
    if (a.department === selectedDepartment) return true;
    const res = resources.find(r => r.id === a.resourceId);
    return res && res.department === selectedDepartment;
  });

  return (
    <div className="dashboard-page-wrapper">
      {/* 1. Upper KPI Section with Embedded Sparklines */}
      <section className="kpi-cards-grid">
        {/* KPI Card 1: Active Shortages */}
        <div className={`kpi-card glass-panel ${criticalAlertsCount > 0 ? 'pulse-rose-glow critical-border' : ''}`}>
          <div className="kpi-icon-wrapper red">
            <ShieldAlert size={20} />
          </div>
          <div className="kpi-text-info">
            <span className="kpi-label">Active AI Shortages</span>
            <div className="kpi-value-row">
              <span className="kpi-value-large text-red">{criticalAlertsCount}</span>
              <span className="kpi-value-sub">Critical / {warningAlertsCount} Warn</span>
            </div>
          </div>
          <Sparkline data={[5, 4, 6, 3, 2, 4, criticalAlertsCount]} color="var(--status-critical)" />
        </div>

        {/* KPI Card 2: ICU Occupancy */}
        <div className="kpi-card glass-panel">
          <div className="kpi-icon-wrapper teal">
            <Activity size={20} />
          </div>
          <div className="kpi-text-info">
            <span className="kpi-label">ICU Bed Occupancy</span>
            <div className="kpi-value-row">
              <span className="kpi-value-large">{icuOccupancy}%</span>
              <span className="kpi-value-sub">
                {icuBed ? `${icuBed.totalCapacity - icuBed.currentCount}/${icuBed.totalCapacity} Beds` : 'N/A'}
              </span>
            </div>
          </div>
          <Sparkline data={[75, 78, 82, 80, 85, 88, icuOccupancy]} color="#14b8a6" />
        </div>

        {/* KPI Card 3: ER Occupancy */}
        <div className="kpi-card glass-panel">
          <div className="kpi-icon-wrapper blue">
            <Hospital size={20} />
          </div>
          <div className="kpi-text-info">
            <span className="kpi-label">ER Bed Occupancy</span>
            <div className="kpi-value-row">
              <span className="kpi-value-large">{erOccupancy}%</span>
              <span className="kpi-value-sub">
                {erBed ? `${erBed.totalCapacity - erBed.currentCount}/${erBed.totalCapacity} Beds` : 'N/A'}
              </span>
            </div>
          </div>
          <Sparkline data={[50, 58, 62, 55, 68, 70, erOccupancy]} color="var(--accent-blue)" />
        </div>

        {/* KPI Card 4: Active Staff on Duty */}
        <div className="kpi-card glass-panel">
          <div className="kpi-icon-wrapper purple">
            <UserCheck size={20} />
          </div>
          <div className="kpi-text-info">
            <span className="kpi-label">Active Staff on Duty</span>
            <div className="kpi-value-row">
              <span className="kpi-value-large">{staffCount}</span>
              <span className="kpi-value-sub">Clinicians Active</span>
            </div>
          </div>
          <Sparkline data={[52, 55, 54, 56, 58, 60, staffCount]} color="#a78bfa" />
        </div>
      </section>

      {/* 2. Operations Search & Inline Quick-Filters */}
      <section className="search-filter-wrapper-container glass-panel">
        <div className="search-filter-header-row">
          <div className="search-input-group">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search resources by name, type, or ward..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="live-pill">
            <span className="live-dot pulse-emerald"></span>
            <span className="live-text">LIVE REAL-TIME SYNC</span>
          </div>
        </div>
        
        {/* Quick-Filter Chips */}
        <div className="quick-filter-chips-row">
          {filterChips.map(chip => {
            const isActive = selectedChip === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setSelectedChip(chip.id)}
                className={`filter-chip ${isActive ? 'active' : ''}`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Severity Timeline & Alert Feed (Collapsible Widget) */}
      <section className="alert-ticker-container glass-panel">
        <div 
          className="alert-ticker-header" 
          onClick={() => setIsAlertFeedExpanded(!isAlertFeedExpanded)}
          role="button"
          title={isAlertFeedExpanded ? "Collapse Alert Feed" : "Expand Alert Feed"}
        >
          <div className="ticker-header-left">
            <div className={`ticker-live-indicator ${filteredAlerts.length > 0 ? 'alerting' : ''}`}>
              <span className="live-dot pulse-emerald"></span>
            </div>
            <span className="ticker-title-text">
              REAL-TIME SEVERITY TIMELINE & ALERT FEED
            </span>
            <span className="ticker-count-badge">
              {filteredAlerts.length} Active AI Alarms
            </span>
          </div>
          <button className="ticker-toggle-btn" aria-label="Toggle Alert Feed">
            {isAlertFeedExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {isAlertFeedExpanded && (
          <div className="alert-ticker-body animate-slide-down">
            {filteredAlerts.length === 0 ? (
              <div className="alert-ticker-empty">
                <span className="empty-ticker-dot"></span>
                <span className="empty-ticker-text">
                  All clinical inventory in the {selectedDepartment === 'All' ? 'clinical network' : `${selectedDepartment} ward`} is operating within safe parameters. No shortage models triggered.
                </span>
              </div>
            ) : (
              <div className="alert-ticker-list">
                {filteredAlerts.slice(0, 4).map(alert => (
                  <div key={alert.id} className={`alert-ticker-item ${alert.severity}`}>
                    <span className="alert-item-time">{formatRelativeTime(alert.timestamp)}</span>
                    <span className="alert-item-bullet">·</span>
                    <span className="alert-item-message">
                      <span className="alert-badge-label">{alert.severity.toUpperCase()}</span>: {alert.subType} {alert.resourceType} &mdash; {alert.message}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* 4. Main Resource Cards Grid */}
      {loading.resources ? (
        <div className="loading-state-wrapper glass-panel">
          <div className="loading-spinner"></div>
          <span>Synchronizing live inventory from the clinical network...</span>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="empty-state-wrapper glass-panel">
          <AlertTriangle size={48} className="empty-icon" />
          <h3>No matching resources found</h3>
          <p>We couldn't find any resources matching your search queries in this ward.</p>
        </div>
      ) : (
        <section className="dashboard-grid">
          {filteredResources.map(resource => (
            <ResourceCard 
              key={resource.id} 
              resource={resource} 
              onQuickUpdateClick={onQuickUpdateClick}
            />
          ))}
        </section>
      )}

      <style>{`
        .dashboard-page-wrapper {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .kpi-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
        }

        .kpi-card {
          padding: 16px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          position: relative;
        }

        .kpi-card.critical-border {
          border-color: rgba(244, 63, 94, 0.4);
        }

        .kpi-icon-wrapper {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.05);
          flex-shrink: 0;
        }

        .kpi-icon-wrapper.red {
          background: rgba(244, 63, 94, 0.08);
          color: var(--status-critical);
          border-color: rgba(244, 63, 94, 0.15);
        }

        .kpi-icon-wrapper.teal {
          background: rgba(20, 184, 166, 0.08);
          color: #14b8a6;
          border-color: rgba(20, 184, 166, 0.15);
        }

        .kpi-icon-wrapper.blue {
          background: rgba(59, 130, 246, 0.08);
          color: var(--accent-blue);
          border-color: rgba(59, 130, 246, 0.15);
        }

        .kpi-icon-wrapper.purple {
          background: rgba(139, 92, 246, 0.08);
          color: #a78bfa;
          border-color: rgba(139, 92, 246, 0.15);
        }

        .kpi-text-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex-grow: 1;
        }

        .kpi-label {
          font-size: 0.725rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 700;
        }

        .kpi-value-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .kpi-value-large {
          font-family: 'Outfit', sans-serif;
          font-size: 1.35rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.1;
        }

        .kpi-value-large.text-red {
          color: var(--status-critical);
        }

        .kpi-value-sub {
          font-size: 0.7rem;
          color: var(--text-secondary);
          line-height: 1.2;
        }

        .kpi-sparkline {
          flex-shrink: 0;
          margin-left: 2px;
          margin-right: 2px;
          overflow: visible;
        }

        .sparkline-dot {
          animation: pulse-dot 1.5s infinite;
        }

        @keyframes pulse-dot {
          0% { r: 2; opacity: 1; }
          50% { r: 3.5; opacity: 0.5; }
          100% { r: 2; opacity: 1; }
        }

        /* Search Filter Container Overhaul */
        .search-filter-wrapper-container {
          padding: 16px 20px;
          background: var(--bg-card);
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .search-filter-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          width: 100%;
        }

        .search-input-group {
          position: relative;
          width: 400px;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 14px;
          color: var(--text-muted);
        }

        .search-input {
          width: 100%;
          padding: 10px 16px 10px 42px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: 9999px;
          font-size: 0.85rem;
          transition: all var(--transition-fast);
        }

        .search-input:focus {
          background: var(--bg-secondary);
          border-color: var(--accent-cyan);
          outline: none;
          box-shadow: 0 0 0 3px var(--accent-cyan-glow);
        }

        .quick-filter-chips-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          padding-top: 2px;
        }

        .filter-chip {
          padding: 6px 14px;
          font-size: 0.775rem;
          font-weight: 600;
          color: var(--text-secondary);
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: 9999px;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .filter-chip:hover {
          color: var(--text-primary);
          background: var(--button-hover);
          border-color: rgba(6, 182, 212, 0.2);
        }

        .filter-chip.active {
          color: #ffffff;
          background: var(--accent-cyan);
          border-color: var(--accent-cyan);
          box-shadow: 0 0 8px var(--accent-cyan-glow);
        }

        /* Alert Ticker Widget styles */
        .alert-ticker-container {
          display: flex;
          flex-direction: column;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          padding: 0;
          overflow: hidden;
          transition: all var(--transition-normal);
        }

        .alert-ticker-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          cursor: pointer;
          user-select: none;
          background: rgba(255, 255, 255, 0.01);
          transition: background var(--transition-fast);
        }

        .alert-ticker-header:hover {
          background: var(--button-hover);
        }

        .ticker-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ticker-live-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ticker-live-indicator.alerting .live-dot {
          background: var(--status-critical);
          animation: pulse-rose 2s infinite;
        }

        @keyframes pulse-rose {
          0% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.6); }
          70% { box-shadow: 0 0 0 6px rgba(244, 63, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0); }
        }

        .ticker-title-text {
          font-size: 0.725rem;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: 0.05em;
        }

        .ticker-count-badge {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 999px;
          background: rgba(244, 63, 94, 0.08);
          color: var(--status-critical);
          border: 1px solid rgba(244, 63, 94, 0.15);
        }

        .ticker-toggle-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: 50%;
          transition: all var(--transition-fast);
        }

        .ticker-toggle-btn:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.05);
        }

        .alert-ticker-body {
          border-top: 1px solid var(--border-color);
          padding: 12px 20px;
          background: rgba(0, 0, 0, 0.02);
        }

        .alert-ticker-empty {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 0;
        }

        .empty-ticker-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--status-sufficient);
          box-shadow: 0 0 6px rgba(16, 185, 129, 0.5);
        }

        .empty-ticker-text {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .alert-ticker-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .alert-ticker-item {
          display: flex;
          align-items: center;
          font-size: 0.75rem;
          padding: 2px 0;
          color: var(--text-primary);
        }

        .alert-ticker-item.critical {
          color: var(--status-critical);
        }

        .alert-ticker-item.warning {
          color: var(--status-low);
        }

        .alert-item-time {
          font-family: monospace;
          color: var(--text-secondary);
          font-weight: 600;
          min-width: 60px;
        }

        .alert-item-bullet {
          color: var(--text-muted);
          margin: 0 8px;
        }

        .alert-item-message {
          font-weight: 500;
        }

        .alert-badge-label {
          font-size: 0.65rem;
          font-weight: 800;
          padding: 1px 4px;
          border-radius: 3px;
          margin-right: 4px;
          background: rgba(255, 255, 255, 0.08);
        }

        .alert-ticker-item.critical .alert-badge-label {
          background: rgba(244, 63, 94, 0.1);
        }

        .alert-ticker-item.warning .alert-badge-label {
          background: rgba(245, 158, 11, 0.1);
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-slide-down {
          animation: slideDown 0.2s ease-out;
        }

        .live-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: rgba(16, 185, 129, 0.05);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 9999px;
        }

        .live-dot {
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          background: var(--status-sufficient);
        }

        .live-text {
          font-size: 0.675rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          color: var(--status-sufficient);
        }

        .pulse-emerald {
          animation: pulse-em 2s infinite;
        }

        @keyframes pulse-em {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
          70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        .loading-state-wrapper {
          padding: 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(6, 182, 212, 0.1);
          border-top-color: var(--accent-cyan);
          border-radius: 50%;
          animation: spin 1s infinite linear;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .empty-state-wrapper {
          padding: 60px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .empty-icon {
          color: var(--status-low);
        }

        .empty-state-wrapper p {
          color: var(--text-secondary);
          font-size: 0.875rem;
          max-width: 400px;
        }

        @media (max-width: 1024px) {
          .kpi-cards-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .kpi-cards-grid {
            grid-template-columns: 1fr;
          }
          .search-filter-header-row {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
          }
          .search-input-group {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
