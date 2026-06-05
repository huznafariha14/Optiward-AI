const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE_PATHS = {
  resources: path.join(DATA_DIR, 'resources.json'),
  logs: path.join(DATA_DIR, 'logs.json'),
  alerts: path.join(DATA_DIR, 'alerts.json'),
  id_tags: path.join(DATA_DIR, 'id_tags.json'),
  medicine_tags: path.join(DATA_DIR, 'medicine_tags.json')
};

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to read JSON file safely
function readJSON(filePath, defaultData = []) {
  try {
    if (!fs.existsSync(filePath)) {
      return defaultData;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return defaultData;
  }
}

// Helper to write JSON file safely
function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error);
    return false;
  }
}

// Initialize Database with Seed Data if empty
function initializeDB() {
  const resources = readJSON(FILE_PATHS.resources);
  if (resources.length === 0) {
    console.log('Seeding initial resource data...');
    const seedResources = generateSeedResources();
    writeJSON(FILE_PATHS.resources, seedResources);
    
    console.log('Seeding historical update logs for analytics...');
    const seedLogs = generateSeedLogs(seedResources);
    writeJSON(FILE_PATHS.logs, seedLogs);

    console.log('Generating initial predictive alerts...');
    const seedAlerts = generateSeedAlerts(seedResources);
    writeJSON(FILE_PATHS.alerts, seedAlerts);
  }

  const idTags = readJSON(FILE_PATHS.id_tags);
  if (idTags.length === 0) {
    console.log('Seeding employee ID tags data...');
    const seedIdTags = [
      { idTag: "ID-ADM-001", id: "ST-101", name: "Dr. Sarah Jenkins", role: "admin", department: "All Wards" },
      { idTag: "ID-CLI-102", id: "ST-102", name: "Nurse Clara Finch", role: "clinician", department: "Emergency" },
      { idTag: "ID-PHR-504", id: "ST-504", name: "Marcus Vance", role: "pharmacist", department: "Pharmacy" }
    ];
    writeJSON(FILE_PATHS.id_tags, seedIdTags);
  }

  const medTags = readJSON(FILE_PATHS.medicine_tags);
  if (medTags.length === 0) {
    console.log('Seeding medicine barcode tags data...');
    const seedMedTags = [
      { tagCode: "TAG-EPI-771", resourceId: "R-16", name: "Epinephrine Vials", subType: "Epinephrine", mfgDate: "2025-06-15", expDate: "2027-06-15", batch: "EP-9982", supplier: "Baxter Healthcare", quantity: 10 },
      { tagCode: "TAG-INS-502", resourceId: "R-17", name: "Insulin (Rapid Acting)", subType: "Insulin", mfgDate: "2025-11-01", expDate: "2027-11-01", batch: "IN-8812", supplier: "Eli Lilly", quantity: 15 },
      { tagCode: "TAG-MOR-339", resourceId: "R-18", name: "Morphine Injections", subType: "Morphine", mfgDate: "2025-01-20", expDate: "2026-08-20", batch: "MR-4402", supplier: "Pfizer Rx", quantity: 5 },
      { tagCode: "TAG-HEP-128", resourceId: "R-19", name: "Heparin IV Bags", subType: "Heparin", mfgDate: "2024-04-10", expDate: "2025-10-10", batch: "HP-1122", supplier: "Hospira", quantity: 8 },
      { tagCode: "TAG-PRO-905", resourceId: "R-20", name: "Propofol Vials", subType: "Propofol", mfgDate: "2025-08-05", expDate: "2027-08-05", batch: "PR-6631", supplier: "Fresenius Kabi", quantity: 20 },
      { tagCode: "TAG-ALB-441", resourceId: "R-21", name: "Albuterol Inhalers", subType: "Albuterol", mfgDate: "2025-03-10", expDate: "2027-03-10", batch: "AL-5509", supplier: "GlaxoSmithKline", quantity: 12 }
    ];
    writeJSON(FILE_PATHS.medicine_tags, seedMedTags);
  }
}

