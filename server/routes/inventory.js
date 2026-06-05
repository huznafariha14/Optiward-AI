const express = require('express');
const router = express.Router();
const db = require('../services/dbService');
const { runPredictiveAnalysis } = require('../services/predictionService');

// Submit resource inventory update
router.post('/update', async (req, res) => {
  try {
    const { resourceId, action, quantity, staffId, staffName, reason, transferToDepartment } = req.body;
    
    if (!resourceId || !action || !quantity || !staffId || !staffName || !reason) {
      return res.status(400).json({ error: 'Missing required update fields' });
    }

    const resource = db.findById('resources', resourceId);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    const prevCount = resource.currentCount;
    const qty = Number(quantity);
    let newCount = prevCount;
    let changeVal = 0;

    if (action === 'consume') {
      if (prevCount < qty) {
        return res.status(400).json({ error: `Insufficient inventory. Available: ${prevCount}, Requested: ${qty}` });
      }
      newCount = prevCount - qty;
      changeVal = -qty;
    } else if (action === 'add' || action === 'restock') {
      newCount = prevCount + qty;
      changeVal = qty;
      // Cap at double capacity or just let it exceed if they received extra supply
      if (newCount > resource.totalCapacity * 1.5) {
        // Expand capacity automatically for hackathon flex
        db.updateById('resources', resourceId, { totalCapacity: Math.round(newCount) });
      }
    } else if (action === 'transfer') {
      if (prevCount < qty) {
        return res.status(400).json({ error: `Insufficient inventory for transfer. Available: ${prevCount}, Requested: ${qty}` });
      }
      if (!transferToDepartment) {
        return res.status(400).json({ error: 'Transfer destination department required' });
      }
      newCount = prevCount - qty;
      changeVal = -qty;

      // Create or update resource in target department
      const targetResource = db.findOne('resources', { 
        type: resource.type, 
        subType: resource.subType, 
        department: transferToDepartment 
      });

      if (targetResource) {
        const updatedTarget = db.updateById('resources', targetResource.id, {
          currentCount: targetResource.currentCount + qty
        });
        
        // Log target transfer add
        db.insert('logs', {
          resourceId: targetResource.id,
          resourceType: targetResource.type,
          subType: targetResource.subType,
          previousCount: targetResource.currentCount,
          newCount: updatedTarget.currentCount,
          change: qty,
          action: 'add',
          staffId,
          staffName,
          reason: `Transferred from ${resource.department} ward`,
          department: transferToDepartment
        });
      } else {
        // Create new resource in target department
        const newTarget = db.insert('resources', {
          name: resource.name,
          type: resource.type,
          subType: resource.subType,
          currentCount: qty,
          totalCapacity: resource.totalCapacity, // match capacity initially
          department: transferToDepartment,
          thresholds: { ...resource.thresholds },
          unit: resource.unit
        });

        // Log target transfer add
        db.insert('logs', {
          resourceId: newTarget.id,
          resourceType: newTarget.type,
          subType: newTarget.subType,
          previousCount: 0,
          newCount: qty,
          change: qty,
          action: 'add',
          staffId,
          staffName,
          reason: `Transferred from ${resource.department} ward`,
          department: transferToDepartment
        });
      }
    }

    // Update origin resource
    const updatedResource = db.updateById('resources', resourceId, {
      currentCount: newCount
    });

    // Write primary change log
    const newLog = db.insert('logs', {
      resourceId,
      resourceType: resource.type,
      subType: resource.subType,
      previousCount: prevCount,
      newCount: newCount,
      change: changeVal,
      action,
      staffId,
      staffName,
      reason: action === 'transfer' ? `Transferred to ${transferToDepartment} ward. Reason: ${reason}` : reason,
      department: resource.department
    });

    // Handle WebSocket broadcasts
    const io = req.app.get('io');
    if (io) {
      io.emit('resource:update', updatedResource);
      io.emit('inventory:log', newLog);
      
      // If we performed a transfer, broadcast the general list reload
      if (action === 'transfer') {
        io.emit('resources:reload');
      }
    }

    // Re-run AI predictions
    setTimeout(() => {
      runPredictiveAnalysis(io);
    }, 500);

    res.json({ resource: updatedResource, log: newLog });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get historical update logs
router.get('/history', (req, res) => {
  try {
    const { department, limit } = req.query;
    let logs = db.find('logs');

    if (department && department !== 'All') {
      logs = logs.filter(l => l.department === department);
    }

    // Sort by timestamp descending
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const maxLimit = limit ? Number(limit) : 50;
    res.json(logs.slice(0, maxLimit));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get list of all pharmaceutical barcode medicine tags
router.get('/medicine-tags', (req, res) => {
  try {
    const tags = db.find('medicine_tags');
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single medicine tag details by barcode tag code
router.get('/medicine-tags/:tagCode', (req, res) => {
  try {
    const { tagCode } = req.params;
    const tag = db.findOne('medicine_tags', { tagCode });
    if (!tag) {
      return res.status(404).json({ error: 'Unrecognized pharmaceutical tag barcode' });
    }
    res.json(tag);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
