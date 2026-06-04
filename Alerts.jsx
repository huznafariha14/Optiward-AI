import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import axios from 'axios';
import { 
  ShieldAlert, 
  AlertTriangle, 
  BrainCircuit, 
  RefreshCw, 
  CheckCircle,
  HelpCircle,
  TrendingDown
} from 'lucide-react';

const Alerts = () => {
  const { alerts, fetchAlerts, API_BASE, loading } = useApp();
  const [runningEngine, setRunningEngine] = useState(false);
  const [triggerMessage, setTriggerMessage] = useState('');

  // Sort and group active alerts chronologically by risk zones to prevent visual overlaps
  const sortedAlerts = [...alerts].sort((a, b) => a.timeToDepletion - b.timeToDepletion);
  const criticalZoneAlerts = sortedAlerts.filter(a => a.timeToDepletion <= 8);
  const warningZoneAlerts = sortedAlerts.filter(a => a.timeToDepletion > 8 && a.timeToDepletion <= 16);
  const nominalZoneAlerts = sortedAlerts.filter(a => a.timeToDepletion > 16);

  // Acknowledge alert
  const handleAcknowledge = async (alertId) => {
    try {
      await axios.post(`${API_BASE}/alerts/${alertId}/acknowledge`);
      fetchAlerts();
    } catch (e) {
      console.error('Error acknowledging alert:', e);
    }
  };

  // Trigger Predictive AI Engine manually
  const triggerAIEngine = async () => {
    try {
      setRunningEngine(true);
      setTriggerMessage('');
      const res = await axios.post(`${API_BASE}/alerts/trigger`);
      setTriggerMessage(`Success! Checked ${res.data.count} shortage alerts.`);
      fetchAlerts();
      setTimeout(() => setTriggerMessage(''), 4000);
    } catch (e) {
      setTriggerMessage('Error executing predictive check.');
      console.error(e);
    } finally {
      setRunningEngine(false);
    }
  };

  return (
    <div className="alerts-page-wrapper">
      {/* Upper AI Engine Header */}
      <section className="engine-banner-card glass-panel">
        <div className="banner-left">
          <div className="engine-icon-glow">
            <BrainCircuit size={28} className="brain-icon-anim" />
          </div>
          <div className="banner-title-text">
            <h2 className="title-gradient">AI Predictive Shortage Engine</h2>
            <p>Our neural forecasting engine aggregates continuous inventory usage logs to forecast depletion critical paths over the next 6 to 24 hours.</p>
          </div>
        </div>
        <div className="banner-right">
          <button 
            onClick={triggerAIEngine} 
            disabled={runningEngine}
            className="btn-primary run-engine-btn"
          >
            <RefreshCw size={14} className={runningEngine ? 'spin' : ''} />
            <span>{runningEngine ? 'Analyzing Trends...' : 'Run Predictive Check'}</span>
          </button>
          {triggerMessage && <span className="trigger-toast">{triggerMessage}</span>}
        </div>
      </section>

      {/* Main Grid View */}
      <div className="alerts-grid-layout">
        {/* Left Side: Active Alerts Feed */}
        <section className="alerts-feed-column">
          <h3 className="section-subtitle">Active Predictive Alarms</h3>
          
          {loading.alerts ? (
            <div className="loading-alerts glass-panel">
              <div className="loading-spinner"></div>
              <span>Simulating network triage & running trend regression...</span>
            </div>
          ) : alerts.length === 0 ? (
            <div className="no-alerts-panel glass-panel">
              <CheckCircle size={44} className="safe-icon" />
              <h3>All Resource Thresholds Nominal</h3>
              <p>No projected depletion bottlenecks detected. Current burn rates indicate standard operations for the next 24 hours.</p>
            </div>
          ) : (
            <div className="alerts-list-container">
              {alerts.map(alert => {
                const isCritical = alert.severity === 'critical';
                return (
                  <div 
                    key={alert.id} 
                    className={`alert-card-item glass-panel ${isCritical ? 'critical pulse-rose-glow' : 'warning pulse-amber-glow'}`}
                  >
                    <div className="alert-card-header">
                      <div className={`alert-badge ${alert.severity}`}>
                        {isCritical ? <ShieldAlert size={14} /> : <AlertTriangle size={14} />}
                        <span>{alert.severity.toUpperCase()}</span>
                      </div>
                      <span className="depletion-estimation">
                        <TrendingDown size={12} />
                        Depletion in: <strong className="hours-highlight">{alert.timeToDepletion === 0 ? 'Depleted' : `~${alert.timeToDepletion} Hours`}</strong>
                      </span>
                    </div>

                    <h4 className="alert-title">{alert.message}</h4>
                    
                    {/* Natural Language Explanation Box */}
                    <div className="ai-insight-box">
                      <div className="ai-insight-header">
                        <BrainCircuit size={14} className="ai-spark" />
                        <span>AI Clinical Insight</span>
                      </div>
                      <p className="ai-insight-text">{alert.explanation}</p>
                    </div>

                    <div className="alert-card-actions">
                      <span className="alert-meta-time">Detected: {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <button 
                        onClick={() => handleAcknowledge(alert.id)}
                        className="btn-secondary acknowledge-btn"
                      >
                        Acknowledge Alert
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right Side: Timeline & Risk Zones */}
        <section className="timeline-column">
          <div className="timeline-sticky-card glass-panel">
            <h3 className="timeline-card-title">24-Hour Shortage Timeline</h3>
            <p className="timeline-subtitle">Visualizing projected ward safety indices. Plan staffing and supply distribution accordingly.</p>

            <div className="timeline-ticks-container">
              {/* Chronological Risk Zone Lists */}
              <div className="timeline-zones-container">
                {/* Critical Zone (0-8h) */}
                <div className="timeline-zone-section">
                  <div className="risk-level-strip critical">
                    <span>CRITICAL DANGER ZONE (0 - 8 Hours)</span>
                  </div>
                  <div className="timeline-nodes-list">
                    {criticalZoneAlerts.length === 0 ? (
                      <p className="no-zone-alerts">No critical shortages projected</p>
                    ) : (
                      criticalZoneAlerts.map(a => (
                        <div key={a.id} className="timeline-tree-node critical">
                          <div className="node-dot-wrapper">
                            <div className="node-dot"></div>
                          </div>
                          <div className="node-time-badge critical">
                            {a.timeToDepletion === 0 ? 'Now' : `~${a.timeToDepletion}h`}
                          </div>
                          <div className="node-content glass-panel">
                            <span className="node-subtype">{a.subType}</span>
                            <span className="node-name">{a.resourceType === 'beds' ? 'Bed' : a.resourceType}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Elevated Risk Zone (8-16h) */}
                <div className="timeline-zone-section">
                  <div className="risk-level-strip warning">
                    <span>ELEVATED RISK ZONE (8 - 16 Hours)</span>
                  </div>
                  <div className="timeline-nodes-list">
                    {warningZoneAlerts.length === 0 ? (
                      <p className="no-zone-alerts">No elevated risks projected</p>
                    ) : (
                      warningZoneAlerts.map(a => (
                        <div key={a.id} className="timeline-tree-node warning">
                          <div className="node-dot-wrapper">
                            <div className="node-dot"></div>
                          </div>
                          <div className="node-time-badge warning">
                            {`~${a.timeToDepletion}h`}
                          </div>
                          <div className="node-content glass-panel">
                            <span className="node-subtype">{a.subType}</span>
                            <span className="node-name">{a.resourceType === 'beds' ? 'Bed' : a.resourceType}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Stable Buffer (16-24h) */}
                <div className="timeline-zone-section">
                  <div className="risk-level-strip nominal">
                    <span>STABLE BUFFER (16 - 24 Hours)</span>
                  </div>
                  <div className="timeline-nodes-list">
                    {nominalZoneAlerts.length === 0 ? (
                      <p className="no-zone-alerts">No shortages in this window</p>
                    ) : (
                      nominalZoneAlerts.map(a => (
                        <div key={a.id} className="timeline-tree-node nominal">
                          <div className="node-dot-wrapper">
                            <div className="node-dot"></div>
                          </div>
                          <div className="node-time-badge nominal">
                            {`~${a.timeToDepletion}h`}
                          </div>
                          <div className="node-content glass-panel">
                            <span className="node-subtype">{a.subType}</span>
                            <span className="node-name">{a.resourceType === 'beds' ? 'Bed' : a.resourceType}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar Help details */}
              <div className="timeline-help-legend">
                <h4 className="legend-title">Triage Action Playbook</h4>
                <ul className="playbook-list">
                  <li>
                    <span className="bullet critical"></span>
                    <strong>0-8 Hours (Critical)</strong>: Divert admissions, schedule emergency deliveries, and recall off-duty staff.
                  </li>
                  <li>
                    <span className="bullet warning"></span>
                    <strong>8-16 Hours (Warning)</strong>: Approve pharmacy supply requests, step-down stable patients, and coordinate blood banking.
                  </li>
                  <li>
                    <span className="bullet nominal"></span>
                    <strong>16-24 Hours (Nominal)</strong>: General monitoring and standard scheduled inventory updates.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        .alerts-page-wrapper {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .engine-banner-card {
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%);
          border-color: rgba(6, 182, 212, 0.15);
        }

        .banner-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .engine-icon-glow {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(6, 182, 212, 0.1);
          color: var(--accent-cyan);
          border: 1px solid rgba(6, 182, 212, 0.3);
          box-shadow: 0 0 20px rgba(6, 182, 212, 0.25);
        }

        .brain-icon-anim {
          animation: brainPulse 3s infinite ease-in-out;
        }

        @keyframes brainPulse {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.08); filter: brightness(1.3); }
        }

        .banner-title-text h2 {
          font-size: 1.25rem;
          margin-bottom: 4px;
        }

        .banner-title-text p {
          font-size: 0.8rem;
          color: var(--text-secondary);
          max-width: 600px;
        }

        .banner-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
          position: relative;
        }

        .run-engine-btn {
          font-size: 0.8rem;
          padding: 10px 16px;
        }

        .trigger-toast {
          font-size: 0.725rem;
          color: var(--status-sufficient);
          font-weight: 600;
          position: absolute;
          bottom: -22px;
          white-space: nowrap;
          animation: fadeSlideUp 0.3s forwards;
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .alerts-grid-layout {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 24px;
        }

        .section-subtitle {
          font-size: 0.95rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          margin-bottom: 16px;
          font-weight: 700;
        }

        .loading-alerts {
          padding: 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .no-alerts-panel {
          padding: 80px 40px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .safe-icon {
          color: var(--status-sufficient);
          filter: drop-shadow(0 0 10px rgba(16, 185, 129, 0.4));
          animation: float 4s infinite ease-in-out;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        .no-alerts-panel p {
          color: var(--text-secondary);
          font-size: 0.875rem;
          max-width: 420px;
        }

        .alerts-list-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .alert-card-item {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .alert-card-item.critical {
          border-color: rgba(244, 63, 94, 0.25);
        }

        .alert-card-item.warning {
          border-color: rgba(245, 158, 11, 0.25);
        }

        .alert-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .alert-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.675rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          border: 1px solid transparent;
        }

        .alert-badge.critical {
          background: rgba(244, 63, 94, 0.1);
          color: var(--status-critical);
          border-color: rgba(244, 63, 94, 0.25);
        }

        .alert-badge.warning {
          background: rgba(245, 158, 11, 0.1);
          color: var(--status-low);
          border-color: rgba(245, 158, 11, 0.25);
        }

        .depletion-estimation {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.775rem;
          color: var(--text-secondary);
        }

        .hours-highlight {
          color: var(--text-primary);
        }

        .alert-title {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .ai-insight-box {
          background: rgba(6, 182, 212, 0.03);
          border: 1px solid rgba(6, 182, 212, 0.12);
          border-radius: var(--border-radius-sm);
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .ai-insight-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.7rem;
          font-weight: 800;
          color: var(--accent-cyan);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .ai-spark {
          animation: blink 2s infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        .ai-insight-text {
          font-size: 0.8rem;
          line-height: 1.5;
          color: var(--text-primary);
        }

        .alert-card-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.03);
        }

        .alert-meta-time {
          font-size: 0.725rem;
          color: var(--text-muted);
        }

        .acknowledge-btn {
          font-size: 0.75rem;
          padding: 6px 12px;
          border-radius: 6px;
        }

        /* Timeline Panel CSS styling */
        .timeline-sticky-card {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: sticky;
          top: 32px;
        }

        .timeline-card-title {
          font-size: 1.1rem;
          font-weight: 600;
        }

        .timeline-subtitle {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .timeline-ticks-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-top: 10px;
        }

        .timeline-zones-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
          max-height: 480px;
          overflow-y: auto;
          padding-right: 4px;
        }

        /* Styling scrollbar for glass panel */
        .timeline-zones-container::-webkit-scrollbar {
          width: 4px;
        }
        .timeline-zones-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 99px;
        }

        .timeline-zone-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .risk-level-strip {
          height: 28px;
          display: flex;
          align-items: center;
          padding-left: 14px;
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.02);
        }

        .risk-level-strip.critical {
          background: linear-gradient(90deg, rgba(244, 63, 94, 0.06) 0%, rgba(244, 63, 94, 0.01) 100%);
          color: var(--status-critical);
          border-color: rgba(244, 63, 94, 0.15);
        }

        .risk-level-strip.warning {
          background: linear-gradient(90deg, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0.01) 100%);
          color: var(--status-low);
          border-color: rgba(245, 158, 11, 0.15);
        }

        .risk-level-strip.nominal {
          background: linear-gradient(90deg, rgba(16, 185, 129, 0.04) 0%, rgba(16, 185, 129, 0.01) 100%);
          color: var(--status-sufficient);
          border-color: rgba(16, 185, 129, 0.15);
        }

        .timeline-nodes-list {
          position: relative;
          padding-left: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        /* Beautiful vertical timeline line per zone */
        .timeline-nodes-list::before {
          content: '';
          position: absolute;
          left: 9px;
          top: 4px;
          bottom: 4px;
          width: 2px;
          border-left: 2px dashed rgba(255, 255, 255, 0.08);
        }

        .timeline-tree-node {
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
        }

        .node-dot-wrapper {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 2;
          flex-shrink: 0;
        }

        .node-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: 2px solid var(--bg-primary);
        }

        .timeline-tree-node.critical .node-dot {
          background: var(--status-critical);
          box-shadow: 0 0 10px rgba(244, 63, 94, 0.6);
        }

        .timeline-tree-node.warning .node-dot {
          background: var(--status-low);
          box-shadow: 0 0 10px rgba(245, 158, 11, 0.6);
        }

        .timeline-tree-node.nominal .node-dot {
          background: var(--status-sufficient);
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.6);
        }

        .node-time-badge {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 3px 6px;
          border-radius: 4px;
          width: 48px;
          text-align: center;
          flex-shrink: 0;
          border: 1px solid transparent;
        }

        .node-time-badge.critical {
          background: rgba(244, 63, 94, 0.08);
          color: var(--status-critical);
          border-color: rgba(244, 63, 94, 0.15);
        }

        .node-time-badge.warning {
          background: rgba(245, 158, 11, 0.08);
          color: var(--status-low);
          border-color: rgba(245, 158, 11, 0.15);
        }

        .node-time-badge.nominal {
          background: rgba(16, 185, 129, 0.08);
          color: var(--status-sufficient);
          border-color: rgba(16, 185, 129, 0.15);
        }

        .node-content {
          flex-grow: 1;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          border-radius: var(--border-radius-sm);
          border: 1px solid rgba(255, 255, 255, 0.04);
          background: rgba(255, 255, 255, 0.01);
          min-width: 0;
        }

        .node-subtype {
          font-weight: 700;
          color: var(--text-primary);
          font-size: 0.775rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .node-name {
          color: var(--text-muted);
          font-size: 0.725rem;
          text-transform: capitalize;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .no-zone-alerts {
          font-size: 0.7rem;
          color: var(--text-muted);
          padding-left: 20px;
          font-style: italic;
          margin: 2px 0;
        }

        .timeline-help-legend {
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.04);
        }

        .legend-title {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          font-weight: 800;
          margin-bottom: 12px;
        }

        .playbook-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .playbook-list li {
          font-size: 0.725rem;
          color: var(--text-secondary);
          display: flex;
          align-items: flex-start;
          gap: 8px;
          line-height: 1.4;
        }

        .bullet {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 3px;
        }

        .bullet.critical { background: var(--status-critical); }
        .bullet.warning { background: var(--status-low); }
        .bullet.nominal { background: var(--status-sufficient); }

        .spin {
          animation: spin-cw 1s infinite linear;
        }

        @keyframes spin-cw {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 900px) {
          .alerts-grid-layout {
            grid-template-columns: 1fr;
          }
          .timeline-sticky-card {
            position: relative;
            top: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default Alerts;