// Generate high-quality realistic seed resources
function generateSeedResources() {
  const resources = [];
  let idCounter = 1;

  const createResource = (name, type, subType, currentCount, totalCapacity, department, warning, critical, unit = 'units') => ({
    id: `R-${idCounter++}`,
    name,
    type,
    subType,
    currentCount,
    totalCapacity,
    department,
    thresholds: { warning, critical },
    unit,
    lastUpdated: new Date(Date.now() - Math.random() * 3600000).toISOString() // updated within last hour
  });

  // 1. Hospital Beds
  resources.push(createResource('General Beds', 'beds', 'General', 142, 180, 'General Ward', 50, 20, 'beds'));
  resources.push(createResource('ICU Beds', 'beds', 'ICU', 8, 30, 'ICU', 10, 5, 'beds')); // Low availability
  resources.push(createResource('Emergency Beds', 'beds', 'Emergency', 12, 40, 'Emergency', 12, 6, 'beds')); // Critical level

  // 2. Oxygen Cylinders
  resources.push(createResource('Standard Oxygen Cylinders', 'oxygen', 'Standard', 85, 120, 'General Ward', 30, 15, 'cylinders'));
  resources.push(createResource('Portable Oxygen Cylinders', 'oxygen', 'Portable', 18, 50, 'Emergency', 15, 8, 'cylinders'));

  // 3. Ventilators
  resources.push(createResource('Adult Ventilators', 'ventilators', 'Adult', 5, 20, 'ICU', 6, 3, 'units')); // Warning
  resources.push(createResource('Pediatric Ventilators', 'ventilators', 'Pediatric', 8, 10, 'ICU', 3, 1, 'units'));

  // 4. Blood Units
  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  const bloodCounts = {
    'A+': [15, 30], 'A-': [4, 15], 'B+': [18, 30], 'B-': [3, 15],
    'O+': [22, 40], 'O-': [2, 20], 'AB+': [10, 20], 'AB-': [1, 10]
  };
  bloodTypes.forEach(bt => {
    const [curr, cap] = bloodCounts[bt];
    const warn = Math.floor(cap * 0.35);
    const crit = Math.floor(cap * 0.15);
    resources.push(createResource(`Blood Unit ${bt}`, 'blood', bt, curr, cap, 'Emergency', warn, crit, 'bags'));
  });

  // 5. Medicines (critical drugs)
  resources.push(createResource('Epinephrine Vials', 'medicines', 'Epinephrine', 45, 200, 'Emergency', 50, 20, 'vials')); // Amber/Low
  resources.push(createResource('Insulin (Rapid Acting)', 'medicines', 'Insulin', 120, 150, 'Pharmacy', 40, 15, 'vials'));
  resources.push(createResource('Morphine Injections', 'medicines', 'Morphine', 38, 100, 'Pharmacy', 25, 10, 'ampoules'));
  resources.push(createResource('Heparin IV', 'medicines', 'Heparin', 14, 80, 'Pharmacy', 20, 10, 'bags')); // Critical
  resources.push(createResource('Propofol Vials', 'medicines', 'Propofol', 95, 120, 'OT', 30, 15, 'vials'));
  resources.push(createResource('Albuterol Inhalers', 'medicines', 'Albuterol', 64, 80, 'Pharmacy', 20, 10, 'units'));

  // 6. Medical Equipment
  resources.push(createResource('Patient Monitors', 'equipment', 'Monitor', 48, 60, 'ICU', 15, 8, 'devices'));
  resources.push(createResource('Defibrillators', 'equipment', 'Defibrillator', 14, 15, 'Emergency', 4, 2, 'devices'));
  resources.push(createResource('Infusion Pumps', 'equipment', 'Infusion Pump', 82, 100, 'General Ward', 20, 10, 'devices'));

  // 7. Emergency Kits
  resources.push(createResource('Trauma Response Kits', 'kits', 'Trauma', 9, 30, 'Emergency', 10, 5, 'kits')); // Warning/Low
  resources.push(createResource('Cardiac Care Kits', 'kits', 'Cardiac', 18, 25, 'Emergency', 6, 3, 'kits'));
  resources.push(createResource('Respiratory Emergency Kits', 'kits', 'Respiratory', 5, 20, 'Emergency', 6, 3, 'kits')); // Critical

  // 8. Staff on Duty
  resources.push(createResource('On-duty Doctors', 'staff', 'Doctors', 14, 20, 'General Ward', 8, 4, 'active'));
  resources.push(createResource('On-duty Nurses', 'staff', 'Nurses', 38, 50, 'General Ward', 15, 8, 'active'));
  resources.push(createResource('On-duty Technicians', 'staff', 'Technicians', 8, 12, 'OT', 4, 2, 'active'));

  return resources;
}

