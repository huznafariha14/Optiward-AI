import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  BellRing, 
  Boxes, 
  FileText, 
  GitMerge, 
  Network, 
  HeartPulse,
  Signal,
  SignalHigh,
  Sun,
  Moon,
  LogOut
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { selectedDepartment, setSelectedDepartment, alerts, resources, socketConnected, theme, toggleTheme, staffUser, logout } = useApp();

  const getDeptCount = (dept) => {
    if (dept === 'All') return resources.length;
    return resources.filter(r => r.department === dept).length;
  };

  const allMenuItems = [
    { id: 'dashboard', name: 'Live Dashboard', icon: LayoutDashboard },
    { id: 'alerts', name: 'AI Predictive Alerts', icon: BellRing, badge: alerts.length },
    { id: 'inventory', name: 'Inventory & Logs', icon: Boxes },
    { id: 'allocation', name: 'AI Triage Allocator', icon: GitMerge },
    { id: 'analytics', name: 'Analytics & Reports', icon: FileText },
  ];

  // Filter menu items by Role Based Access Control
  const menuItems = allMenuItems.filter(item => {
    if (!staffUser) return false;
    if (staffUser.role === 'admin') return true;
    if (staffUser.role === 'clinician') {
      return ['dashboard', 'alerts', 'allocation'].includes(item.id);
    }
    if (staffUser.role === 'pharmacist') {
      return ['dashboard', 'alerts', 'inventory', 'analytics'].includes(item.id);
    }
    return true;
  });

  // Protect tab index active state across role logins/logouts
  React.useEffect(() => {
    if (menuItems.length > 0 && !menuItems.some(item => item.id === activeTab)) {
      setActiveTab('dashboard');
    }
  }, [activeTab, menuItems, setActiveTab]);

  const departments = ['All', 'ICU', 'Emergency', 'General Ward', 'OT', 'Pharmacy'];

  return (
    <aside className="sidebar-container">
      {/* Brand Branding */}
      <div className="sidebar-brand">
        <HeartPulse className="brand-icon" />
        <span className="brand-logo-text">
          OptiWard <span className="brand-accent">AI</span>
        </span>
      </div>

      {/* Primary Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-title">Operations</div>
        <ul className="nav-list">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`nav-button ${isActive ? 'active' : ''}`}
                >
                  <Icon size={18} className="nav-icon" />
                  <span>{item.name}</span>
                  {item.badge > 0 && (
                    <span className="nav-badge pulse-rose-glow">{item.badge}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Department Filtering Selector */}
        <div className="nav-section-title">Departments</div>
        <div className="department-selector-wrapper">
          {departments.map(dept => {
            const isSelected = selectedDepartment === dept;
            const count = getDeptCount(dept);
            return (
              <button
                key={dept}
                onClick={() => setSelectedDepartment(dept)}
                className={`dept-chip ${isSelected ? 'active' : ''}`}
              >
                <Network size={14} className="dept-chip-icon" />
                <span className="dept-name-span">{dept}</span>
                <span className={`dept-badge ${isSelected ? 'active' : ''}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Sidebar Footer — Status Monitor */}
      <div className="sidebar-footer">
        {/* Logged in User Shift Card */}
        {staffUser && (
          <div className="active-user-profile-card glass-panel">
            <div className="profile-avatar">
              {staffUser.name.charAt(0)}
            </div>
            <div className="profile-info-group">
              <span className="profile-name">{staffUser.name}</span>
              <span className={`profile-role-badge ${staffUser.role}`}>
                {staffUser.role}
              </span>
            </div>
            <button className="logout-btn-icon" onClick={logout} title="Logout Shift / Switch Role">
              <LogOut size={14} />
            </button>
          </div>
        )}

        {/* Modern Sliding Theme Switch Widget */}
        <div className="sidebar-theme-toggle">
          <div className="theme-toggle-label-group">
            {theme === 'dark' ? <Moon size={13} className="label-icon moon" /> : <Sun size={13} className="label-icon sun" />}
            <span className="theme-toggle-label">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
          </div>
          <div className={`theme-sliding-switch ${theme}`} onClick={toggleTheme} role="button" aria-label="Toggle Display Theme">
            <div className="switch-slider-pill">
              {theme === 'dark' ? <Moon size={11} className="pill-icon" /> : <Sun size={11} className="pill-icon" />}
            </div>
          </div>
        </div>

        <div className="connection-status-panel">
          {socketConnected ? (
            <>
              <SignalHigh className="status-indicator-icon active" size={16} />
              <span className="status-text active">Real-Time Sync Active</span>
            </>
          ) : (
            <>
              <Signal className="status-indicator-icon inactive" size={16} />
              <span className="status-text inactive">Connecting...</span>
            </>
          )}
        </div>
        <div className="app-version-text">v1.1.0 (Hackathon Edition)</div>
      </div>

      <style>{`
        .sidebar-container {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: var(--sidebar-width);
          background: var(--sidebar-bg);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          z-index: 100;
          padding: 24px 16px;
          transition: background-color var(--transition-normal), border-color var(--transition-normal);
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px 24px 12px;
          border-bottom: 1px solid var(--border-color);
        }

        .brand-icon {
          color: var(--accent-cyan);
          filter: drop-shadow(0 0 6px rgba(6, 182, 212, 0.5));
          animation: heartBeat 2s infinite ease-in-out;
        }

        @keyframes heartBeat {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.1); }
          40% { transform: scale(1.03); }
          60% { transform: scale(1.15); }
        }

        .brand-logo-text {
          font-family: 'Outfit', sans-serif;
          font-size: 1.25rem;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .brand-accent {
          background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .sidebar-nav {
          flex-grow: 1;
          margin-top: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          overflow-y: auto;
        }

        .nav-section-title {
          font-size: 0.675rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-muted);
          font-weight: 700;
          padding-left: 12px;
        }

        .nav-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .nav-button {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          background: transparent;
          border: none;
          border-radius: var(--border-radius-sm);
          font-size: 0.875rem;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: left;
        }

        .nav-button:hover {
          background: var(--button-hover);
          color: var(--text-primary);
        }

        .nav-button.active {
          background: rgba(6, 182, 212, 0.1);
          color: var(--accent-cyan);
          font-weight: 500;
          border: 1px solid rgba(6, 182, 212, 0.2);
        }

        .nav-icon {
          transition: transform var(--transition-fast);
        }

        .nav-button:hover .nav-icon {
          transform: translateX(2px);
        }

        .nav-badge {
          margin-left: auto;
          background: var(--status-critical);
          color: #fff;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 9999px;
        }

        .department-selector-wrapper {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .dept-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: var(--border-radius-sm);
          font-size: 0.8rem;
          color: var(--text-secondary);
          cursor: pointer;
          text-align: left;
          transition: all var(--transition-fast);
          width: 100%;
        }

        .dept-name-span {
          flex-grow: 1;
        }

        .dept-badge {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 9999px;
          background: var(--bg-tertiary);
          color: var(--text-muted);
          border: 1px solid var(--border-color);
          transition: all var(--transition-fast);
        }

        .dept-badge.active {
          background: rgba(6, 182, 212, 0.15);
          color: var(--accent-cyan);
          border-color: rgba(6, 182, 212, 0.3);
        }

        .dept-chip:hover {
          background: var(--button-hover);
          color: var(--text-primary);
        }

        .dept-chip.active {
          background: var(--bg-tertiary);
          color: var(--text-primary);
          border-color: var(--border-color);
          font-weight: 500;
        }

        .dept-chip.active .dept-chip-icon {
          color: var(--accent-cyan);
        }

        .dept-chip-icon {
          color: var(--text-muted);
          transition: color var(--transition-fast);
        }

        .sidebar-footer {
          padding-top: 16px;
          border-top: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .sidebar-theme-toggle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: var(--button-hover);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-sm);
          margin-bottom: 4px;
        }

        .theme-toggle-label-group {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-secondary);
        }

        .label-icon {
          color: var(--accent-cyan);
        }

        .theme-toggle-label {
          font-size: 0.775rem;
          font-weight: 600;
        }

        .theme-sliding-switch {
          width: 44px;
          height: 24px;
          border-radius: 999px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          position: relative;
          cursor: pointer;
          transition: all var(--transition-normal);
        }

        .theme-sliding-switch.light {
          background: #e2e8f0;
        }

        .theme-sliding-switch.dark {
          background: #1e293b;
          border-color: rgba(6, 182, 212, 0.3);
        }

        .switch-slider-pill {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--bg-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-normal);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .theme-sliding-switch.dark .switch-slider-pill {
          left: 22px;
          background: var(--accent-cyan);
          color: #fff;
        }

        .theme-sliding-switch.light .switch-slider-pill {
          background: #ffffff;
          color: #f59e0b;
        }

        .pill-icon {
          display: block;
        }

        .connection-status-panel {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.75rem;
        }

        .status-indicator-icon.active {
          color: var(--status-sufficient);
          filter: drop-shadow(0 0 4px rgba(16, 185, 129, 0.4));
        }

        .status-indicator-icon.inactive {
          color: var(--text-muted);
        }

        .status-text.active {
          color: var(--status-sufficient);
        }

        .status-text.inactive {
          color: var(--text-muted);
        }

        .app-version-text {
          font-size: 0.65rem;
          color: var(--text-muted);
        }

        .active-user-profile-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: var(--border-radius-md);
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          margin-bottom: 8px;
        }

        .profile-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
          color: #ffffff;
          font-weight: 700;
          font-size: 0.775rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(6, 182, 212, 0.2);
          flex-shrink: 0;
        }

        .profile-info-group {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex-grow: 1;
          min-width: 0;
        }

        .profile-name {
          font-family: 'Outfit', sans-serif;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .profile-role-badge {
          font-size: 0.575rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 1px 6px;
          border-radius: 3px;
          width: fit-content;
        }

        .profile-role-badge.admin {
          background: rgba(79, 70, 229, 0.1);
          color: #818cf8;
          border: 1px solid rgba(79, 70, 229, 0.2);
        }

        .profile-role-badge.clinician {
          background: rgba(225, 29, 72, 0.1);
          color: #fb7185;
          border: 1px solid rgba(225, 29, 72, 0.2);
        }

        .profile-role-badge.pharmacist {
          background: rgba(13, 148, 136, 0.1);
          color: #2dd4bf;
          border: 1px solid rgba(13, 148, 136, 0.2);
        }

        .logout-btn-icon {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 6px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
          flex-shrink: 0;
        }

        .logout-btn-icon:hover {
          color: var(--status-critical);
          background: rgba(244, 63, 94, 0.05);
        }

        @media (max-width: 1024px) {
          .sidebar-container {
            display: none; /* In a production build, add slide-in mobile overlay */
          }
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
