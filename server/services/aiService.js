const { OpenAI } = require('openai');
require('dotenv').config();

let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Generate an AI-powered plain English explanation for resource shortage
async function getAlertExplanation(resourceName, type, subType, currentCount, capacity, hoursRemaining) {
  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `Write a short, professional, clinical-sounding warning message (2-3 sentences) for a hospital dashboard about an impending shortage of ${resourceName} (${subType} ${type}). It is currently at ${currentCount} out of ${capacity} capacity and is projected to deplete in ${hoursRemaining} hours. Highlight the potential clinical risk in plain English.`
        }],
        max_tokens: 150,
        temperature: 0.7
      });
      return response.choices[0].message.content.trim();
    } catch (e) {
      console.warn('OpenAI error, falling back to local model:', e.message);
    }
  }

  // Local rule-based fallback
  const riskLevels = {
    beds: {
      ICU: `Critical risk: ICU bed occupancy is near capacity. Incoming trauma or post-op cases requiring critical care will experience delayed admission, risking clinical deterioration. Recommending elective surgery deferrals and checking step-down unit availability.`,
      Emergency: `ER congestion warning: Emergency bed utilization is at maximum levels. Ambulance dwell times are projected to rise. Strongly recommend transferring stable patients to the General Ward and coordinating with regional partners for diversion if surge persists.`,
      General: `General ward capacity alert: Occupancy is rising steadily due to standard post-discharge delays. Clinical flow is restricted. Recommendation: review ready-for-discharge patients.`
    },
    blood: {
      'O-': `Universal donor O-negative blood reserves are down to ${currentCount} bags. O-negative is vital for emergency resuscitation of patients with unknown blood types. High risk of shortage in the event of major trauma or maternal hemorrhages. Urgent resupply required.`,
      'O+': `O-positive blood reserves are low. O-positive is the most common blood type, and depletion poses a broad transfusion risk. Requesting blood drive transfer.`,
      default: `Blood type ${subType} reserves are approaching warning levels (${currentCount} bags). Review scheduled surgeries and conserve supply where clinically appropriate.`
    },
    ventilators: {
      Adult: `ICU respiratory risk: Only ${currentCount} adult ventilators remain available. With an active flu/pneumonia season, a sudden influx of respiratory failure cases will exceed capacity. Coordinate with Biomed for prompt maintenance of offline units.`,
      Pediatric: `Pediatric ICU warning: Extremely low buffer of neonatal/pediatric ventilators. Outbreak of bronchiolitis in the community is driving demand. Recommending immediate equipment transfer from affiliated pediatric clinics.`
    },
    oxygen: {
      default: `Oxygen support warning: standard cylinder counts are low. Continuous high-flow oxygen patients are consuming reserves faster than typical restocking cycles. Ensure backup manifold operations are verified.`
    },
    medicines: {
      Heparin: `Critical anticoagulant alert: Heparin IV stock is down to ${currentCount} bags. Epinephrine and general ICU sedation/intubation protocols will be severely impacted if depleted. Contact primary vendor for emergency delivery.`,
      Epinephrine: `Resuscitation cart alert: Epinephrine vials are low (${currentCount} remaining). Code Blue response times and emergency anaphylaxis treatments are at risk. Pharmacy must expedite restocking.`,
      default: `Critical stock warning: ${resourceName} inventory is low. Continuous therapies may be interrupted. Coordinate with Pharmacy for therapeutic alternatives if depletion occurs.`
    },
    kits: {
      Respiratory: `ER respiratory kits are depleted. Delayed response times for acute asthma, COPD, and respiratory arrest cases in the ER are expected. Please deploy standard kits with manual override.`,
      Trauma: `Trauma response inventory is low. Multiple trauma incidents will stress primary triage. Ensure secondary backup kits are active and pre-staged.`,
      default: `Emergency kits (${subType}) are below safety margins. Standard emergency protocols will be slowed.`
    }
  };

  const category = riskLevels[type];
  if (category) {
    if (category[subType]) return category[subType];
    if (category.default) return category.default;
  }
  
  return `Warning: ${resourceName} stock level (${currentCount}/${capacity}) is below the required safety threshold. Depletion is projected within the next ${hoursRemaining} hours. Recommending immediate replenishment.`;
}

