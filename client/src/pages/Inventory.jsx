import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import axios from 'axios';
import { 
  Boxes, 
  History, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  Minus,
  AlertTriangle,
  MoveRight,
  UserCheck,
  ScanLine,
  Camera,
  CameraOff,
  Calendar,
  Layers,
  Truck,
  CheckCircle,
  Clock
} from 'lucide-react';

const Inventory = ({ preselectedResourceId, clearPreselection }) => {
  const { resources, logs, staffUser, fetchLogs, fetchResources, API_BASE, loading } = useApp();

  // Form States
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [action, setAction] = useState('consume');
  const [quantity, setQuantity] = useState(1);
  const [transferDept, setTransferDept] = useState('ICU');
  const [reason, setReason] = useState('Routine patient admission');
  const [customReason, setCustomReason] = useState('');
  
  // Feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Medicine Scanner states
  const [medicineTags, setMedicineTags] = useState([]);
  const [scannedTag, setScannedTag] = useState(null);
  const [scanState, setScanState] = useState('idle'); // idle | scanning | success | error
  const [useCamera, setUseCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);

  // Fetch pre-seeded medicine tags from server
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await axios.get(`${API_BASE}/inventory/medicine-tags`);
        setMedicineTags(res.data);
      } catch (err) {
        console.error("Error fetching medicine tags:", err);
      }
    };
    fetchTags();
  }, [API_BASE]);

  // Handle pre-selection from dashboard shortcut
  useEffect(() => {
    if (preselectedResourceId) {
      setSelectedResourceId(preselectedResourceId);
      setAction('consume');
      setTimeout(() => clearPreselection(), 100);
    } else if (resources.length > 0 && !selectedResourceId) {
      setSelectedResourceId(resources[0].id);
    }
  }, [preselectedResourceId, resources]);

  const activeResource = resources.find(r => r.id === selectedResourceId);

  // Auto set reasons based on action
  useEffect(() => {
    if (action === 'restock') {
      setReason('Restocking delivery received');
    } else if (action === 'transfer') {
      setReason('Inter-departmental transfer');
    } else {
      setReason('Routine patient admission');
    }
  }, [action]);

  // Webcam stream handlers
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 320, height: 240, facingMode: 'environment' } 
      });
      setCameraStream(stream);
      setUseCamera(true);
    } catch (err) {
      console.warn("Camera access denied or unavailable:", err);
      alert("Webcam access denied or unavailable. Falling back to glassmorphic virtual scan suite!");
      setUseCamera(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setUseCamera(false);
  };

  useEffect(() => {
    if (useCamera && videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [useCamera, cameraStream]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Handle scanning a medicine tag
  const handleScanTag = (tagCode) => {
    setScanState('scanning');
    setScannedTag(null);
    stopCamera();

    // Smooth delay for high-fidelity scanning laser sweep simulation
    setTimeout(async () => {
      try {
        const res = await axios.get(`${API_BASE}/inventory/medicine-tags/${tagCode}`);
        setScannedTag(res.data);
        setScanState('success');
      } catch (err) {
        console.error("Scan error:", err);
        setScanState('error');
        setTimeout(() => setScanState('idle'), 2000);
      }
    }, 1400);
  };

  // Auto-fill scanned data into inventory form
  const handleAutoFill = () => {
    if (!scannedTag) return;
    
    const matchedResource = resources.find(r => r.id === scannedTag.resourceId || r.subType.toLowerCase() === scannedTag.subType.toLowerCase());
    if (matchedResource) {
      setSelectedResourceId(matchedResource.id);
    }
    setQuantity(scannedTag.quantity);
    setAction('add');
    setReason('Restocking delivery received');
    setCustomReason(`Scanned Tag Restock Batch ${scannedTag.batch} | Supplier: ${scannedTag.supplier} | MFG: ${scannedTag.mfgDate} | EXP: ${scannedTag.expDate}`);
  };

  // Direct RESTOCK registration from scanned tag
  const handleDirectRegister = async () => {
    if (!scannedTag) return;

    const matchedResource = resources.find(r => r.id === scannedTag.resourceId || r.subType.toLowerCase() === scannedTag.subType.toLowerCase());
    if (!matchedResource) {
      setFeedback({ type: 'error', message: 'Could not resolve matched inventory resource' });
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback({ type: '', message: '' });

      const payload = {
        resourceId: matchedResource.id,
        action: 'add',
        quantity: scannedTag.quantity,
        staffId: staffUser.id,
        staffName: staffUser.name,
        reason: `Auto-Scanned Tag restock | Batch: ${scannedTag.batch} | EXP: ${scannedTag.expDate} | Supplier: ${scannedTag.supplier}`
      };

      const res = await axios.post(`${API_BASE}/inventory/update`, payload);

      setFeedback({ 
        type: 'success', 
        message: `Registered Tag Restock! Batch ${scannedTag.batch} added (+${scannedTag.quantity} ${matchedResource.unit}).` 
      });

      // Clear scan telemetry
      setScannedTag(null);
      setScanState('idle');

      // Re-fetch
      fetchResources();
      fetchLogs();
      
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    } catch (err) {
      setFeedback({ 
        type: 'error', 
        message: err.response?.data?.error || 'Direct Restock registration failed' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Date countdown helper
  const getExpiryTelemetry = (expDate) => {
    const exp = new Date(expDate);
    const now = new Date();
    const diffTime = exp.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
      return {
        status: 'expired',
        class: 'expired',
        message: `🚨 EXPIRED (Expired ${Math.abs(diffDays)} days ago) - DO NOT ADMINISTER!`,
        days: diffDays
      };
    } else if (diffDays <= 90) {
      return {
        status: 'warning',
        class: 'warning',
        message: `⚠️ EXPIRING SOON (${diffDays} days remaining) - Prioritize depletion!`,
        days: diffDays
      };
    } else {
      return {
        status: 'safe',
        class: 'safe',
        message: `✅ BATCH SAFE (${diffDays} days remaining)`,
        days: diffDays
      };
    }
  };

  // Validations
  const getValidationError = () => {
    if (!selectedResourceId) return 'Please select a resource';
    if (!quantity || quantity <= 0) return 'Quantity must be greater than zero';
    
    if (activeResource) {
      if ((action === 'consume' || action === 'transfer') && activeResource.currentCount < quantity) {
        return `Insufficient inventory. Available: ${activeResource.currentCount} ${activeResource.unit}`;
      }
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErr = getValidationError();
    if (validationErr) {
      setFeedback({ type: 'error', message: validationErr });
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback({ type: '', message: '' });

      const payload = {
        resourceId: selectedResourceId,
        action,
        quantity: Number(quantity),
        staffId: staffUser.id,
        staffName: staffUser.name,
        reason: customReason ? `${reason}: ${customReason}` : reason,
        transferToDepartment: action === 'transfer' ? transferDept : undefined
      };

      const res = await axios.post(`${API_BASE}/inventory/update`, payload);

      setFeedback({ 
        type: 'success', 
        message: `Successfully logged inventory change! Count updated to ${res.data.resource.currentCount}.` 
      });

      // Reset form variables
      setQuantity(1);
      setCustomReason('');
      
      // Re-fetch
      fetchResources();
      fetchLogs();
      
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    } catch (err) {
      setFeedback({ 
        type: 'error', 
        message: err.response?.data?.error || 'Failed to submit update. Check server connections.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pre-configured reasons based on actions
  const reasonPresets = {
    consume: [
      'Routine patient admission',
      'Emergency intake',
      'Regular utilization',
      'Scheduled surgery allocation',
      'Active patient recovery update',
      'Wastage due to expiry/damage'
    ],
    add: [
      'Restocking delivery received',
      'Emergency backup intake',
      'Found/Returned item to stock',
      'New equipment commissioning'
    ],
    restock: [
      'Restocking delivery received',
      'Emergency backup transfer',
      'Monthly replenishment supply'
    ],
    transfer: [
      'Inter-departmental transfer',
      'Emergency ICU backup request',
      'Overflow balancing transfer'
    ]
  };

  const departments = ['ICU', 'Emergency', 'General Ward', 'OT', 'Pharmacy'];

  return (
    <div className="inventory-page-wrapper">
      <div className="inventory-grid-layout">
        
        {/* Column 1: High-Tech Medicine Tag Scanner */}
        <section className="scanner-column">
          <div className="update-form-card glass-panel flex-col-card">
            <div className="card-heading-row">
              <ScanLine className="icon-header-teal" size={20} />
              <h3>OptiWard Medicine Scanner</h3>
            </div>

            {/* Virtual Scan Window */}
            <div className={`scan-viewport ${scanState}`}>
              <span className="target-bracket top-left"></span>
              <span className="target-bracket top-right"></span>
              <span className="target-bracket bottom-left"></span>
              <span className="target-bracket bottom-right"></span>

              <div className="scan-line-laser"></div>

              {useCamera ? (
                <div className="camera-feed-container">
                  <video ref={videoRef} autoPlay playsInline className="video-viewport"></video>
                  <button onClick={stopCamera} className="camera-toggle-overlay">
                    <CameraOff size={14} /> Stop Camera
                  </button>
                </div>
              ) : (
                <div className="viewport-overlay-graphics">
                  {scanState === 'idle' && (
                    <div className="scan-status-group">
                      <ScanLine className="viewport-status-icon idle" size={32} />
                      <span className="viewport-status-text">Scanner Standby</span>
                      <span className="viewport-status-sub">Scan tag or choose package below</span>
                    </div>
                  )}
                  {scanState === 'scanning' && (
                    <div className="scan-status-group">
                      <ScanLine className="viewport-status-icon scanning animate-pulse-scale" size={32} />
                      <span className="viewport-status-text">Optical Decoding...</span>
                      <span className="viewport-status-sub">Extracting MFG & EXP Date</span>
                    </div>
                  )}
                  {scanState === 'success' && (
                    <div className="scan-status-group">
                      <CheckCircle className="viewport-status-icon success" size={32} />
                      <span className="viewport-status-text">Decoded Successfully</span>
                      <span className="viewport-status-sub">{scannedTag?.name} tag identified</span>
                    </div>
                  )}
                </div>
              )}

              {/* Scan Ready LED */}
              <div className="scan-led-indicator">
                <span className={`led-dot ${scanState}`}></span>
              </div>
            </div>

            {/* Camera Trigger */}
            {!useCamera && (
              <button onClick={startCamera} className="btn-secondary cam-btn">
                <Camera size={14} />
                <span>Activate Webcam Scanner</span>
              </button>
            )}

            {/* Demo Medicine Roll Deck */}
            <div className="medicine-roll-wrapper">
              <span className="deck-label">Virtual Pharmacy Stock Deck:</span>
              <div className="medicine-deck-grid">
                {medicineTags.map(tag => {
                  let badgeClass = 'safe';
                  const now = new Date();
                  const exp = new Date(tag.expDate);
                  const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));
                  if (diffDays <= 0) badgeClass = 'expired';
                  else if (diffDays <= 90) badgeClass = 'warning';

                  return (
                    <button
                      key={tag.tagCode}
                      onClick={() => handleScanTag(tag.tagCode)}
                      disabled={scanState === 'scanning'}
                      className={`med-tag-capsule ${badgeClass}`}
                    >
                      <span className="med-tag-name">{tag.name}</span>
                      <span className="med-tag-code">{tag.tagCode}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Telemetry Output Screen */}
            {scannedTag && (
              <div className="telemetry-output-panel glass-panel animate-slide">
                <div className="telemetry-header">
                  <span className="telemetry-title">Scanned Tag Telemetry</span>
                  <span className="telemetry-tag-pill">{scannedTag.tagCode}</span>
                </div>

                <div className="telemetry-body">
                  <div className="telemetry-row">
                    <span className="tel-label">Medicine:</span>
                    <span className="tel-val bold">{scannedTag.name}</span>
                  </div>
                  <div className="telemetry-row">
                    <span className="tel-label"><Calendar size={12} /> MFG Date:</span>
                    <span className="tel-val">{scannedTag.mfgDate}</span>
                  </div>
                  <div className="telemetry-row">
                    <span className="tel-label"><Clock size={12} /> EXP Date:</span>
                    <span className="tel-val bold">{scannedTag.expDate}</span>
                  </div>
                  <div className="telemetry-row">
                    <span className="tel-label"><Layers size={12} /> Batch:</span>
                    <span className="tel-val code-font">{scannedTag.batch}</span>
                  </div>
                  <div className="telemetry-row">
                    <span className="tel-label"><Truck size={12} /> Supplier:</span>
                    <span className="tel-val">{scannedTag.supplier}</span>
                  </div>

                  {/* Dynamic Expiry Alert Countdown */}
                  {(() => {
                    const info = getExpiryTelemetry(scannedTag.expDate);
                    return (
                      <div className={`telemetry-expiry-alert ${info.class}`}>
                        <span>{info.message}</span>
                      </div>
                    );
                  })()}
                </div>

                {/* Integration Actions */}
                <div className="telemetry-actions-row">
                  <button onClick={handleAutoFill} className="btn-secondary btn-compact flex-grow-btn">
                    <span>Fill Form</span>
                  </button>
                  <button 
                    onClick={handleDirectRegister} 
                    disabled={isSubmitting || getExpiryTelemetry(scannedTag.expDate).status === 'expired'} 
                    className="btn-primary btn-compact flex-grow-btn"
                  >
                    <span>Receive Tag</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Column 2: Log Resource Modification Form */}
        <section className="form-column">
          <div className="update-form-card glass-panel">
            <div className="card-heading-row">
              <Boxes className="icon-header-teal" size={20} />
              <h3>Log Resource Modification</h3>
            </div>
            
            <form onSubmit={handleSubmit} className="inventory-entry-form">
              {/* Active staff header */}
              <div className="active-staff-banner">
                <UserCheck size={13} />
                <span>Logging as: <strong>{staffUser?.name} ({staffUser?.id})</strong></span>
              </div>

              {/* Resource Select */}
              <div className="form-group">
                <label className="form-label">Resource Item</label>
                <select 
                  value={selectedResourceId} 
                  onChange={(e) => setSelectedResourceId(e.target.value)}
                  className="input-field select-full"
                  required
                >
                  <option value="" disabled>-- Select Resource --</option>
                  {resources.map(r => (
                    <option key={r.id} value={r.id}>
                      [{r.department}] {r.subType} {r.name} — Current: {r.currentCount} {r.unit}
                    </option>
                  ))}
                </select>
                {activeResource && (
                  <span className="stock-counter-helper">
                    Active Stock: <strong>{activeResource.currentCount}</strong> of <strong>{activeResource.totalCapacity} {activeResource.unit}</strong>
                  </span>
                )}
              </div>

              {/* Action Select */}
              <div className="form-group">
                <label className="form-label">Transaction Action</label>
                <div className="action-button-toggle-grid">
                  {[
                    { id: 'consume', label: 'Consume / Alloc', icon: Minus },
                    { id: 'add', label: 'Add Stock', icon: Plus },
                    { id: 'transfer', label: 'Transfer Out', icon: MoveRight }
                  ].map(act => {
                    const isSel = action === act.id;
                    const ActIcon = act.icon;
                    return (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => setAction(act.id)}
                        className={`action-toggle-btn ${isSel ? 'active' : ''}`}
                      >
                        <ActIcon size={14} />
                        <span>{act.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Transfer Target (Conditional) */}
              {action === 'transfer' && (
                <div className="form-group animate-slide">
                  <label className="form-label">Transfer Destination Ward</label>
                  <select 
                    value={transferDept}
                    onChange={(e) => setTransferDept(e.target.value)}
                    className="input-field select-full"
                    required
                  >
                    {departments
                      .filter(d => activeResource ? d !== activeResource.department : true)
                      .map(d => (
                        <option key={d} value={d}>{d} Ward</option>
                      ))
                    }
                  </select>
                </div>
              )}

              {/* Quantity */}
              <div className="form-group">
                <label className="form-label">Change Quantity</label>
                <div className="quantity-counter-widget">
                  <button 
                    type="button" 
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    className="qty-btn"
                  >
                    -
                  </button>
                  <input 
                    type="number" 
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    className="qty-input"
                  />
                  <button 
                    type="button" 
                    onClick={() => setQuantity(prev => prev + 1)}
                    className="qty-btn"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Reason Selector */}
              <div className="form-group">
                <label className="form-label">Reason Category</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="input-field select-full"
                  required
                >
                  {(reasonPresets[action] || reasonPresets.consume).map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Custom Details Input */}
              <div className="form-group">
                <label className="form-label">Additional Comments (Optional)</label>
                <textarea 
                  rows="2"
                  placeholder="Enter specific details, patient initials, case notes..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="input-field select-full textarea-field"
                ></textarea>
              </div>

              {/* Dynamic Warning Alert Box */}
              {activeResource && action === 'consume' && (activeResource.currentCount - quantity <= activeResource.thresholds.warning) && (
                <div className="form-threshold-warning-panel">
                  <AlertTriangle size={15} className="warning-pulse-icon" />
                  <span className="warning-text">
                    {activeResource.currentCount - quantity <= activeResource.thresholds.critical
                      ? `CAUTION: This will drop ${activeResource.subType} below CRITICAL threshold (${activeResource.thresholds.critical} ${activeResource.unit})!`
                      : `Note: This will drop ${activeResource.subType} below WARNING threshold (${activeResource.thresholds.warning} ${activeResource.unit}).`
                    }
                  </span>
                </div>
              )}

              {/* Feedback Message */}
              {feedback.message && (
                <div className={`feedback-banner ${feedback.type}`}>
                  <span>{feedback.message}</span>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="btn-primary form-submit-btn"
              >
                <span>{isSubmitting ? 'Logging changes...' : 'Submit Transaction'}</span>
              </button>
            </form>
          </div>
        </section>

        {/* Column 3: Live Logs History Feed */}
        <section className="history-column">
          <div className="history-feed-card glass-panel">
            <div className="card-heading-row">
              <History className="icon-header-cyan" size={20} />
              <h3>Recent Update History</h3>
              <div className="socket-ticker">
                <span className="ticker-pulse"></span>
                <span>REAL-TIME SYNCED</span>
              </div>
            </div>

            {loading.logs ? (
              <div className="loading-history">
                <div className="loading-spinner"></div>
                <span>Filtering clinical update history...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="empty-history-feed">
                <p>No transactions have been logged in this ward today.</p>
              </div>
            ) : (
              <div className="logs-feed-scroll">
                {logs.map(log => {
                  const isNegative = log.change < 0;
                  return (
                    <div key={log.id} className="log-feed-item">
                      <div className={`log-indicator-stripe ${isNegative ? 'negative' : 'positive'}`}>
                        {isNegative ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}
                      </div>

                      <div className="log-content-body">
                        <div className="log-meta-row">
                          <span className="log-timestamp">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                          <span className="log-staff-badge">{log.staffName} ({log.staffId})</span>
                        </div>

                        <div className="log-action-text">
                          <strong className="resource-sub-type">{log.subType} {log.resourceType === 'beds' ? 'Bed' : log.resourceType}</strong>
                          <span className="log-action-verb">
                            {log.action === 'restock' ? ' restocked ' : isNegative ? ' consumed ' : ' added '}
                          </span>
                          <strong className={`log-qty ${isNegative ? 'neg' : 'pos'}`}>
                            {isNegative ? '' : '+'}{log.change}
                          </strong>
                          <span className="log-dept-tag">({log.department} ward)</span>
                        </div>

                        <div className="log-reason-note">
                          <span>{log.reason}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      <style>{`
        .inventory-page-wrapper {
          display: flex;
          flex-direction: column;
        }

        .inventory-grid-layout {
          display: grid;
          grid-template-columns: 1.1fr 1fr 1.1fr;
          gap: 20px;
          align-items: start;
        }

        .update-form-card, .history-feed-card {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .flex-col-card {
          min-height: 520px;
          justify-content: flex-start;
        }

        .card-heading-row {
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 10px;
        }

        .card-heading-row h3 {
          font-size: 1rem;
          font-weight: 600;
          flex-grow: 1;
        }

        .icon-header-teal { color: var(--accent-cyan); }
        .icon-header-cyan { color: var(--accent-blue); }

        .socket-ticker {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.625rem;
          font-weight: 800;
          color: var(--status-sufficient);
          border: 1px solid rgba(16, 185, 129, 0.2);
          background: rgba(16, 185, 129, 0.04);
          padding: 2px 6px;
          border-radius: 99px;
        }

        .ticker-pulse {
          width: 4px;
          height: 4px;
          background: var(--status-sufficient);
          border-radius: 50%;
          animation: pulse-em 2s infinite;
        }

        /* Scanner Specific Styles */
        .scan-viewport {
          height: 160px;
          border-radius: var(--border-radius-md);
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-color);
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-normal);
        }

        .scan-viewport.scanning {
          border-color: rgba(6, 182, 212, 0.3);
          box-shadow: inset 0 0 12px rgba(6, 182, 212, 0.1);
        }

        .scan-viewport.success {
          border-color: rgba(16, 185, 129, 0.4);
          box-shadow: inset 0 0 12px rgba(16, 185, 129, 0.1);
        }

        .scan-line-laser {
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #06b6d4, transparent);
          top: 0;
          opacity: 0;
          z-index: 10;
        }

        .scanning .scan-line-laser {
          opacity: 1;
          animation: laser-sweep 1.5s infinite ease-in-out;
        }

        .target-bracket {
          position: absolute;
          width: 12px;
          height: 12px;
          border: 2px solid var(--text-muted);
          z-index: 5;
          opacity: 0.6;
        }

        .scanning .target-bracket {
          border-color: var(--accent-cyan);
          opacity: 1;
        }

        .target-bracket.top-left { top: 12px; left: 12px; border-right: none; border-bottom: none; }
        .target-bracket.top-right { top: 12px; right: 12px; border-left: none; border-bottom: none; }
        .target-bracket.bottom-left { bottom: 12px; left: 12px; border-right: none; border-top: none; }
        .target-bracket.bottom-right { bottom: 12px; right: 12px; border-left: none; border-top: none; }

        .viewport-overlay-graphics {
          text-align: center;
        }

        .scan-status-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .viewport-status-icon {
          color: var(--text-muted);
        }

        .viewport-status-icon.scanning { color: var(--accent-cyan); }
        .viewport-status-icon.success { color: var(--status-sufficient); }

        .animate-pulse-scale {
          animation: pulse-s 1.5s infinite ease-in-out;
        }

        @keyframes pulse-s {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }

        .viewport-status-text {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .viewport-status-sub {
          font-size: 0.675rem;
          color: var(--text-muted);
        }

        .scan-led-indicator {
          position: absolute;
          top: 10px;
          right: 12px;
        }

        .led-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          display: inline-block;
        }

        .led-dot.scanning { background: #f59e0b; box-shadow: 0 0 6px #f59e0b; }
        .led-dot.success { background: #10b981; box-shadow: 0 0 6px #10b981; }

        .camera-feed-container {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .video-viewport {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .camera-toggle-overlay {
          position: absolute;
          bottom: 8px;
          right: 8px;
          background: rgba(0, 0, 0, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #fff;
          font-size: 0.65rem;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .cam-btn {
          width: 100%;
          padding: 8px;
          font-size: 0.775rem;
        }

        /* Demo Medication Deck */
        .medicine-roll-wrapper {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .deck-label {
          font-size: 0.675rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          font-weight: 700;
        }

        .medicine-deck-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          max-height: 130px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .med-tag-capsule {
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          background: var(--button-hover);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-sm);
          cursor: pointer;
          text-align: left;
          transition: all var(--transition-fast);
        }

        .med-tag-capsule:hover {
          background: rgba(255, 255, 255, 0.03);
          transform: translateY(-1px);
        }

        .med-tag-capsule.safe:hover { border-color: rgba(16, 185, 129, 0.3); }
        .med-tag-capsule.warning:hover { border-color: rgba(245, 158, 11, 0.3); }
        .med-tag-capsule.expired:hover { border-color: rgba(244, 63, 94, 0.3); }

        .med-tag-name {
          font-size: 0.725rem;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .med-tag-code {
          font-family: monospace;
          font-size: 0.6rem;
          color: var(--text-muted);
        }

        /* Telemetry Panel */
        .telemetry-output-panel {
          padding: 12px;
          background: rgba(0, 0, 0, 0.15);
          border-radius: var(--border-radius-md);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .telemetry-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 6px;
        }

        .telemetry-title {
          font-family: 'Outfit', sans-serif;
          font-size: 0.775rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .telemetry-tag-pill {
          font-family: monospace;
          font-size: 0.65rem;
          font-weight: 700;
          color: var(--accent-cyan);
          background: rgba(6, 182, 212, 0.1);
          padding: 1px 6px;
          border-radius: 4px;
        }

        .telemetry-body {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .telemetry-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.725rem;
        }

        .tel-label {
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .tel-val {
          color: var(--text-secondary);
        }

        .tel-val.bold {
          color: var(--text-primary);
          font-weight: 700;
        }

        .tel-val.code-font {
          font-family: monospace;
          font-weight: 600;
        }

        .telemetry-expiry-alert {
          border-radius: 4px;
          padding: 6px 10px;
          font-size: 0.65rem;
          font-weight: 700;
          text-align: center;
          margin-top: 4px;
        }

        .telemetry-expiry-alert.expired {
          background: rgba(244, 63, 94, 0.1);
          color: var(--status-critical);
          border: 1px solid rgba(244, 63, 94, 0.2);
        }

        .telemetry-expiry-alert.warning {
          background: rgba(245, 158, 11, 0.1);
          color: var(--status-low);
          border: 1px solid rgba(245, 158, 11, 0.2);
        }

        .telemetry-expiry-alert.safe {
          background: rgba(16, 185, 129, 0.1);
          color: var(--status-sufficient);
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .telemetry-actions-row {
          display: flex;
          gap: 8px;
          margin-top: 4px;
        }

        .btn-compact {
          padding: 6px 10px;
          font-size: 0.7rem;
        }

        .flex-grow-btn {
          flex-grow: 1;
        }

        .active-staff-banner {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--button-hover);
          border: 1px solid var(--border-color);
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.725rem;
          color: var(--text-secondary);
          margin-bottom: 4px;
        }

        .active-staff-banner strong {
          color: var(--accent-cyan);
        }

        .inventory-entry-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .form-label {
          font-size: 0.7rem;
          color: var(--text-secondary);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .select-full {
          width: 100%;
        }

        .stock-counter-helper {
          font-size: 0.65rem;
          color: var(--text-muted);
          margin-top: 1px;
        }

        .stock-counter-helper strong {
          color: var(--text-secondary);
        }

        .action-button-toggle-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .action-toggle-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px;
          background: var(--button-hover);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-sm);
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .action-toggle-btn:hover {
          background: var(--button-hover);
          color: var(--text-primary);
        }

        .action-toggle-btn.active {
          background: rgba(6, 182, 212, 0.1);
          border-color: var(--accent-cyan);
          color: var(--accent-cyan);
          font-weight: 600;
        }

        .quantity-counter-widget {
          display: flex;
          align-items: center;
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-sm);
          overflow: hidden;
          width: 130px;
          background: var(--button-hover);
        }

        .qty-btn {
          flex: 1;
          height: 32px;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 1rem;
          cursor: pointer;
          transition: background var(--transition-fast);
        }

        .qty-btn:hover {
          background: var(--button-hover);
          color: var(--text-primary);
        }

        .qty-input {
          width: 44px;
          height: 32px;
          background: transparent;
          border: none;
          border-left: 1px solid var(--border-color);
          border-right: 1px solid var(--border-color);
          text-align: center;
          color: var(--text-primary);
          font-family: monospace;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .qty-input::-webkit-outer-spin-button,
        .qty-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .textarea-field {
          resize: none;
        }

        .form-threshold-warning-panel {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          background: rgba(244, 63, 94, 0.05);
          border: 1px solid rgba(244, 63, 94, 0.2);
          border-radius: var(--border-radius-sm);
          padding: 8px 12px;
        }

        .warning-pulse-icon {
          color: var(--status-critical);
          animation: blink 1.5s infinite;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .warning-text {
          font-size: 0.675rem;
          color: var(--status-critical);
          font-weight: 600;
          line-height: 1.3;
        }

        .feedback-banner {
          padding: 8px 12px;
          border-radius: var(--border-radius-sm);
          font-size: 0.725rem;
          font-weight: 600;
        }

        .feedback-banner.success {
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: var(--status-sufficient);
        }

        .feedback-banner.error {
          background: rgba(244, 63, 94, 0.08);
          border: 1px solid rgba(244, 63, 94, 0.2);
          color: var(--status-critical);
        }

        .form-submit-btn {
          width: 100%;
          padding: 10px;
          font-size: 0.825rem;
        }

        /* History Scroll layout */
        .logs-feed-scroll {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 480px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .log-feed-item {
          display: flex;
          gap: 12px;
          padding: 10px;
          background: var(--button-hover);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-sm);
          transition: all var(--transition-fast);
        }

        .log-feed-item:hover {
          background: var(--button-hover);
          border-color: rgba(6, 182, 212, 0.2);
        }

        .log-indicator-stripe {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .log-indicator-stripe.negative {
          background: rgba(244, 63, 94, 0.08);
          color: var(--status-critical);
          border: 1px solid rgba(244, 63, 94, 0.15);
        }

        .log-indicator-stripe.positive {
          background: rgba(16, 185, 129, 0.08);
          color: var(--status-sufficient);
          border: 1px solid rgba(16, 185, 129, 0.15);
        }

        .log-content-body {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex-grow: 1;
        }

        .log-meta-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.6rem;
          color: var(--text-muted);
        }

        .log-staff-badge {
          color: var(--text-secondary);
          font-weight: 500;
        }

        .log-action-text {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .resource-sub-type {
          color: var(--text-primary);
        }

        .log-qty.pos { color: var(--status-sufficient); }
        .log-qty.neg { color: var(--status-critical); }

        .log-dept-tag {
          color: var(--text-muted);
          font-size: 0.675rem;
          margin-left: 2px;
        }

        .log-reason-note {
          font-size: 0.675rem;
          color: var(--text-muted);
          font-style: italic;
          background: var(--bg-tertiary);
          padding: 4px 8px;
          border-radius: 4px;
          margin-top: 2px;
        }

        .animate-slide {
          animation: slide-dn 0.25s forwards;
        }

        @keyframes slide-dn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .loading-history {
          padding: 60px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          color: var(--text-muted);
          font-size: 0.775rem;
        }

        @media (max-width: 1200px) {
          .inventory-grid-layout {
            grid-template-columns: 1fr 1fr;
          }
          .history-column {
            grid-column: span 2;
          }
        }

        @media (max-width: 800px) {
          .inventory-grid-layout {
            grid-template-columns: 1fr;
          }
          .history-column {
            grid-column: span 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Inventory;
