import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  HeartPulse, 
  ShieldCheck, 
  UserCheck, 
  UserSquare2, 
  ScanLine, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

const LoginPortal = () => {
  const { loginWithTag, loginDemo } = useApp();
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanState, setScanState] = useState('idle'); // idle | scanning | success | error
  const [scanUser, setScanUser] = useState(null);

  const handleTagSubmit = async (e) => {
    e.preventDefault();
    if (!tagInput.trim()) return;
    triggerScan(tagInput.trim());
  };

  const triggerScan = async (tag) => {
    setLoading(true);
    setError('');
    setScanState('scanning');
    
    // Smooth delay to simulate high-tech RFID scanner reading
    setTimeout(async () => {
      const res = await loginWithTag(tag);
      if (res.success) {
        setScanState('success');
        setLoading(false);
      } else {
        setScanState('error');
        setError(res.error || 'Access Denied: ID Card Unrecognized');
        setLoading(false);
        setTimeout(() => setScanState('idle'), 3000);
      }
    }, 1500);
  };

  const handleDemoLogin = async (role) => {
    setLoading(true);
    setError('');
    setScanState('scanning');
    
    // Smooth visual swipe animation
    setTimeout(async () => {
      const res = await loginDemo(role);
      if (res.success) {
        setScanState('success');
        setLoading(false);
      } else {
        setScanState('error');
        setError(res.error || 'Failed to authenticate demo role');
        setLoading(false);
        setTimeout(() => setScanState('idle'), 3000);
      }
    }, 1000);
  };

  const demoCards = [
    {
      role: 'admin',
      title: 'Chief Administrator',
      tag: 'ID-ADM-001',
      name: 'Dr. Sarah Jenkins',
      gradient: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
      glow: 'rgba(79, 70, 229, 0.25)',
      privileges: ['Full Telemetry Suite', 'Analytics & Reports', 'AI Predictors & Allocator', 'Inventory Master Logs']
    },
    {
      role: 'clinician',
      title: 'Clinical Doctor/Nurse',
      tag: 'ID-CLI-102',
      name: 'Nurse Clara Finch',
      gradient: 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)',
      glow: 'rgba(225, 29, 72, 0.25)',
      privileges: ['AI Triage Allocation', 'Bed Inventory Status', 'AI Shortage Predictors', 'Shift Reassignments']
    },
    {
      role: 'pharmacist',
      title: 'Logistics Pharmacist',
      tag: 'ID-PHR-504',
      name: 'Marcus Vance',
      gradient: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)',
      glow: 'rgba(13, 148, 136, 0.25)',
      privileges: ['Pharmaceutical Tag Scanner', 'Replenish / Add Inventory', 'Audit Logs History', 'AI Shortage Predictors']
    }
  ];

  return (
    <div className="login-portal-wrapper">
      <div className="login-grid-container">
        
        {/* Brand Side / Brand Info */}
        <div className="brand-card glass-panel">
          <div className="brand-logo-section">
            <HeartPulse className="brand-logo-icon animate-pulse-logo" size={44} />
            <h1 className="brand-text">
              OptiWard <span className="logo-accent">AI</span>
            </h1>
            <p className="brand-tagline">Clinical Resource & Predictive Operations Engine</p>
          </div>

        </div>

        {/* Access Gateway Control Panel */}
        <div className="auth-card glass-panel">
          <div className="auth-header">
            <h2>Authorized Shift Access Portal</h2>
            <p>Scan your NFC/RFID staff ID card or select a credential role profile to log in.</p>
          </div>

          {/* Interactive RFID Scanner Area */}
          <div className="scanner-container-section">
            <div className={`rfid-card-reader ${scanState}`}>
              <div className="reader-scanner-laser"></div>
              
              <div className="reader-display-panel">
                {scanState === 'idle' && (
                  <div className="reader-status-content">
                    <ScanLine className="reader-status-icon idle" size={32} />
                    <span className="reader-text-status">Reader Standby</span>
                    <span className="reader-subtext">Hover ID card below or type code to swipe</span>
                  </div>
                )}
                {scanState === 'scanning' && (
                  <div className="reader-status-content">
                    <ScanLine className="reader-status-icon scanning animate-spin-pulse" size={32} />
                    <span className="reader-text-status">Reading Tag...</span>
                    <span className="reader-subtext">Verifying clinical credentials</span>
                  </div>
                )}
                {scanState === 'success' && (
                  <div className="reader-status-content">
                    <ShieldCheck className="reader-status-icon success" size={32} />
                    <span className="reader-text-status">Access Granted</span>
                    <span className="reader-subtext">Redirecting to active shift...</span>
                  </div>
                )}
                {scanState === 'error' && (
                  <div className="reader-status-content">
                    <AlertTriangle className="reader-status-icon error" size={32} />
                    <span className="reader-text-status">Card Rejected</span>
                    <span className="reader-subtext">{error}</span>
                  </div>
                )}
              </div>
              
              {/* LED Indicators */}
              <div className="reader-led-strip">
                <span className={`led red ${scanState === 'error' ? 'active' : ''}`}></span>
                <span className={`led amber ${scanState === 'scanning' ? 'active' : ''}`}></span>
                <span className={`led green ${scanState === 'success' ? 'active' : ''}`}></span>
              </div>
            </div>

            {/* Input tag field */}
            <form onSubmit={handleTagSubmit} className="scanner-tag-form">
              <input 
                type="text" 
                placeholder="RFID Tag Code (e.g. ID-PHR-504)" 
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                disabled={loading}
                className="input-field rfid-input-box"
              />
              <button 
                type="submit" 
                disabled={loading || !tagInput.trim()} 
                className="btn-primary rfid-submit-btn"
              >
                <span>Swipe</span>
              </button>
            </form>
          </div>

          <div className="divider-text-row">
            <span>OR FAST DEMO LOGIN</span>
          </div>

          {/* Quick Demo Cards Grid */}
          <div className="demo-profiles-deck">
            {demoCards.map(profile => (
              <button
                key={profile.role}
                onClick={() => handleDemoLogin(profile.role)}
                disabled={loading}
                className="demo-profile-card glass-panel"
                style={{
                  '--profile-glow': profile.glow,
                  '--profile-grad': profile.gradient
                }}
              >
                <div className="profile-card-header">
                  <div className="role-avatar-circle" style={{ background: profile.gradient }}>
                    {profile.role === 'admin' ? <UserSquare2 size={16} /> : profile.role === 'clinician' ? <HeartPulse size={16} /> : <UserCheck size={16} />}
                  </div>
                  <div className="role-meta-info">
                    <span className="profile-card-title">{profile.title}</span>
                    <span className="profile-card-tag">{profile.tag}</span>
                  </div>
                </div>

                <div className="profile-card-body">
                  <span className="profile-demo-user">{profile.name}</span>
                  <div className="privilege-checklist">
                    {profile.privileges.slice(0, 3).map((priv, idx) => (
                      <span key={idx} className="privilege-bullet">• {priv}</span>
                    ))}
                  </div>
                </div>

                <div className="profile-card-action">
                  <span>Quick Swipe Login</span>
                  <ArrowRight size={12} className="arrow-action" />
                </div>
              </button>
            ))}
          </div>

        </div>

      </div>

      <style>{`
        .login-portal-wrapper {
          min-height: 100vh;
          width: 100vw;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 1000;
          background-color: var(--bg-primary);
          background-image: 
            radial-gradient(at 0% 0%, rgba(6, 182, 212, 0.08) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(79, 70, 229, 0.08) 0px, transparent 50%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          overflow-y: auto;
        }

        .login-grid-container {
          display: grid;
          grid-template-columns: 1fr 1.6fr;
          gap: 32px;
          width: 100%;
          max-width: 1100px;
          min-height: 600px;
        }

        .brand-card {
          padding: 40px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: var(--bg-card);
          border-color: var(--border-color);
        }

        .brand-logo-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .brand-logo-icon {
          color: var(--accent-cyan);
          filter: drop-shadow(0 0 10px rgba(6, 182, 212, 0.5));
        }

        .animate-pulse-logo {
          animation: pulse-logo 2.5s infinite ease-in-out;
        }

        @keyframes pulse-logo {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 8px rgba(6, 182, 212, 0.4)); }
          50% { transform: scale(1.08); filter: drop-shadow(0 0 16px rgba(6, 182, 212, 0.7)); }
        }

        .brand-text {
          font-family: 'Outfit', sans-serif;
          font-size: 2.2rem;
          font-weight: 800;
          letter-spacing: -0.03em;
        }

        .logo-accent {
          background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .brand-tagline {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .brand-details-footer {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .auth-card {
          padding: 40px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .auth-header h2 {
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .auth-header p {
          font-size: 0.825rem;
          color: var(--text-secondary);
          margin-top: 4px;
        }

        /* RFID Scanner */
        .scanner-container-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .rfid-card-reader {
          height: 140px;
          border-radius: var(--border-radius-md);
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-normal);
        }

        .rfid-card-reader.scanning {
          border-color: rgba(245, 158, 11, 0.3);
          box-shadow: inset 0 0 12px rgba(245, 158, 11, 0.1);
        }

        .rfid-card-reader.success {
          border-color: rgba(16, 185, 129, 0.4);
          box-shadow: inset 0 0 16px rgba(16, 185, 129, 0.15);
        }

        .rfid-card-reader.error {
          border-color: rgba(244, 63, 94, 0.4);
          box-shadow: inset 0 0 16px rgba(244, 63, 94, 0.15);
        }

        .reader-scanner-laser {
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #06b6d4, transparent);
          top: 0;
          opacity: 0;
          z-index: 10;
        }

        .scanning .reader-scanner-laser {
          opacity: 1;
          background: linear-gradient(90deg, transparent, #d97706, transparent);
          animation: laser-sweep 1.5s infinite ease-in-out;
        }

        @keyframes laser-sweep {
          0% { top: 5%; }
          50% { top: 95%; }
          100% { top: 5%; }
        }

        .reader-display-panel {
          text-align: center;
          z-index: 5;
        }

        .reader-status-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .reader-status-icon {
          transition: all var(--transition-normal);
        }

        .reader-status-icon.idle { color: var(--text-muted); }
        .reader-status-icon.scanning { color: #f59e0b; }
        .reader-status-icon.success { color: var(--status-sufficient); }
        .reader-status-icon.error { color: var(--status-critical); }

        .animate-spin-pulse {
          animation: spin-p 2s infinite linear;
        }

        @keyframes spin-p {
          to { transform: rotate(360deg); }
        }

        .reader-text-status {
          font-size: 0.875rem;
          font-weight: 700;
          letter-spacing: 0.025em;
          color: var(--text-primary);
        }

        .reader-subtext {
          font-size: 0.725rem;
          color: var(--text-muted);
        }

        .success .reader-subtext {
          color: var(--status-sufficient);
          font-weight: 600;
        }

        .error .reader-subtext {
          color: var(--status-critical);
          font-weight: 600;
        }

        .reader-led-strip {
          position: absolute;
          top: 10px;
          right: 12px;
          display: flex;
          gap: 6px;
        }

        .led {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.03);
          transition: all var(--transition-fast);
        }

        .led.red.active { background: #f43f5e; box-shadow: 0 0 6px #f43f5e; }
        .led.amber.active { background: #f59e0b; box-shadow: 0 0 6px #f59e0b; }
        .led.green.active { background: #10b981; box-shadow: 0 0 6px #10b981; }

        .scanner-tag-form {
          display: flex;
          gap: 12px;
        }

        .rfid-input-box {
          flex-grow: 1;
          font-family: monospace;
          letter-spacing: 0.05em;
          padding: 10px 16px;
          border-radius: var(--border-radius-sm);
        }

        .rfid-submit-btn {
          width: 100px;
          padding: 0 16px;
          border-radius: var(--border-radius-sm);
        }

        .divider-text-row {
          display: flex;
          align-items: center;
          text-align: center;
          font-size: 0.65rem;
          color: var(--text-muted);
          font-weight: 800;
          letter-spacing: 0.1em;
        }

        .divider-text-row::before, .divider-text-row::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid var(--border-color);
        }

        .divider-text-row::before { margin-right: 16px; }
        .divider-text-row::after { margin-left: 16px; }

        /* Demo Profiles Deck */
        .demo-profiles-deck {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .demo-profile-card {
          padding: 16px;
          text-align: left;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-md);
          cursor: pointer;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 200px;
          transition: all var(--transition-normal);
        }

        .demo-profile-card:hover {
          transform: translateY(-4px);
          border-color: var(--profile-glow);
          box-shadow: 0 8px 24px var(--profile-glow);
          background: rgba(255, 255, 255, 0.03);
        }

        .profile-card-header {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .role-avatar-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          flex-shrink: 0;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
        }

        .role-meta-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .profile-card-title {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .profile-card-tag {
          font-family: monospace;
          font-size: 0.725rem;
          color: var(--text-secondary);
        }

        .profile-card-body {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 8px;
        }

        .profile-demo-user {
          font-family: 'Outfit', sans-serif;
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .privilege-checklist {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .privilege-bullet {
          font-size: 0.65rem;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .profile-card-action {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--text-muted);
          border-top: 1px solid var(--border-color);
          padding-top: 10px;
          margin-top: 8px;
          transition: color var(--transition-fast);
        }

        .demo-profile-card:hover .profile-card-action {
          color: var(--text-primary);
        }

        .arrow-action {
          transition: transform var(--transition-fast);
          color: var(--text-muted);
        }

        .demo-profile-card:hover .arrow-action {
          transform: translateX(4px);
          color: var(--text-primary);
        }

        @media (max-width: 900px) {
          .login-grid-container {
            grid-template-columns: 1fr;
          }
          .brand-card {
            display: none; /* Hide branding column on mobile for accessibility */
          }
          .demo-profiles-deck {
            grid-template-columns: 1fr;
          }
          .demo-profile-card {
            height: auto;
            min-height: 160px;
          }
        }
      `}</style>
    </div>
  );
};

export default LoginPortal;