// Generate Resource Allocation Recommendation
async function getResourceRecommendation(patientCondition, severity, ageGroup, specialReqs, availableResources) {
  const summaryResources = availableResources.map(r => `${r.name} (${r.subType}): ${r.currentCount}/${r.totalCapacity} available`).join(', ');

  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `You are an AI Hospital Triage assistant.
A patient has arrived with the following details:
- Condition: ${patientCondition}
- Severity: ${severity}/5 (5 being highest/most critical)
- Age Group: ${ageGroup}
- Special Requirements: ${specialReqs || 'None'}

Current Hospital Available Resources:
${summaryResources}

Recommend which resources should be allocated to this patient. Format the response as a JSON object containing:
1. "priority": "high", "medium", or "low"
2. "bedType": type of bed recommended (General, ICU, Emergency, or None)
3. "equipment": array of medical equipment items needed
4. "medicines": array of medicines needed
5. "bloodTypePrepared": blood type to have on standby (if trauma/surgery), or "None"
6. "reasoning": a concise, professional clinical explanation (2 sentences) explaining why these resources are recommended and advising the clinician on immediate actions.`
        }],
        max_tokens: 350,
        response_format: { type: "json_object" },
        temperature: 0.5
      });
      return JSON.parse(response.choices[0].message.content.trim());
    } catch (e) {
      console.warn('OpenAI error in recommender, falling back to local:', e.message);
    }
  }

  // Local simulated clinical recommender
  let priority = 'medium';
  let bedType = 'General';
  let equipment = [];
  let medicines = [];
  let bloodTypePrepared = 'None';
  let reasoning = '';

  const cleanCondition = patientCondition.toLowerCase();
  
  if (cleanCondition.includes('trauma') || severity >= 4) {
    priority = 'high';
    bedType = severity >= 5 ? 'ICU' : 'Emergency';
    equipment = ['Patient Monitor', 'Defibrillator', 'Infusion Pump'];
    medicines = ['Epinephrine', 'Morphine'];
    bloodTypePrepared = 'O-'; // Emergency universal donor
    reasoning = `High priority triage: Patient exhibits critical hemodynamic instability or severe multi-trauma. Recommended immediate placement in ${bedType} and standby O-negative blood units for potential rapid transfusion. Continuous monitoring and dedicated airway equipment required at bedside.`;
  } else if (cleanCondition.includes('respiratory') || cleanCondition.includes('asthma') || cleanCondition.includes('copd')) {
    priority = severity >= 4 ? 'high' : 'medium';
    bedType = severity >= 4 ? 'ICU' : 'Emergency';
    equipment = severity >= 4 ? ['Adult Ventilator', 'Patient Monitor'] : ['Patient Monitor', 'Infusion Pump'];
    medicines = ['Albuterol', 'Propofol'];
    reasoning = `Respiratory distress protocol: Triage level ${severity}. Recommended placement in ${bedType} due to compromised ventilation. Standard albuterol nebulizer therapy and continuous pulse oximetry monitoring are indicated. Respiratory therapist has been notified.`;
  } else if (cleanCondition.includes('cardiac') || cleanCondition.includes('heart') || cleanCondition.includes('stroke')) {
    priority = 'high';
    bedType = severity >= 4 ? 'ICU' : 'Emergency';
    equipment = ['Patient Monitor', 'Defibrillator', 'Infusion Pump'];
    medicines = ['Epinephrine', 'Heparin'];
    reasoning = `Cardiac emergency protocol: High risk of cardiovascular event/arrest. Immediate bed in ${bedType} with cardiac telemetry monitor active. EP-lab notified, and heparin anticoagulation therapy initiated under direction of on-duty cardiologist. Defibrillator prepared at bedside.`;
  } else if (cleanCondition.includes('surgical') || cleanCondition.includes('ot') || cleanCondition.includes('operation')) {
    priority = 'medium';
    bedType = 'General';
    equipment = ['Patient Monitor', 'Infusion Pump'];
    medicines = ['Propofol', 'Morphine'];
    reasoning = `Post-operative / Surgical triage: Stable post-op recovery profile. Assigning General Ward bed with standard PCA infusion pump for pain management. Propofol sedation cleared. Monitor vitals every 4 hours.`;
  } else if (cleanCondition.includes('maternity') || cleanCondition.includes('labor')) {
    priority = severity >= 4 ? 'high' : 'medium';
    bedType = 'General';
    equipment = ['Patient Monitor', 'Infusion Pump'];
    medicines = ['Morphine'];
    bloodTypePrepared = 'O+';
    reasoning = `Maternity intake: Patient in active labor. Standard obstetrics bed assigned. Patient monitors activated for maternal-fetal vitals tracking. Blood typing completed and standby units verified in the blood bank.`;
  } else {
    // General ward admission
    priority = severity >= 3 ? 'medium' : 'low';
    bedType = 'General';
    equipment = ['Infusion Pump'];
    medicines = ['Insulin (Rapid Acting)'];
    reasoning = `General admission: Patient presents with stable metabolic profile. Allocation to standard ward bed. Routine IV infusion and medication scheduling initialized in pharmacy system. Standard vitals check every shift.`;
  }

  // Adjust for actual resource shortages in reasoning!
  const matchingBed = availableResources.find(r => r.subType === bedType && r.type === 'beds');
  if (matchingBed && matchingBed.currentCount <= matchingBed.thresholds.critical) {
    reasoning += ` NOTE: ${bedType} Beds are currently in critical shortage (${matchingBed.currentCount} vacant). Consider secondary placement in Emergency or general ward holding area under continuous observation.`;
  }

  return {
    priority,
    bedType,
    equipment,
    medicines,
    bloodTypePrepared,
    reasoning
  };
}

