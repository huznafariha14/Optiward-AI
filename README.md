# 🏥 OptiWard AI — Smart Healthcare Resource Management System

OptiWard AI is a real-time, AI-powered healthcare resource management system and dashboard engineered for modern hospital networks. It assists clinical directors, physicians, and nursing staff in maintaining absolute visibility over hospital beds, critical drugs, medical devices, emergency kits, and active staffing pools. 

Utilizing advanced linear forecasting and clinical LLM prompt matrices, OptiWard AI predicts resource depletion paths 6 to 24 hours before a shortage occurs, offering clear clinical action playbooks to avert operational gridlocks.

---

## 🚀 Hackathon Key Differentiators

1. **AI Natural Language Alerts**: Rather than displaying raw percentages, our predictive alarm engine outputs clinical alerts in plain English, explaining *why* a shortage is impending (e.g., "At current trauma admission quotients, ICU beds will cross critical thresholds in 6 hours").
2. **Predictive Depletion forecasting**: Standard dashboards warn you *when* you are out of stock; OptiWard AI warns you *6 to 24 hours before* you run out, utilizing historical linear regression trends.
3. **AI Clinical Triage Assistant**: When emergency patients arrive, staff input condition, age, and clinical severity (1-5 scale) to instantly receive optimal bed placement, necessary bedside equipment, authorized medicines, and standby blood type setups.
4. **CMD Operations Report Generator**: Chief Medical Directors can compile and generate a complete, plain English operational status report (utilization indexes, staffing balance, strategic recommendations) with a single click.
5. **Real-time WebSockets Sync**: Every dashboard tile, timeline event, and change log synchronizes across all active clinical clients instantly without page reloads.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19 + Vite 8 | Ultra-fast rendering SPA with hot module reloading. |
| **Styling** | Custom HSL CSS | Deep slate-navy medical grade layout, premium glassmorphism, responsive grid sheets. |
| **Charts** | Recharts 3.x | Custom styled area, bar, line, and pie visualizations. |
| **Backend** | Node.js + Express 5 | REST API endpoints for inventory and AI analytics. |
| **Real-time** | Socket.io 4.x | Persistent WebSockets protocol for cross-user live inventory updates. |
| **Database** | Lightweight JSON DB | Self-contained, file-based mock database utilizing local transaction logging, removing MongoDB pre-requisites. |
| **AI Engine** | OpenAI API (GPT-4o) | Contextual triage recommendations, executive reporting, and predictive alert explanations (includes a highly robust clinical rules local fallback). |

---

## 📂 System Architecture

```
OptiWard/
├── client/                          # React + Vite frontend
│   ├── src/
│   │   ├── components/              # Layout shell, Sidebar, Header, KPI Cards
│   │   ├── context/                 # Global AppContext managing Socket.io events
│   │   ├── pages/                   # Dashboard, Alerts, Inventory, Allocation, Analytics
│   │   ├── index.css                # Global CSS stylesheet & design tokens
│   │   └── App.jsx                  # Root router & tab manager
│   └── package.json
│
├── server/                          # Node.js + Express backend
│   ├── routes/                      # API endpoints (Resources, Inventory, Alerts, Analytics)
│   ├── services/                    # Local DB service, AI engine, Predictive trend service
│   ├── data/                        # Active JSON data files (auto-seeded)
│   ├── server.js                    # Entry point establishing Express & Socket.io
│   └── package.json
│
└── run_meditrack.ps1                # One-click portable environment run script
```

---

## ⚡ Quick Start

OptiWard AI is packaged with a fully portable Node.js environment in the parent directory, meaning you do not need to install Node or MongoDB globally on your machine to test it.

### 1. Launch the Application

We have created an automated runner script `run_meditrack.ps1` in the root folder. 

Open a PowerShell terminal and run:
```powershell
./run_meditrack.ps1
```

This will:
1. Temporarily configure the local path to use the portable Node/npm bundle.
2. Spin up the **Express server** on **http://localhost:5000** (auto-seeding historical trends and resources).
3. Spin up the **Vite React Dev Server** on **http://localhost:5173**.
4. Open the application automatically in your default browser.

### 2. Manual Terminal Launch

If you prefer to run the client and server manually (with node in your system path):

#### Start Backend:
```bash
cd server
npm install
npm run dev
```

#### Start Frontend:
```bash
cd client
npm install
npm run dev
```
Open **http://localhost:5173** in your web browser.
