import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Clock, UserCheck } from 'lucide-react';

const Header = ({ activeTab }) => {
  const { selectedDepartment, staffUser, setStaffUser } = useApp();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Live Resource Dashboard';
      case 'alerts': return 'AI Predictive Alert Engine';
      case 'inventory': return 'Smart Inventory Update';
      case 'allocation': return 'AI Resource Allocation Recommender';
      case 'analytics': return 'Operations Analytics & AI Reports';
      default: return 'OptiWard AI';
    }
  };

  const demoStaffMembers = [
    { id: 'ST-102', name: 'Nurse Clara Finch' },
    { id: 'ST-221', name: 'Dr. Alexander Vance' },
    { id: 'ST-108', name: 'Tech Liam Brooks' },
    { id: 'ST-314', name: 'Nurse Elena Rostova' }
  ];

  return (
    <header className="header-wrapper">
      <div className="header-left">
        <h1 className="header-title title-gradient">{getTitle()}</h1>
        <div className="header-subtitle">
          Department Filter: <span className="active-dept">{selectedDepartment === 'All' ? 'All Wards' : `${selectedDepartment} Ward`}</span>
        </div>
      </div>

      <div className="header-right">
        {/* Live Digital Clock */}
        <div className="clock-panel glass-panel">
          <Clock size={15} className="clock-icon" />
          <span className="clock-time">{formatTime(time)}</span>
          <span className="clock-divider">|</span>
          <span className="clock-date">{formatDate(time)}</span>
        </div>

        {/* Active Staff Identity Indicator */}
        {staffUser && (
          <div className="staff-selector-panel glass-panel">
            <UserCheck size={15} className="staff-icon" />
            <span className="staff-label">Authorized Shift:</span>
            <span className="staff-name-display">
              {staffUser.name} <span className={`role-pill-inline ${staffUser.role}`}>{staffUser.role}</span>
            </span>
          </div>
        )}
      </div>

      <style>{`
        .header-wrapper {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          background: var(--bg-card);
          backdrop-filter: blur(12px);
          border-radius: var(--border-radius-md);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-md);
          transition: background-color var(--transition-normal), border-color var(--transition-normal), box-shadow var(--transition-normal);
        }

        .header-left {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .header-title {
          font-size: 1.35rem;
          font-weight: 700;
          letter-spacing: -0.015em;
        }

        .header-subtitle {
          font-size: 0.775rem;
          color: var(--text-secondary);
        }

        .active-dept {
          color: var(--accent-cyan);
          font-weight: 600;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .clock-panel {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 16px;
          border-radius: 9999px;
          font-size: 0.775rem;
          font-family: monospace;
          background: rgba(255, 255, 255, 0.02);
          box-shadow: none;
        }

        .clock-icon {
          color: var(--accent-cyan);
        }

        .clock-time {
          color: var(--text-primary);
          font-weight: 600;
        }

        .clock-divider {
          color: var(--border-color);
        }

        .clock-date {
          color: var(--text-secondary);
        }

        .staff-selector-panel {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 9999px;
          background: rgba(6, 182, 212, 0.05);
          border-color: rgba(6, 182, 212, 0.2);
          box-shadow: none;
        }

        .staff-icon {
          color: var(--accent-cyan);
        }

        .staff-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .staff-name-display {
          font-size: 0.775rem;
          font-weight: 700;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .role-pill-inline {
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 800;
        }

        .role-pill-inline.admin {
          background: rgba(79, 70, 229, 0.1);
          color: #818cf8;
          border: 1px solid rgba(79, 70, 229, 0.2);
        }

        .role-pill-inline.clinician {
          background: rgba(225, 29, 72, 0.1);
          color: #fb7185;
          border: 1px solid rgba(225, 29, 72, 0.2);
        }

        .role-pill-inline.pharmacist {
          background: rgba(13, 148, 136, 0.1);
          color: #2dd4bf;
          border: 1px solid rgba(13, 148, 136, 0.2);
        }

        @media (max-width: 1024px) {
          .header-wrapper {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
          }
          .header-right {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </header>
  );
};

export default Header;
