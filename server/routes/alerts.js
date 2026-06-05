const express = require('express');
const router = express.Router();
const db = require('../services/dbService');
const { runPredictiveAnalysis } = require('../services/predictionService');

// Get active alerts
router.get('/', (req, res) => {
  try {
    const alerts = db.find('alerts', { status: 'active' });
    // Sort by severity (critical first) and then timeToDepletion (lowest first)
    alerts.sort((a, b) => {
      if (a.severity === 'critical' && b.severity !== 'critical') return -1;
      if (a.severity !== 'critical' && b.severity === 'critical') return 1;
      return a.timeToDepletion - b.timeToDepletion;
    });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Acknowledge / Dismiss alert
router.post('/:id/acknowledge', (req, res) => {
  try {
    const alert = db.findById('alerts', req.params.id);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const updatedAlert = db.updateById('alerts', req.params.id, {
      status: 'acknowledged',
      acknowledgedAt: new Date().toISOString()
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('alert:resolved', alert.id);
    }

    res.json(updatedAlert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trigger predictive analysis manually
router.post('/trigger', async (req, res) => {
  try {
    const io = req.app.get('io');
    const activeAlerts = await runPredictiveAnalysis(io);
    res.json({ message: 'AI Alerts Engine ran successfully', count: activeAlerts.length, alerts: activeAlerts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
