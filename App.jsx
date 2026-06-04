import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/layout/Layout';
import LoginPortal from './components/layout/LoginPortal';
import Dashboard from './pages/Dashboard';
import Alerts from './pages/Alerts';
import Inventory from './pages/Inventory';
import Allocation from './pages/Allocation';
import Analytics from './pages/Analytics';

function AppContent() {
  const { staffUser } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [preselectedId, setPreselectedId] = useState(null);

  // Shortcut transition from Dashboard card to Inventory form
  const handleQuickUpdateShortcut = (resourceId) => {
    setPreselectedId(resourceId);
    setActiveTab('inventory');
  };

  const clearPreselection = () => {
    setPreselectedId(null);
  };

  if (!staffUser) {
    return <LoginPortal />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && (
        <Dashboard onQuickUpdateClick={handleQuickUpdateShortcut} />
      )}
      {activeTab === 'alerts' && (
        <Alerts />
      )}
      {activeTab === 'inventory' && (
        <Inventory 
          preselectedResourceId={preselectedId} 
          clearPreselection={clearPreselection} 
        />
      )}
      {activeTab === 'allocation' && (
        <Allocation />
      )}
      {activeTab === 'analytics' && (
        <Analytics />
      )}
    </Layout>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
