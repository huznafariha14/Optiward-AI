import React, { createContext, useContext, useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const AppContext = createContext();

const API_BASE = 'http://localhost:5000/api';
const SOCKET_BASE = 'http://localhost:5000';

export const AppProvider = ({ children }) => {
  // Global States
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [staffUser, setStaffUser] = useState(() => {
    const saved = localStorage.getItem('optiward_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [resources, setResources] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState({ resources: true, alerts: true, logs: true });
  const [socketConnected, setSocketConnected] = useState(false);

  // Theme Management
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('optiward_theme');
    return saved || 'dark';
  });

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('optiward_theme', next);
      return next;
    });
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light-theme');
    } else {
      root.classList.remove('light-theme');
    }
  }, [theme]);

  // Ref to hold the selected department to avoid stale closures in socket events
  const selectedDeptRef = React.useRef(selectedDepartment);
  useEffect(() => {
    selectedDeptRef.current = selectedDepartment;
  }, [selectedDepartment]);

  // Fetch initial data (fetches all resources globally)
  const fetchResources = async () => {
    try {
      setLoading(prev => ({ ...prev, resources: true }));
      const res = await axios.get(`${API_BASE}/resources`);
      setResources(res.data);
    } catch (e) {
      console.error('Error fetching resources:', e);
    } finally {
      setLoading(prev => ({ ...prev, resources: false }));
    }
  };

  const fetchAlerts = async () => {
    try {
      setLoading(prev => ({ ...prev, alerts: true }));
      const res = await axios.get(`${API_BASE}/alerts`);
      setAlerts(res.data);
    } catch (e) {
      console.error('Error fetching alerts:', e);
    } finally {
      setLoading(prev => ({ ...prev, alerts: false }));
    }
  };

  const fetchLogs = async (dept = selectedDepartment) => {
    try {
      setLoading(prev => ({ ...prev, logs: true }));
      const url = dept && dept !== 'All'
        ? `${API_BASE}/inventory/history?department=${encodeURIComponent(dept)}&limit=30`
        : `${API_BASE}/inventory/history?limit=30`;
      const res = await axios.get(url);
      setLogs(res.data);
    } catch (e) {
      console.error('Error fetching logs history:', e);
    } finally {
      setLoading(prev => ({ ...prev, logs: false }));
    }
  };

  // Re-fetch logs when department filter changes
  useEffect(() => {
    fetchLogs(selectedDepartment);
  }, [selectedDepartment]);

  // Bootstrapping initial fetches & Socket.io listeners (only runs once on mount)
  useEffect(() => {
    fetchResources();
    fetchAlerts();

    // Initialize Socket.io Client
    console.log('Connecting to OptiWard WebSocket Server on:', SOCKET_BASE);
    const socket = io(SOCKET_BASE);

    socket.on('connect', () => {
      console.log('Socket.io connected successfully!');
      setSocketConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Socket.io disconnected!');
      setSocketConnected(false);
    });

    // Listener for real-time resource changes (updates global resources array)
    socket.on('resource:update', (updatedResource) => {
      console.log('WS Event: resource:update ->', updatedResource);
      setResources(prev => {
        const index = prev.findIndex(r => r.id === updatedResource.id);
        if (index !== -1) {
          const next = [...prev];
          next[index] = updatedResource;
          return next;
        } else {
          return [...prev, updatedResource];
        }
      });

      // Automatically sync related alerts list, since count changes can resolve or trigger them
      fetchAlerts();
    });

    // Listener for new alerts
    socket.on('alert:new', (newAlert) => {
      console.log('WS Event: alert:new ->', newAlert);
      setAlerts(prev => {
        if (prev.some(a => a.id === newAlert.id)) return prev;
        return [newAlert, ...prev];
      });
    });

    // Listener for resolved alerts
    socket.on('alert:resolved', (resolvedId) => {
      console.log('WS Event: alert:resolved ->', resolvedId);
      setAlerts(prev => prev.filter(a => a.id !== resolvedId));
    });

    // Listener for new history logs
    socket.on('inventory:log', (newLog) => {
      console.log('WS Event: inventory:log ->', newLog);
      setLogs(prev => {
        const matchesDept = selectedDeptRef.current === 'All' || newLog.department === selectedDeptRef.current;
        if (!matchesDept) return prev;
        
        return [newLog, ...prev].slice(0, 30);
      });
    });

    // Listener for full inventory list reload (e.g. after transfers)
    socket.on('resources:reload', () => {
      console.log('WS Event: resources:reload');
      fetchResources();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const loginWithTag = async (idTag) => {
    try {
      const res = await axios.post(`${API_BASE}/auth/login-tag`, { idTag });
      if (res.data.success) {
        setStaffUser(res.data.user);
        localStorage.setItem('optiward_user', JSON.stringify(res.data.user));
        return { success: true };
      }
      return { success: false, error: 'Unrecognized RFID tag' };
    } catch (e) {
      console.error('Error logging in with RFID tag:', e);
      return { 
        success: false, 
        error: e.response?.data?.error || 'Failed to authenticate tag. Check connection.' 
      };
    }
  };

  const loginDemo = async (role) => {
    try {
      const res = await axios.post(`${API_BASE}/auth/login-demo`, { role });
      if (res.data.success) {
        setStaffUser(res.data.user);
        localStorage.setItem('optiward_user', JSON.stringify(res.data.user));
        return { success: true };
      }
      return { success: false, error: 'Unrecognized role' };
    } catch (e) {
      console.error('Error logging in with demo role:', e);
      return { 
        success: false, 
        error: e.response?.data?.error || 'Failed to login with demo role. Check connection.' 
      };
    }
  };

  const logout = () => {
    setStaffUser(null);
    localStorage.removeItem('optiward_user');
  };

  return (
    <AppContext.Provider value={{
      selectedDepartment,
      setSelectedDepartment,
      staffUser,
      setStaffUser,
      resources,
      alerts,
      logs,
      loading,
      socketConnected,
      theme,
      toggleTheme,
      fetchResources,
      fetchAlerts,
      fetchLogs,
      loginWithTag,
      loginDemo,
      logout,
      API_BASE
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