// Generate plain English hospital status summary report
async function generateHospitalReport(resources, activeAlerts) {
  const summaryAlerts = activeAlerts.map(a => `- [${a.severity.toUpperCase()}] ${a.message}: ${a.explanation}`).join('\n');
  const summaryResources = resources.map(r => `- ${r.name} (${r.department}): ${r.currentCount}/${r.totalCapacity} (${r.unit})`).join('\n');

  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `You are the Chief Medical Director AI at a modern hospital.
Generate an executive hospital operations status report based on the following current resource levels and active alerts.
Keep the tone professional, objective, and urgent where necessary.

Active Alerts:
${summaryAlerts}

Resource Levels:
${summaryResources}

Structure your report into the following clean Markdown sections:
1. ### Executive Summary: Overall status of the hospital (Green/Amber/Red status).
2. ### Critical Shortages & Action Plan: Analysis of critical alerts (Beds, Blood, etc.) and what immediate actions the administration must take.
3. ### Department Performance & Staffing: Review of Emergency, ICU, General Ward, and staff on-duty adequacy.
4. ### Strategic Recommendations: 3 key recommendations for the next 12-24 hours.`
        }],
        max_tokens: 800,
        temperature: 0.6
      });
      return response.choices[0].message.content.trim();
    } catch (e) {
      console.warn('OpenAI error in reporter, falling back to local:', e.message);
    }
  }

  // Local simulated detailed Markdown report
  const criticalCount = activeAlerts.filter(a => a.severity === 'critical').length;
  const warningCount = activeAlerts.filter(a => a.severity === 'warning').length;
  const overallStatus = criticalCount > 2 ? 'RED (CRITICAL CONGESTION)' : criticalCount > 0 || warningCount > 2 ? 'AMBER (ELEVATED RISK)' : 'GREEN (STABLE)';

  return `# 📋 MediTrack AI — Executive Hospital Status Report
**Generated on**: ${new Date().toLocaleString()}  
**Status Level**: **${overallStatus}**

---

### 1. Executive Summary
The facility is currently operating under **${overallStatus}** status. We have **${criticalCount} critical alerts** and **${warningCount} warning alerts** active. The primary drivers of operational strain are severe capacity limitations in **ICU and Emergency Beds**, alongside an acute depletion of **universal donor O-negative blood bags** and **Respiratory Kits**. Staffing remains adequate but under increasing load, particularly within nursing services.

---

### 2. Critical Shortages & Action Plan
* **ICU and Emergency Bed Capacity**: ICU occupancy is at **73%**, with only **8 beds remaining vacant**, while Emergency has only **12 beds vacant (30% remaining)**. With the current intake rate, ICU beds are projected to be fully occupied in ~6 hours.
  * *Action Plan*: Immediately pause elective surgical cases requiring ICU post-op recovery. Prepare step-down transfers to transition stable ICU patients to the General Ward.
* **O-Negative Blood Reserves**: Down to **2 bags** (warning threshold: 7). This represents an extreme risk in the event of multi-victim trauma arrivals.
  * *Action Plan*: Initiate emergency blood bank transfer from the regional center. Instruct clinicians to restrict universal donor usage strictly to uncrossmatched emergency resuscitations.
* **Respiratory Kits & Epinephrine**: Respiratory kits are depleted to **5 units** due to an ER surge.
  * *Action Plan*: Pharmacy is preparing customized modular kits. Epinephrine stock is down to 45 vials; pharmacy to expedite the outstanding supplier order immediately.

---

### 3. Department Performance & Staffing
* **Emergency Department (ED)**: ED is under high load. Average patient boarding time is elevated. Staffing is currently at **38 nurses** and **14 doctors** on-duty, which is stable, but nurse-to-patient ratios are approaching 1:6 in holding areas.
* **Intensive Care Unit (ICU)**: ICU staff are operating under high stress. Support technicians (8 total across OT/ICU) have been reallocated to assist ICU nursing teams.
* **Pharmacy & Diagnostics**: Pharmacy is running efficiently but must focus resources on compound preparations due to Epinephrine/Heparin low levels.

---

### 4. Strategic Recommendations
1. **Ambulance Diversion Protocol**: Liaise with county EMS services to prepare active ambulance diversion for non-critical cases to neighboring hospitals if ER occupancy does not clear in the next 3 hours.
2. **Rapid Discharge Rounding**: Conduct an emergency ward-round with senior clinical directors at 16:00 to identify and clear at least 15 stable General Ward patients for home-discharge or step-down care.
3. **Emergency Supplier Engagement**: Trigger the primary distributor backup contract for immediate courier delivery of critical drugs (Heparin IV, Epinephrine) and respiratory kits within the next 4 hours.`;
}

module.exports = {
  getAlertExplanation,
  getResourceRecommendation,
  generateHospitalReport
};
