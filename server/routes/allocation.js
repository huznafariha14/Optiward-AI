const express = require('express');
const router = express.Router();
const db = require('../services/dbService');
const aiService = require('../services/aiService');

// Get AI resource allocation recommendation based on patient profile
router.post('/recommend', async (req, res) => {
  try {
    const { condition, severity, ageGroup, specialReqs } = req.body;

    if (!condition || !severity || !ageGroup) {
      return res.status(400).json({ error: 'Missing required patient details: condition, severity, ageGroup' });
    }

    // Get current available critical resources
    const resources = db.find('resources');
    
    // Select essential beds, equipment, medicines, blood for context
    const criticalResourceOverview = resources.filter(r => 
      r.type === 'beds' || 
      r.type === 'ventilators' || 
      (r.type === 'blood' && ['O-', 'O+', 'A+'].includes(r.subType)) ||
      (r.type === 'medicines' && ['Epinephrine', 'Heparin', 'Morphine'].includes(r.subType))
    ).map(r => ({
      id: r.id,
      name: r.name,
      type: r.type,
      subType: r.subType,
      currentCount: r.currentCount,
      totalCapacity: r.totalCapacity,
      department: r.department,
      thresholds: r.thresholds,
      unit: r.unit
    }));

    // Query AI service
    const recommendation = await aiService.getResourceRecommendation(
      condition,
      Number(severity),
      ageGroup,
      specialReqs,
      criticalResourceOverview
    );

    res.json(recommendation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Commit patient resource allocation (decrements actual counts, logs action)
router.post('/allocate', async (req, res) => {
  try {
    const { bedType, equipmentNeeded, medicinesNeeded, bloodTypePrepared, staffId, staffName, patientName, reason } = req.body;

    if (!staffId || !staffName) {
      return res.status(400).json({ error: 'Missing staff metadata (staffId, staffName)' });
    }

    const io = req.app.get('io');
    const logs = [];
    const updatedResources = [];

    // Allocate Bed
    if (bedType && bedType !== 'None') {
      const bed = db.findOne('resources', { type: 'beds', subType: bedType });
      if (bed) {
        if (bed.currentCount > 0) {
          const updatedBed = db.updateById('resources', bed.id, { currentCount: bed.currentCount - 1 });
          const newLog = db.insert('logs', {
            resourceId: bed.id,
            resourceType: bed.type,
            subType: bed.subType,
            previousCount: bed.currentCount,
            newCount: updatedBed.currentCount,
            change: -1,
            action: 'consume',
            staffId,
            staffName,
            reason: `Patient Allocation - ${patientName || 'Emergency Patient'}. Note: ${reason || 'Admitted'}`,
            department: bed.department
          });
          updatedResources.push(updatedBed);
          logs.push(newLog);
          if (io) {
            io.emit('resource:update', updatedBed);
            io.emit('inventory:log', newLog);
          }
        }
      }
    }

    // Allocate blood type
    if (bloodTypePrepared && bloodTypePrepared !== 'None') {
      const blood = db.findOne('resources', { type: 'blood', subType: bloodTypePrepared });
      if (blood) {
        if (blood.currentCount > 0) {
          const updatedBlood = db.updateById('resources', blood.id, { currentCount: blood.currentCount - 1 });
          const newLog = db.insert('logs', {
            resourceId: blood.id,
            resourceType: blood.type,
            subType: blood.subType,
            previousCount: blood.currentCount,
            newCount: updatedBlood.currentCount,
            change: -1,
            action: 'consume',
            staffId,
            staffName,
            reason: `Standby Prepared - ${patientName || 'Emergency Patient'}. Vitals prep.`,
            department: blood.department
          });
          updatedResources.push(updatedBlood);
          logs.push(newLog);
          if (io) {
            io.emit('resource:update', updatedBlood);
            io.emit('inventory:log', newLog);
          }
        }
      }
    }

    // Allocate equipment (decrements counts of items)
    if (equipmentNeeded && Array.isArray(equipmentNeeded)) {
      for (const eqName of equipmentNeeded) {
        // e.g. "Patient Monitor" matches "Patient Monitors" or subtype "Monitor"
        const equip = db.findOne('resources', { type: 'equipment', subType: eqName.includes('Monitor') ? 'Monitor' : eqName.includes('Defibrillator') ? 'Defibrillator' : 'Infusion Pump' });
        if (equip && equip.currentCount > 0) {
          const updatedEquip = db.updateById('resources', equip.id, { currentCount: equip.currentCount - 1 });
          const newLog = db.insert('logs', {
            resourceId: equip.id,
            resourceType: equip.type,
            subType: equip.subType,
            previousCount: equip.currentCount,
            newCount: updatedEquip.currentCount,
            change: -1,
            action: 'consume',
            staffId,
            staffName,
            reason: `Equipment deploy - ${patientName || 'Emergency Patient'} bedside.`,
            department: equip.department
          });
          updatedResources.push(updatedEquip);
          logs.push(newLog);
          if (io) {
            io.emit('resource:update', updatedEquip);
            io.emit('inventory:log', newLog);
          }
        }
      }
    }

    // Allocate medicines (decrements counts of vials/bags)
    if (medicinesNeeded && Array.isArray(medicinesNeeded)) {
      for (const medName of medicinesNeeded) {
        const medicine = db.findOne('resources', { type: 'medicines', subType: medName });
        if (medicine && medicine.currentCount > 0) {
          // Take 2 units for standard dosage
          const takeAmt = Math.min(medicine.currentCount, 2);
          const updatedMed = db.updateById('resources', medicine.id, { currentCount: medicine.currentCount - takeAmt });
          const newLog = db.insert('logs', {
            resourceId: medicine.id,
            resourceType: medicine.type,
            subType: medicine.subType,
            previousCount: medicine.currentCount,
            newCount: updatedMed.currentCount,
            change: -takeAmt,
            action: 'consume',
            staffId,
            staffName,
            reason: `Medication dose - ${patientName || 'Emergency Patient'} intake.`,
            department: medicine.department
          });
          updatedResources.push(updatedMed);
          logs.push(newLog);
          if (io) {
            io.emit('resource:update', updatedMed);
            io.emit('inventory:log', newLog);
          }
        }
      }
    }

    res.json({ message: 'Patient allocated successfully', allocated: updatedResources, logs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
