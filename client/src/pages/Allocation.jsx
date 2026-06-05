import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import axios from 'axios';
import { 
  GitMerge, 
  UserPlus, 
  BrainCircuit, 
  Activity, 
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Award,
  ShieldAlert,
  Sliders,
  Check
} from 'lucide-react';

const Allocation = () => {
  const { resources, staffUser, API_BASE, fetchResources, fetchLogs } = useApp();

  // Form States
  const [patientName, setPatientName] = useState('');
  const [condition, setCondition] = useState('Trauma / Hemorrhagic Shock');
  const [severity, setSeverity] = useState(3);
  const [ageGroup, setAgeGroup] = useState('Adult');
  const [specialReqs, setSpecialReqs] = useState('');

  // Recommendation & Action States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [allocationStatus, setAllocationStatus] = useState({ type: '', message: '' });

  // Get AI Triage Recommendation
  const handleGetRecommendation = async (e) => {
    e.preventDefault();
    if (!patientName.trim()) {
      setAllocationStatus({ type: 'error', message: 'Please enter patient name / code for logging.' });
      return;
    }

    try {
      setIsAnalyzing(true);
      setRecommendation(null);
      setAllocationStatus({ type: '', message: '' });

      const payload = {
        condition,
        severity: Number(severity),
        ageGroup,
        specialReqs
      };

      const res = await axios.post(`${API_BASE}/allocation/recommend`, payload);
      setRecommendation(res.data);
    } catch (err) {
      setAllocationStatus({ 
        type: 'error', 
        message: err.response?.data?.error || 'Failed to get recommendation from AI service.' 
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Commit Resource Allocation in database
  const handleCommitAllocation = async () => {
    if (!recommendation) return;

    try {
      setAllocationStatus({ type: 'progress', message: 'Allocating resources...' });

      const payload = {
        bedType: recommendation.bedType,
        equipmentNeeded: recommendation.equipment,
        medicinesNeeded: recommendation.medicines,
        bloodTypePrepared: recommendation.bloodTypePrepared,
        staffId: staffUser.id,
        staffName: staffUser.name,
        patientName,
        reason: `AI Triage recommended allocation for ${condition} (Severity ${severity}/5)`
      };

      await axios.post(`${API_BASE}/allocation/allocate`, payload);

      setAllocationStatus({
        type: 'success',
        message: `Successfully allocated all recommended assets to patient "${patientName}". Count decrements updated in database!`
      });

      // Clear recommendation after 6 seconds or keep it
      setTimeout(() => {
        setRecommendation(null);
        setPatientName('');
        setSpecialReqs('');
        setSeverity(3);
        setAllocationStatus({ type: '', message: '' });
      }, 6000);

      // Refresh contexts
      fetchResources();
      fetchLogs();
    } catch (err) {
      setAllocationStatus({
        type: 'error',
        message: err.response?.data?.error || 'Failed to commit resource allocations.'
      });
    }
  };

  // Verify real-time availability of recommended resources
  const getResourceAvailability = (itemType, subName) => {
    const matched = resources.find(r => 
      r.type === itemType && 
      (r.subType.toLowerCase() === subName.toLowerCase() || 
       subName.toLowerCase().includes(r.subType.toLowerCase()) ||
       r.subType.toLowerCase().includes(subName.toLowerCase()))
    );

    return matched ? {
      count: matched.currentCount,
      total: matched.totalCapacity,
      unit: matched.unit,
      status: matched.status
    } : null;
  };

  const patientConditionsList = [
    'Trauma / Hemorrhagic Shock',
    'Acute Respiratory Failure / COPD',
    'Cardiac Emergency / Chest Pain',
    'Post-operative Surgical recovery',
    'Active Obstetrics Labor',
    'Severe Anaphylaxis / Sepsis',
    'General Medical admission'
  ];

  return (
    <div className="allocation-page-wrapper">
      <div className="allocation-grid-layout">
        {/* Left Side: Patient Intake Form */}
        <section className="form-column">
          <div className="intake-form-card glass-panel">
            <div className="card-heading-row">
              <UserPlus className="icon-header-cyan" size={20} />
              <h3>Patient Triage Intake</h3>
            </div>

            <form onSubmit={handleGetRecommendation} className="intake-entry-form">
              {/* Patient Identifier */}
              <div className="form-group">
                <label className="form-label">Patient Name or Code</label>
                <input 
                  type="text" 
                  placeholder="Enter patient full name or trauma code (e.g. PT-940)"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="input-field select-full"
                  required
                />
              </div>

              {/* Primary Clinical Condition */}
              <div className="form-group">
                <label className="form-label">Clinical Condition</label>
                <select 
                  value={condition} 
                  onChange={(e) => setCondition(e.target.value)}
                  className="input-field select-full"
                  required
                >
                  {patientConditionsList.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Clinical Severity (1-5 slider) */}
              <div className="form-group">
                <div className="severity-slider-header">
                  <label className="form-label">Clinical Severity Level</label>
                  <span className={`severity-badge level-${severity}`}>
                    Level {severity} — {severity >= 4 ? 'CRITICAL' : severity >= 3 ? 'MODERATE' : 'STABLE'}
                  </span>
                </div>
                <div className="slider-container-row">
                  <Sliders size={14} className="slider-left-icon" />
                  <input 
                    type="range" 
                    min="1" 
                    max="5"
                    value={severity}
                    onChange={(e) => setSeverity(Number(e.target.value))}
                    className="severity-slider-input"
                  />
                </div>
                <div className="slider-ticks-labels">
                  <span>1 (Stable)</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5 (Arrest)</span>
                </div>
              </div>

              {/* Age Group */}
              <div className="form-group">
                <label className="form-label">Age Category</label>
                <div className="age-toggle-grid">
                  {['Neonatal', 'Pediatric', 'Adult', 'Geriatric'].map(age => {
                    const isSel = ageGroup === age;
                    return (
                      <button
                        key={age}
                        type="button"
                        onClick={() => setAgeGroup(age)}
                        className={`age-toggle-btn ${isSel ? 'active' : ''}`}
                      >
                        {age}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Special Requirements */}
              <div className="form-group">
                <label className="form-label">Special Clinical Requirements</label>
                <textarea 
                  rows="2"
                  placeholder="Describe oxygen needs, known drug allergies, blood typing specifications, custom surgical prep..."
                  value={specialReqs}
                  onChange={(e) => setSpecialReqs(e.target.value)}
                  className="input-field select-full textarea-field"
                ></textarea>
              </div>

              {/* Allocation error logs */}
              {allocationStatus.message && allocationStatus.type === 'error' && (
                <div className="feedback-banner error">
                  <span>{allocationStatus.message}</span>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isAnalyzing}
                className="btn-primary triage-analyze-btn"
              >
                <BrainCircuit size={16} className={isAnalyzing ? 'pulse-anim' : ''} />
                <span>{isAnalyzing ? 'Running Clinical AI Analysis...' : 'Request AI Recommendation'}</span>
              </button>
            </form>
          </div>
        </section>

        {/* Right Side: AI Triage Recommendation Panel */}
        <section className="recommendation-column">
          {/* Default Empty State */}
          {!recommendation && !isAnalyzing && (
            <div className="default-rec-state glass-panel">
              <BrainCircuit size={50} className="ai-brain-static-icon" />
              <h3>Clinical AI Decision Support</h3>
              <p>Enter patient intake vitals and click "Request AI Recommendation" on the left. The neural helper will assess current resource pools, allocate appropriate priorities, and map bed & medicine requirements instantly.</p>
            </div>
          )}

          {/* AI analyzing spinner */}
          {isAnalyzing && (
            <div className="default-rec-state analyzing glass-panel">
              <div className="analyzing-orbit">
                <div className="orbit-dot dot1"></div>
                <div className="orbit-dot dot2"></div>
                <div className="orbit-dot dot3"></div>
                <BrainCircuit size={32} className="orbit-center-icon" />
              </div>
              <h3>Running Decision Matrix</h3>
              <p>Evaluating ICU bed vacancy quotients, analyzing medication stock levels, checking blood bank reserves, and engineering clinical safety prompts...</p>
            </div>
          )}

          {/* AI Recommendation Content Card */}
          {recommendation && !isAnalyzing && (
            <div className={`recommendation-panel-card glass-panel pulse-cyan-border`}>
              <div className="rec-card-header">
                <BrainCircuit className="sparkle-ai-cyan" size={20} />
                <h3 className="title-gradient">AI Clinician Recommendation</h3>
                <div className={`triage-priority-badge ${recommendation.priority}`}>
                  {recommendation.priority.toUpperCase()} PRIORITY
                </div>
              </div>

              {/* Allocation grid list */}
              <div className="recommendations-details-grid">
                
                {/* 1. Bed recommendation */}
                <div className="rec-grid-item">
                  <span className="item-label">Recommended Bed Space</span>
                  <div className="item-value-wrapper">
                    <strong className="item-val">{recommendation.bedType} Bed</strong>
                    {(() => {
                      const avail = getResourceAvailability('beds', recommendation.bedType);
                      return avail ? (
                        <span className={`avail-status-tag ${avail.status}`}>
                          ({avail.count}/{avail.total} available)
                        </span>
                      ) : <span className="avail-status-tag unknown">(N/A)</span>;
                    })()}
                  </div>
                </div>

                {/* 2. Standby blood */}
                <div className="rec-grid-item">
                  <span className="item-label">Standby Blood Prep</span>
                  <div className="item-value-wrapper">
                    <strong className="item-val">Type {recommendation.bloodTypePrepared}</strong>
                    {(() => {
                      if (recommendation.bloodTypePrepared === 'None') return null;
                      const avail = getResourceAvailability('blood', recommendation.bloodTypePrepared);
                      return avail ? (
                        <span className={`avail-status-tag ${avail.status}`}>
                          ({avail.count}/{avail.total} bags)
                        </span>
                      ) : <span className="avail-status-tag unknown">(N/A)</span>;
                    })()}
                  </div>
                </div>

                {/* 3. Medical Equipment */}
                <div className="rec-grid-item full-width">
                  <span className="item-label">Required Devices & Monitors</span>
                  <div className="item-list-row">
                    {recommendation.equipment.length === 0 ? <span>None</span> : 
                      recommendation.equipment.map(eq => {
                        const avail = getResourceAvailability('equipment', eq) || getResourceAvailability('ventilators', eq);
                        return (
                          <div key={eq} className="item-pill">
                            <span className="item-pill-text">{eq}</span>
                            {avail && (
                              <span className={`pill-count-indicator ${avail.status}`}>
                                {avail.count} vacant
                              </span>
                            )}
                          </div>
                        );
                      })
                    }
                  </div>
                </div>

                {/* 4. Medicines */}
                <div className="rec-grid-item full-width">
                  <span className="item-label">Pre-authorized Medicines</span>
                  <div className="item-list-row">
                    {recommendation.medicines.length === 0 ? <span>None</span> : 
                      recommendation.medicines.map(med => {
                        const avail = getResourceAvailability('medicines', med);
                        return (
                          <div key={med} className="item-pill">
                            <span className="item-pill-text">{med}</span>
                            {avail && (
                              <span className={`pill-count-indicator ${avail.status}`}>
                                {avail.count} in stock
                              </span>
                            )}
                          </div>
                        );
                      })
                    }
                  </div>
                </div>
              </div>

              {/* Natural language clinical explanation */}
              <div className="clinical-reasoning-box">
                <div className="reasoning-heading">
                  <ShieldAlert size={14} className="alert-flash-icon" />
                  <span>Clinical Reasoning & Action Path</span>
                </div>
                <p className="reasoning-text">{recommendation.reasoning}</p>
              </div>

              {/* Feedback messages for action */}
              {allocationStatus.message && allocationStatus.type !== 'error' && (
                <div className={`allocation-feedback-banner ${allocationStatus.type}`}>
                  {allocationStatus.type === 'success' ? <CheckCircle size={16} /> : <div className="loading-spinner size-sm"></div>}
                  <span>{allocationStatus.message}</span>
                </div>
              )}

              {/* Submit/Allocate Button */}
              {allocationStatus.type !== 'success' && (
                <button 
                  onClick={handleCommitAllocation}
                  disabled={allocationStatus.type === 'progress'}
                  className="btn-primary allocate-action-submit-btn"
                >
                  <Check size={16} />
                  <span>Allocate Recommended Resources</span>
                </button>
              )}
            </div>
          )}
        </section>
      </div>

      <style>{`
        .allocation-page-wrapper {
          display: flex;
          flex-direction: column;
        }

        .allocation-grid-layout {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 24px;
          align-items: start;
        }

        .intake-form-card, .default-rec-state, .recommendation-panel-card {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .intake-entry-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .severity-slider-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .severity-badge {
          font-size: 0.65rem;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 6px;
          border: 1px solid transparent;
        }

        .severity-badge.level-1 { background: rgba(16, 185, 129, 0.08); border-color: rgba(16, 185, 129, 0.15); color: var(--status-sufficient); }
        .severity-badge.level-2 { background: rgba(16, 185, 129, 0.08); border-color: rgba(16, 185, 129, 0.15); color: var(--status-sufficient); }
        .severity-badge.level-3 { background: rgba(245, 158, 11, 0.08); border-color: rgba(245, 158, 11, 0.15); color: var(--status-low); }
        .severity-badge.level-4 { background: rgba(244, 63, 94, 0.08); border-color: rgba(244, 63, 94, 0.15); color: var(--status-critical); }
        .severity-badge.level-5 { background: rgba(244, 63, 94, 0.12); border-color: rgba(244, 63, 94, 0.3); color: var(--status-critical); animation: blink 1.5s infinite; }

        .slider-container-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 4px;
        }

        .slider-left-icon {
          color: var(--text-muted);
        }

        .severity-slider-input {
          flex-grow: 1;
          height: 6px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 99px;
          outline: none;
          -webkit-appearance: none;
          cursor: pointer;
        }

        .severity-slider-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--accent-cyan);
          box-shadow: 0 0 8px rgba(6, 182, 212, 0.5);
          transition: transform var(--transition-fast);
        }

        .severity-slider-input::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }

        .slider-ticks-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.625rem;
          color: var(--text-muted);
          padding: 0 4px;
        }

        .age-toggle-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        .age-toggle-btn {
          padding: 10px 4px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-sm);
          font-size: 0.725rem;
          font-weight: 500;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .age-toggle-btn:hover {
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-primary);
        }

        .age-toggle-btn.active {
          background: rgba(6, 182, 212, 0.1);
          border-color: var(--accent-cyan);
          color: var(--accent-cyan);
          font-weight: 600;
        }

        .triage-analyze-btn {
          width: 100%;
          padding: 12px;
          margin-top: 8px;
        }

        .pulse-anim {
          animation: spin-cw 2s infinite linear;
        }

        /* Recommendation columns styles */
        .default-rec-state {
          border-style: dashed;
          border-width: 2px;
          padding: 60px 40px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
        }

        .ai-brain-static-icon {
          color: var(--text-muted);
          opacity: 0.3;
        }

        .default-rec-state h3 {
          font-size: 1.15rem;
          font-weight: 600;
        }

        .default-rec-state p {
          font-size: 0.8rem;
          color: var(--text-secondary);
          max-width: 440px;
          line-height: 1.5;
        }

        .default-rec-state.analyzing {
          border-color: rgba(6, 182, 212, 0.2);
          background: rgba(6, 182, 212, 0.01);
        }

        .analyzing-orbit {
          position: relative;
          width: 72px;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
        }

        .orbit-center-icon {
          color: var(--accent-cyan);
          filter: drop-shadow(0 0 8px rgba(6, 182, 212, 0.4));
        }

        .orbit-dot {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent-cyan);
        }

        .orbit-dot.dot1 {
          animation: orbit-rev 2s infinite linear;
        }
        .orbit-dot.dot2 {
          animation: orbit-mid 3s infinite linear;
        }
        .orbit-dot.dot3 {
          animation: orbit-outer 4s infinite linear;
        }

        @keyframes orbit-rev {
          from { transform: rotate(0deg) translateX(24px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(24px) rotate(-360deg); }
        }
        @keyframes orbit-mid {
          from { transform: rotate(120deg) translateX(30px) rotate(-120deg); }
          to { transform: rotate(480deg) translateX(30px) rotate(-480deg); }
        }
        @keyframes orbit-outer {
          from { transform: rotate(240deg) translateX(36px) rotate(-240deg); }
          to { transform: rotate(600deg) translateX(36px) rotate(-600deg); }
        }

        /* AI Card design */
        .recommendation-panel-card {
          border-color: rgba(6, 182, 212, 0.35);
          box-shadow: 0 12px 40px rgba(6, 182, 212, 0.08);
        }

        .pulse-cyan-border {
          animation: cyan-border-pulse 4s infinite ease-in-out;
        }

        @keyframes cyan-border-pulse {
          0%, 100% { border-color: rgba(6, 182, 212, 0.35); }
          50% { border-color: rgba(6, 182, 212, 0.65); box-shadow: 0 12px 40px rgba(6, 182, 212, 0.15); }
        }

        .rec-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 16px;
        }

        .rec-card-header h3 {
          font-size: 1.15rem;
          font-weight: 600;
          flex-grow: 1;
        }

        .sparkle-ai-cyan {
          color: var(--accent-cyan);
          filter: drop-shadow(0 0 4px rgba(6, 182, 212, 0.4));
        }

        .triage-priority-badge {
          font-size: 0.65rem;
          font-weight: 800;
          padding: 4px 8px;
          border-radius: 6px;
          border: 1px solid transparent;
        }

        .triage-priority-badge.high { background: rgba(244, 63, 94, 0.1); border-color: rgba(244, 63, 94, 0.2); color: var(--status-critical); }
        .triage-priority-badge.medium { background: rgba(245, 158, 11, 0.1); border-color: rgba(245, 158, 11, 0.2); color: var(--status-low); }
        .triage-priority-badge.low { background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.2); color: var(--status-sufficient); }

        .recommendations-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .rec-grid-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid rgba(255, 255, 255, 0.03);
          padding: 12px 14px;
          border-radius: 8px;
        }

        .rec-grid-item.full-width {
          grid-column: 1 / span 2;
        }

        .item-label {
          font-size: 0.65rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.025em;
          font-weight: 700;
        }

        .item-value-wrapper {
          display: flex;
          align-items: baseline;
          flex-wrap: wrap;
          gap: 6px;
        }

        .item-val {
          font-size: 0.95rem;
          color: var(--text-primary);
          font-weight: 600;
        }

        .avail-status-tag {
          font-size: 0.675rem;
          font-weight: 500;
        }

        .avail-status-tag.sufficient { color: var(--status-sufficient); }
        .avail-status-tag.low { color: var(--status-low); }
        .avail-status-tag.critical { color: var(--status-critical); }
        .avail-status-tag.unknown { color: var(--text-muted); }

        .item-list-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 2px;
        }

        .item-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-color);
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.725rem;
        }

        .item-pill-text {
          color: var(--text-primary);
          font-weight: 500;
        }

        .pill-count-indicator {
          font-size: 0.6rem;
          font-weight: 700;
          padding: 1px 4px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.05);
        }

        .pill-count-indicator.sufficient { color: var(--status-sufficient); }
        .pill-count-indicator.low { color: var(--status-low); }
        .pill-count-indicator.critical { color: var(--status-critical); }

        .clinical-reasoning-box {
          background: rgba(6, 182, 212, 0.02);
          border: 1px solid rgba(6, 182, 212, 0.1);
          padding: 14px 16px;
          border-radius: var(--border-radius-sm);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .reasoning-heading {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.7rem;
          font-weight: 800;
          color: var(--accent-cyan);
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .alert-flash-icon {
          color: var(--accent-cyan);
          animation: blink 2s infinite;
        }

        .reasoning-text {
          font-size: 0.775rem;
          line-height: 1.5;
          color: var(--text-primary);
        }

        .allocation-feedback-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: var(--status-sufficient);
          border-radius: var(--border-radius-sm);
          font-size: 0.775rem;
          font-weight: 600;
          line-height: 1.4;
          animation: slide-dn 0.25s forwards;
        }

        .allocation-feedback-banner svg {
          flex-shrink: 0;
        }

        .loading-spinner.size-sm {
          width: 14px;
          height: 14px;
          border-width: 2px;
        }

        .allocate-action-submit-btn {
          width: 100%;
          padding: 12px;
          margin-top: 4px;
        }

        @media (max-width: 900px) {
          .allocation-grid-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Allocation;
