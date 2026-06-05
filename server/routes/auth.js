const express = require('express');
const router = express.Router();
const db = require('../services/dbService');

// Login using Employee ID Card RFID tag
router.post('/login-tag', async (req, res) => {
  try {
    const { idTag } = req.body;
    if (!idTag) {
      return res.status(400).json({ error: 'RFID ID Card Tag is required' });
    }

    const employee = db.findOne('id_tags', { idTag: idTag.trim() });
    if (!employee) {
      return res.status(404).json({ error: 'Unrecognized Employee ID Card Tag' });
    }

    res.json({
      success: true,
      user: {
        id: employee.id,
        name: employee.name,
        role: employee.role,
        department: employee.department
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fast demo login (bypass scan for quick evaluations)
router.post('/login-demo', async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }

    const employee = db.findOne('id_tags', { role });
    if (!employee) {
      return res.status(404).json({ error: 'No demo account seeded for this role' });
    }

    res.json({
      success: true,
      user: {
        id: employee.id,
        name: employee.name,
        role: employee.role,
        department: employee.department
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
