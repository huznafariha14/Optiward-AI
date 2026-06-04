import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children, activeTab, setActiveTab }) => {
  return (
    <div className="app-container">
      {/* Permanent Dark Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="main-content">
        {/* Top Header Navigation */}
        <Header activeTab={activeTab} />

        {/* Dynamic Page Content */}
        <div className="page-content-wrapper">
          {children}
        </div>
      </main>

      <style>{`
        .page-content-wrapper {
          display: flex;
          flex-direction: column;
          gap: 24px;
          animation: fadeIn var(--transition-normal);
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Layout;
