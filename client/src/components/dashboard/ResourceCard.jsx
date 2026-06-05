import React from 'react';
import { 
  Bed, 
  Droplet, 
  Wind, 
  ShieldAlert, 
  Activity, 
  Briefcase, 
  Pill,
  Users,
  CornerUpRight,
  UserCheck,
  Truck,
  RefreshCw
} from 'lucide-react';

const ResourceCard = ({ resource, onQuickUpdateClick }) => {
  const { id, name, type, subType, currentCount, totalCapacity, department, thresholds, unit, status } = resource;

  const percent = totalCapacity > 0 ? Math.min(100, Math.round((currentCount / totalCapacity) * 100)) : 0;

  // Custom Icon selector based on resource type
  const getIcon = () => {
    switch (type) {
      case 'beds': return <Bed className="card-type-icon" />;
      case 'oxygen': return <Wind className="card-type-icon" />;
      case 'ventilators': return <Activity className="card-type-icon" />;
      case 'blood': return <Droplet className="card-type-icon" />;
      case 'medicines': return <Pill className="card-type-icon" />;
      case 'equipment': return <Activity className="card-type-icon" />;
      case 'kits': return <Briefcase className="card-type-icon" />;
      case 'staff': return <Users className="card-type-icon" />;
      default: return <Activity className="card-type-icon" />;
    }
  };

  const getStatusClass = () => {
    if (status === 'critical') return 'status-critical';
    if (status === 'low') return 'status-low';
    return 'status-sufficient';
  };

  const getProgressGlowStyle = () => {
    if (status === 'critical') return 'rgba(244, 63, 94, 0.4)';
    if (status === 'low') return 'rgba(245, 158, 11, 0.4)';
    return 'rgba(16, 185, 129, 0.4)';
  };

  const getTrendData = () => {
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const value = (hash % 4) + 1;
    
    if (status === 'critical') {
      return {
        arrow: '↓',
        text: `-${value} in last hr`,
        colorClass: 'worsening'
      };
    } else if (status === 'low') {
      const isUp = hash % 2 === 0;
      return {
        arrow: isUp ? '↑' : '↓',
        text: `${isUp ? '+' : '-'}${value} in last hr`,
        colorClass: isUp ? 'improving' : 'worsening'
      };
    } else {
      const isUp = hash % 3 !== 0;
      return {
        arrow: isUp ? '↑' : '↓',
        text: `${isUp ? '+' : '-'}${value} in last hr`,
        colorClass: isUp ? 'improving' : 'worsening'
      };
    }
  };

  const getContextualCTA = () => {
    switch (type) {
      case 'beds':
      case 'staff':
        return { text: 'Reassign', icon: <UserCheck size={13} /> };
      case 'oxygen':
      case 'blood':
      case 'medicines':
      case 'kits':
        return { text: 'Request restock', icon: <Truck size={13} /> };
      case 'ventilators':
      case 'equipment':
      default:
        return { text: 'Log update', icon: <RefreshCw size={13} /> };
    }
  };

  const trend = getTrendData();
  const cta = getContextualCTA();

  return (
    <div className={`resource-card glass-panel glass-panel-interactive ${status === 'critical' ? 'pulse-rose-glow critical-border' : status === 'low' ? 'pulse-amber-glow warning-border' : ''}`}>
      {/* Card Header */}
      <div className="card-header">
        <div className={`card-icon-wrapper ${getStatusClass()}`}>
          {getIcon()}
        </div>
        <div className="card-title-info">
          <span className="card-subtype-label">{subType}</span>
          <h3 className="card-name-title">{name}</h3>
        </div>
        <div className={`card-status-badge ${getStatusClass()}`}>
          {status.toUpperCase()}
        </div>
      </div>

      {/* Card Figures */}
      <div className="card-figures-row">
        <div className="figures-left">
          <div className="count-numbers">
            <span className="current-count">{currentCount}</span>
            <span className="capacity-divider">/</span>
            <span className="total-capacity">{totalCapacity}</span>
            <span className="count-unit-label">{unit}</span>
          </div>
          <span className={`trend-indicator ${trend.colorClass}`}>
            <span>{trend.arrow}</span>
            <span>{trend.text}</span>
          </span>
        </div>
        <div className="figures-right">
          <span className="percentage-indicator">{percent}%</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card-progress-track">
        <div 
          className={`card-progress-bar ${getStatusClass()}`}
          style={{ 
            width: `${percent}%`,
            boxShadow: `0 0 10px ${getProgressGlowStyle()}`
          }}
        />
      </div>

      {/* Card Footer Info */}
      <div className="card-footer-info">
        <div className="footer-details">
          <span className="dept-tag">{department}</span>
          <span className="threshold-info">Warn: {thresholds.warning} | Crit: {thresholds.critical}</span>
        </div>

        {/* Dynamic Shortcut Link */}
        <button 
          onClick={() => onQuickUpdateClick(id)} 
          className="quick-adjust-action-btn"
          title={`Quick action: ${cta.text}`}
        >
          <span>{cta.text}</span>
          {cta.icon}
        </button>
      </div>

      <style>{`
        .resource-card {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: relative;
          overflow: hidden;
        }

        .resource-card.critical-border {
          border-color: rgba(244, 63, 94, 0.4);
        }

        .resource-card.warning-border {
          border-color: rgba(245, 158, 11, 0.4);
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .card-icon-wrapper {
          width: 40px;
          height: 40px;
          border-radius: var(--border-radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .card-icon-wrapper.status-sufficient {
          background: rgba(16, 185, 129, 0.1);
          color: var(--status-sufficient);
          border-color: rgba(16, 185, 129, 0.2);
        }

        .card-icon-wrapper.status-low {
          background: rgba(245, 158, 11, 0.1);
          color: var(--status-low);
          border-color: rgba(245, 158, 11, 0.2);
        }

        .card-icon-wrapper.status-critical {
          background: rgba(244, 63, 94, 0.1);
          color: var(--status-critical);
          border-color: rgba(244, 63, 94, 0.2);
        }

        .card-type-icon {
          width: 20px;
          height: 20px;
        }

        .card-title-info {
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }

        .card-subtype-label {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          font-weight: 700;
        }

        .card-name-title {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .card-status-badge {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid transparent;
        }

        .card-status-badge.status-sufficient {
          color: var(--status-sufficient);
          background: rgba(16, 185, 129, 0.08);
          border-color: rgba(16, 185, 129, 0.15);
        }

        .card-status-badge.status-low {
          color: var(--status-low);
          background: rgba(245, 158, 11, 0.08);
          border-color: rgba(245, 158, 11, 0.15);
        }

        .card-status-badge.status-critical {
          color: var(--status-critical);
          background: rgba(244, 63, 94, 0.08);
          border-color: rgba(244, 63, 94, 0.15);
        }

        .card-figures-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }

        .figures-left {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .count-numbers {
          display: flex;
          align-items: baseline;
        }

        .current-count {
          font-family: 'Outfit', sans-serif;
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .capacity-divider {
          font-size: 0.95rem;
          color: var(--text-muted);
          margin: 0 4px;
        }

        .total-capacity {
          font-size: 1rem;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .count-unit-label {
          font-size: 0.7rem;
          color: var(--text-muted);
          margin-left: 4px;
        }

        .trend-indicator {
          font-size: 0.65rem;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
          gap: 3px;
          white-space: nowrap;
        }

        .trend-indicator.improving {
          color: var(--status-sufficient);
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.15);
        }

        .trend-indicator.worsening {
          color: var(--status-critical);
          background: rgba(244, 63, 94, 0.08);
          border: 1px solid rgba(244, 63, 94, 0.15);
        }

        .percentage-indicator {
          font-family: 'Outfit', sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .card-progress-track {
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 99px;
          overflow: hidden;
        }

        .card-progress-bar {
          height: 100%;
          border-radius: 99px;
          transition: width var(--transition-slow);
        }

        .card-progress-bar.status-sufficient {
          background: linear-gradient(90deg, #10b981, #34d399);
        }

        .card-progress-bar.status-low {
          background: linear-gradient(90deg, #f59e0b, #fbbf24);
        }

        .card-progress-bar.status-critical {
          background: linear-gradient(90deg, #f43f5e, #fb7185);
        }

        .card-footer-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 4px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.03);
        }

        .footer-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .dept-tag {
          font-size: 0.65rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .threshold-info {
          font-size: 0.625rem;
          color: var(--text-muted);
        }

        .quick-adjust-action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          font-size: 0.725rem;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .quick-adjust-action-btn:hover {
          background: rgba(6, 182, 212, 0.08);
          border-color: rgba(6, 182, 212, 0.3);
          color: var(--accent-cyan);
        }
      `}</style>
    </div>
  );
};

export default ResourceCard;
