const express = require('express');
const router = express.Router();
const db = require('../services/dbService');
const { runPredictiveAnalysis } = require('../services/predictionService');

// Get all resources
router.get('/', (req, res) => {
  try {
    const { department, type } = req.query;
    let resources = db.find('resources');

    if (department && department !== 'All') {
      resources = resources.filter(r => r.department === department);
    }
    
    if (type) {
      resources = resources.filter(r => r.type === type);
    }

    // Dynamic color coding & state calculation on read
    const processedResources = resources.map(resource => {
      let status = 'sufficient';
      if (resource.currentCount <= resource.thresholds.critical) {
        status = 'critical';
      } else if (resource.currentCount <= resource.thresholds.warning) {
        status = 'low';
      }
      return { ...resource, status };
    });

    res.json(processedResources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single resource
router.get('/:id', (req, res) => {
  try {
    const resource = db.findById('resources', req.params.id);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    let status = 'sufficient';
    if (resource.currentCount <= resource.thresholds.critical) {
      status = 'critical';
    } else if (resource.currentCount <= resource.thresholds.warning) {
      status = 'low';
    }

    res.json({ ...resource, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Direct update resource capacity or threshold (admin config, optional)
router.put('/:id', async (req, res) => {
  try {
    const { currentCount, totalCapacity, warningThreshold, criticalThreshold } = req.body;
    const resource = db.findById('resources', req.params.id);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    const updates = {};
    if (currentCount !== undefined) updates.currentCount = Number(currentCount);
    if (totalCapacity !== undefined) updates.totalCapacity = Number(totalCapacity);
    if (warningThreshold !== undefined || criticalThreshold !== undefined) {
      updates.thresholds = {
        warning: warningThreshold !== undefined ? Number(warningThreshold) : resource.thresholds.warning,
        critical: criticalThreshold !== undefined ? Number(criticalThreshold) : resource.thresholds.critical
      };
    }

    const updatedResource = db.updateById('resources', req.params.id, updates);
    
    // Trigger socket broadcast via standard io in server.js
    const io = req.app.get('io');
    if (io) {
      io.emit('resource:update', updatedResource);
    }

    // Recalculate predictive alerts in background
    setTimeout(() => runPredictiveAnalysis(io), 500);

    res.json(updatedResource);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