// Generate seed update logs for the last 7 days to enable realistic charts
function generateSeedLogs(resources) {
  const logs = [];
  const reasons = [
    'Routine patient admission',
    'Emergency intake',
    'Regular utilization',
    'Restocking delivery received',
    'Scheduled surgery allocation',
    'Patient discharge / cleanup',
    'Inter-departmental transfer',
    'Critical care backup deployment',
    'Wastage due to expiry/damage'
  ];
  const staffIds = ['ST-102', 'ST-405', 'ST-221', 'ST-314', 'ST-108'];
  const staffNames = ['Dr. Sarah Carter', 'Nurse David Miller', 'Dr. Alex Vance', 'Nurse Elena Rostova', 'Tech Liam Brooks'];

  let logIdCounter = 1;
  const now = new Date();

  // Create historical logs spread over the last 7 days
  for (let d = 7; d >= 0; d--) {
    const dayDate = new Date(now.getTime() - d * 24 * 3600 * 1000);
    
    // 5 to 15 logs per day
    const logsCount = 5 + Math.floor(Math.random() * 10);
    for (let l = 0; l < logsCount; l++) {
      const resource = resources[Math.floor(Math.random() * resources.length)];
      const staffIdx = Math.floor(Math.random() * staffIds.length);
      const isRestock = Math.random() < 0.15; // 15% chance of restock
      const isWastage = !isRestock && Math.random() < 0.08; // 8% chance of wastage
      
      let change = 0;
      let action = 'consume';
      let reason = reasons[Math.floor(Math.random() * 3)]; // standard consume reasons

      if (isRestock) {
        change = 5 + Math.floor(Math.random() * 20);
        action = 'restock';
        reason = 'Restocking delivery received';
      } else if (isWastage) {
        change = -1 - Math.floor(Math.random() * 3);
        action = 'consume';
        reason = 'Wastage due to expiry/damage';
      } else {
        change = -1 - Math.floor(Math.random() * 4);
        action = 'consume';
      }

      // Add actual timestamp
      const logTime = new Date(dayDate.getTime() + Math.random() * 24 * 3600 * 1000);
      
      logs.push({
        id: `L-${logIdCounter++}`,
        resourceId: resource.id,
        resourceType: resource.type,
        subType: resource.subType,
        previousCount: resource.currentCount - change, // approximate
        newCount: resource.currentCount,
        change,
        action,
        staffId: staffIds[staffIdx],
        staffName: staffNames[staffIdx],
        reason,
        department: resource.department,
        timestamp: logTime.toISOString()
      });
    }
  }

  // Sort logs by newest first
  return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// Generate realistic predictive alerts based on seed resources
function generateSeedAlerts(resources) {
  const alerts = [];
  let alertIdCounter = 1;

  // Let's manually trigger highly engaging predictive alerts for the hackathon
  const criticalICU = resources.find(r => r.subType === 'ICU' && r.type === 'beds');
  if (criticalICU) {
    alerts.push({
      id: `A-${alertIdCounter++}`,
      resourceId: criticalICU.id,
      resourceType: criticalICU.type,
      subType: criticalICU.subType,
      severity: 'critical',
      message: 'ICU Bed shortage imminent.',
      explanation: 'At the current rate of emergency trauma admissions, the ICU ward is projected to run out of vacant beds in approximately 6 hours. High intake of cardiac emergencies noted over last 4 hours.',
      timeToDepletion: 6, // hours
      status: 'active',
      timestamp: new Date().toISOString()
    });
  }

  const criticalEmerg = resources.find(r => r.subType === 'Emergency' && r.type === 'beds');
  if (criticalEmerg) {
    alerts.push({
      id: `A-${alertIdCounter++}`,
      resourceId: criticalEmerg.id,
      resourceType: criticalEmerg.type,
      subType: criticalEmerg.subType,
      severity: 'critical',
      message: 'Emergency Bed levels critical.',
      explanation: 'Emergency beds are operating at 30% capacity. Incoming ambulance re-routing or general ward transfers are recommended within the next 4 hours to prevent admission gridlock.',
      timeToDepletion: 4, // hours
      status: 'active',
      timestamp: new Date().toISOString()
    });
  }

  const lowBloodO = resources.find(r => r.subType === 'O-' && r.type === 'blood');
  if (lowBloodO) {
    alerts.push({
      id: `A-${alertIdCounter++}`,
      resourceId: lowBloodO.id,
      resourceType: lowBloodO.type,
      subType: lowBloodO.subType,
      severity: 'warning',
      message: 'O- Negative Blood inventory depleted.',
      explanation: 'Universal donor blood type O- is down to 2 bags. Multi-vehicle collision trauma case earlier today consumed 5 bags. Restocking delivery is scheduled in 14 hours; emergency backup transfer from central blood bank requested.',
      timeToDepletion: 14,
      status: 'active',
      timestamp: new Date().toISOString()
    });
  }

  const epinephrine = resources.find(r => r.subType === 'Epinephrine' && r.type === 'medicines');
  if (epinephrine) {
    alerts.push({
      id: `A-${alertIdCounter++}`,
      resourceId: epinephrine.id,
      resourceType: epinephrine.type,
      subType: epinephrine.subType,
      severity: 'warning',
      message: 'Epinephrine Vials low.',
      explanation: 'Epinephrine stock has fallen below the 30% safe threshold (45 vials remaining). Average daily consumption predicts a complete depletion in 18 hours. Pharmacy restocking order is pending approval.',
      timeToDepletion: 18,
      status: 'active',
      timestamp: new Date().toISOString()
    });
  }

  const respiratoryKit = resources.find(r => r.subType === 'Respiratory' && r.type === 'kits');
  if (respiratoryKit) {
    alerts.push({
      id: `A-${alertIdCounter++}`,
      resourceId: respiratoryKit.id,
      resourceType: respiratoryKit.type,
      subType: respiratoryKit.subType,
      severity: 'critical',
      message: 'Respiratory Kits depleted.',
      explanation: 'Only 5 kits remain. Due to a surge in seasonal asthma and respiratory virus cases in the ER, consumption rate has doubled. Critical shortage expected in 8 hours without rapid resupply.',
      timeToDepletion: 8,
      status: 'active',
      timestamp: new Date().toISOString()
    });
  }

  return alerts;
}

// Database CRUD interface
const db = {
  // Read all records in a collection
  find(collectionName, query = {}) {
    const data = readJSON(FILE_PATHS[collectionName]);
    return data.filter(item => {
      for (let key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
  },

  // Read a single record
  findOne(collectionName, query = {}) {
    const data = readJSON(FILE_PATHS[collectionName]);
    return data.find(item => {
      for (let key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    }) || null;
  },

  // Find by ID
  findById(collectionName, id) {
    const data = readJSON(FILE_PATHS[collectionName]);
    return data.find(item => item.id === id) || null;
  },

  // Create a record
  insert(collectionName, doc) {
    const data = readJSON(FILE_PATHS[collectionName]);
    const newDoc = {
      id: `${collectionName.charAt(0).toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ...doc,
      timestamp: new Date().toISOString()
    };
    data.push(newDoc);
    writeJSON(FILE_PATHS[collectionName], data);
    return newDoc;
  },

  // Update a record by ID
  updateById(collectionName, id, updates) {
    const data = readJSON(FILE_PATHS[collectionName]);
    const index = data.findIndex(item => item.id === id);
    if (index === -1) return null;

    data[index] = {
      ...data[index],
      ...updates,
      lastUpdated: new Date().toISOString()
    };
    writeJSON(FILE_PATHS[collectionName], data);
    return data[index];
  },

  // Save full collection (mainly for bulk ops)
  saveCollection(collectionName, data) {
    return writeJSON(FILE_PATHS[collectionName], data);
  }
};

// Auto initialize
initializeDB();

module.exports = db;
