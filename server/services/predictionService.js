const db = require('./dbService');
const aiService = require('./aiService');

// Perform predictive analysis on resources to identify potential shortages in 6-24 hours
async function runPredictiveAnalysis(io = null) {
  console.log('Running AI Predictive Alert Engine...');
  const resources = db.find('resources');
  const logs = db.find('logs');
  const existingAlerts = db.find('alerts');
  
  let newAlertsGenerated = false;
  const activeAlerts = [];

  // Group logs by resourceId in the last 48 hours for trend analysis
  const logsByResource = {};
  const fortyEightHoursAgo = Date.now() - 48 * 3600 * 1000;
  
  logs.forEach(log => {
    const logTime = new Date(log.timestamp).getTime();
    if (logTime >= fortyEightHoursAgo) {
      if (!logsByResource[log.resourceId]) {
        logsByResource[log.resourceId] = [];
      }
      logsByResource[log.resourceId].push(log);
    }
  });

  for (const resource of resources) {
    // If resource is staff, we don't perform depletion warnings
    if (resource.type === 'staff') continue;

    const resourceLogs = logsByResource[resource.id] || [];
    
    // Sort logs ascending by time
    resourceLogs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Calculate hourly consumption rate
    let hourlyUsageRate = 0;
    if (resourceLogs.length >= 2) {
      const firstLog = resourceLogs[0];
      const lastLog = resourceLogs[resourceLogs.length - 1];
      const timeDiffHours = (new Date(lastLog.timestamp) - new Date(firstLog.timestamp)) / 3600000;
      
      if (timeDiffHours > 0.5) { // Needs at least 30 mins span
        // Calculate net change
        const netChange = resource.currentCount - firstLog.previousCount;
        
        // We only care if it's being depleted (negative change)
        if (netChange < 0) {
          hourlyUsageRate = Math.abs(netChange) / timeDiffHours;
        }
      }
    }

    // Default hourly usage based on type if no logs exist (to make the demo dynamic)
    if (hourlyUsageRate === 0) {
      if (resource.currentCount < resource.totalCapacity) {
        // Mock a natural consumption rate for demo purposes
        const depletionRates = {
          beds: { ICU: 0.5, Emergency: 1.0, General: 2.2 },
          oxygen: { Standard: 1.8, Portable: 1.2 },
          ventilators: { Adult: 0.2, Pediatric: 0.1 },
          blood: { 'O-': 0.35, 'A+': 0.6, 'B+': 0.5, default: 0.15 },
          medicines: { Heparin: 1.4, Epinephrine: 2.5, default: 0.8 },
          kits: { Respiratory: 0.6, Trauma: 0.4, default: 0.3 },
          equipment: { default: 0 }
        };

        const typeRate = depletionRates[resource.type];
        if (typeRate) {
          hourlyUsageRate = typeRate[resource.subType] || typeRate.default || 0;
        }
      }
    }

    // Calculate predicted time to depletion in hours
    if (hourlyUsageRate > 0) {
      // Time to cross critical threshold
      const countToCritical = resource.currentCount - resource.thresholds.critical;
      const countToWarning = resource.currentCount - resource.thresholds.warning;

      // Depletion is critical if below warning or approaching critical threshold fast
      let hoursToWarning = countToWarning / hourlyUsageRate;
      let hoursToCritical = countToCritical / hourlyUsageRate;

      // If we are already below warning or critical, or will be in < 24 hours
      if (hoursToCritical > 0 && hoursToCritical <= 24) {
        const severity = hoursToCritical <= 8 || resource.currentCount <= resource.thresholds.critical ? 'critical' : 'warning';
        const hoursRemaining = Math.max(1, Math.round(hoursToCritical));

        // Check if an active alert already exists for this resource
        const existingAlert = existingAlerts.find(a => a.resourceId === resource.id && a.status === 'active');

        if (!existingAlert) {
          console.log(`Alert Engine: Generating new predictive alert for ${resource.name}`);
          
          // Generate explanation via AI (or fallback)
          const explanation = await aiService.getAlertExplanation(
            resource.name,
            resource.type,
            resource.subType,
            resource.currentCount,
            resource.totalCapacity,
            hoursRemaining
          );

          const newAlert = {
            resourceId: resource.id,
            resourceType: resource.type,
            subType: resource.subType,
            severity,
            message: `${resource.subType} ${resource.type} running low.`,
            explanation,
            timeToDepletion: hoursRemaining,
            status: 'active'
          };

          const insertedAlert = db.insert('alerts', newAlert);
          activeAlerts.push(insertedAlert);
          newAlertsGenerated = true;

          // Broadcast if Socket.io is available
          if (io) {
            io.emit('alert:new', insertedAlert);
          }
        } else {
          // Update the alert time and count
          const updatedAlert = db.updateById('alerts', existingAlert.id, {
            timeToDepletion: hoursRemaining,
            severity,
            timestamp: new Date().toISOString()
          });
          activeAlerts.push(updatedAlert);
        }
      } else if (resource.currentCount <= resource.thresholds.critical) {
        // Immediate critical shortage alert (count is already below critical, no logs needed)
        const existingAlert = existingAlerts.find(a => a.resourceId === resource.id && a.status === 'active');
        if (!existingAlert) {
          const explanation = `${resource.name} has dropped below the critical safety threshold of ${resource.thresholds.critical} ${resource.unit}. Immediate restocking is vital to maintain standard patient care in the ${resource.department} department.`;
          const newAlert = {
            resourceId: resource.id,
            resourceType: resource.type,
            subType: resource.subType,
            severity: 'critical',
            message: `${resource.subType} ${resource.type} critical shortage!`,
            explanation,
            timeToDepletion: 0,
            status: 'active'
          };
          const insertedAlert = db.insert('alerts', newAlert);
          activeAlerts.push(insertedAlert);
          newAlertsGenerated = true;
          if (io) io.emit('alert:new', insertedAlert);
        } else {
          activeAlerts.push(existingAlert);
        }
      }
    }
  }

  // Deactivate alerts for resources that are now well stocked (above warning threshold)
  const allExistingAlerts = db.find('alerts');
  allExistingAlerts.forEach(alert => {
    if (alert.status === 'active') {
      const resource = resources.find(r => r.id === alert.resourceId);
      if (resource && resource.currentCount > resource.thresholds.warning) {
        db.updateById('alerts', alert.id, { status: 'resolved', resolvedAt: new Date().toISOString() });
        console.log(`Alert Engine: Resolved alert for ${resource.name}`);
        if (io) {
          io.emit('alert:resolved', alert.id);
        }
      }
    }
  });

  return db.find('alerts', { status: 'active' });
}

module.exports = {
  runPredictiveAnalysis
};
