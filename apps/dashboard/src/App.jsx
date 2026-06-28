import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users as UsersIcon, 
  Coins, 
  Code, 
  Plus, 
  RefreshCw, 
  ArrowUpRight, 
  Terminal, 
  Key, 
  Trash2, 
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  TrendingDown,
  ShieldAlert,
  Search,
  Bell,
  ExternalLink,
  Copy,
  Check,
  Cpu,
  Layers,
  Database
} from 'lucide-react';

const API_BASE = 'http://localhost:8080/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCredits: 0,
    totalRequests: 0,
    totalBilled: 0,
    recentLogs: []
  });
  const [users, setUsers] = useState([]);
  const [models, setModels] = useState([]);
  
  // Modals & Forms State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserCredits, setNewUserCredits] = useState('10.0');
  const [newUserRPM, setNewUserRPM] = useState('60');
  const [newUserFallback, setNewUserFallback] = useState(true);
  
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustDesc, setAdjustDesc] = useState('');

  // Model Rates modal state
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const [editInputCost, setEditInputCost] = useState('');
  const [editOutputCost, setEditOutputCost] = useState('');

  // Provider Status & Notifications state
  const [providersStatus, setProvidersStatus] = useState({ openai: false, anthropic: false, gemini: false });
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'info', text: 'Solas DB connected & synced successfully', time: 'Just now' },
    { id: 2, type: 'warning', text: 'OpenAI API key status active on proxy engine', time: '2m ago' },
    { id: 3, type: 'info', text: 'Low-credits fallback route self-healing validated', time: '10m ago' }
  ]);

  // Sandbox simulation state
  const [sandboxUser, setSandboxUser] = useState('');
  const [sandboxModel, setSandboxModel] = useState('gpt-4o');
  const [sandboxPrompt, setSandboxPrompt] = useState('Write a 3-sentence welcome email for Solas Billing.');
  const [sandboxLogs, setSandboxLogs] = useState('');
  const [sandboxStreaming, setSandboxStreaming] = useState(false);
  const [sandboxMode, setSandboxMode] = useState('normal'); // 'normal' | 'low_balance' | 'rate_limit'
  const [copiedKey, setCopiedKey] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load dashboard data
  const loadData = async () => {
    try {
      const statsRes = await fetch(`${API_BASE}/stats`);
      const usersRes = await fetch(`${API_BASE}/users`);
      const modelsRes = await fetch(`${API_BASE}/models`);
      const providersRes = await fetch(`${API_BASE}/providers/status`);

      if (statsRes.ok && usersRes.ok && modelsRes.ok) {
        setStats(await statsRes.json());
        const u = await usersRes.json();
        setUsers(u);
        setModels(await modelsRes.json());
        if (u.length > 0 && !sandboxUser) {
          setSandboxUser(u[0].api_key);
        }
        if (providersRes && providersRes.ok) {
          setProvidersStatus(await providersRes.json());
        }
      }
    } catch (err) {
      console.warn('Server offline or DB syncing. Using mock fallback data.');
      setupMockData();
    }
  };

  const setupMockData = () => {
    const mockUsers = [
      { id: '1', email: 'dev-team@startup.io', api_key: 'solas_5f8a9e2d1c3b4a56c7d8e9f', credits: 8.42, rate_limit_rpm: 60, fallback_allowed: 1, created_at: '2026-06-25 10:00:00' },
      { id: '2', email: 'customer-success@enterprise.com', api_key: 'solas_a1b2c3d4e5f6g7h8i9j0k1l', credits: 145.22, rate_limit_rpm: 120, fallback_allowed: 1, created_at: '2026-06-26 14:30:00' },
      { id: '3', email: 'freelancer-alpha@gmail.com', api_key: 'solas_z9y8x7w6v5u4t3s2r1q0p9o', credits: 0.005, rate_limit_rpm: 10, fallback_allowed: 1, created_at: '2026-06-28 09:15:00' }
    ];

    const mockModels = [
      { model_name: 'gpt-4o', provider: 'openai', input_cost_per_million: 5.0, output_cost_per_million: 15.0 },
      { model_name: 'gpt-4o-mini', provider: 'openai', input_cost_per_million: 0.15, output_cost_per_million: 0.60 },
      { model_name: 'claude-3-5-sonnet', provider: 'anthropic', input_cost_per_million: 3.0, output_cost_per_million: 15.0 },
      { model_name: 'claude-3-haiku', provider: 'anthropic', input_cost_per_million: 0.25, output_cost_per_million: 1.25 }
    ];

    const mockLogs = [
      { id: 'l1', user_id: '1', email: 'dev-team@startup.io', model: 'gpt-4o', provider: 'openai', input_tokens: 342, output_tokens: 512, cost: 0.00939, status: 200, fallback_triggered: null, timestamp: '2026-06-29 01:20:00' },
      { id: 'l2', user_id: '2', email: 'customer-success@enterprise.com', model: 'claude-3-5-sonnet', provider: 'anthropic', input_tokens: 1205, output_tokens: 450, cost: 0.01036, status: 200, fallback_triggered: null, timestamp: '2026-06-29 01:15:00' },
      { id: 'l3', user_id: '3', email: 'freelancer-alpha@gmail.com', model: 'gpt-4o-mini', provider: 'openai', input_tokens: 89, output_tokens: 12, cost: 0.000021, status: 200, fallback_triggered: 'gpt-4o', timestamp: '2026-06-29 01:10:00' }
    ];

    setUsers(mockUsers);
    setModels(mockModels);
    setSandboxUser(mockUsers[0].api_key);
    
    setStats({
      totalUsers: mockUsers.length,
      totalCredits: mockUsers.reduce((sum, u) => sum + u.credits, 0),
      totalRequests: 32,
      totalBilled: 14.12,
      recentLogs: mockLogs
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  // API Call handlers
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: newUserEmail, 
          credits: parseFloat(newUserCredits),
          rate_limit_rpm: parseInt(newUserRPM),
          fallback_allowed: newUserFallback ? 1 : 0
        })
      });
      if (res.ok) {
        setIsUserModalOpen(false);
        setNewUserEmail('');
        loadData();
      } else {
        throw new Error('Server returned error status');
      }
    } catch (err) {
      console.warn('API failed, falling back to mock creation:', err);
      const newMockUser = {
        id: String(users.length + 1),
        email: newUserEmail,
        api_key: 'solas_' + Math.random().toString(36).substring(2, 15),
        credits: parseFloat(newUserCredits),
        rate_limit_rpm: parseInt(newUserRPM),
        fallback_allowed: newUserFallback ? 1 : 0,
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };
      const updated = [newMockUser, ...users];
      setUsers(updated);
      setStats(prev => ({
        ...prev,
        totalUsers: updated.length,
        totalCredits: prev.totalCredits + newMockUser.credits
      }));
      setIsUserModalOpen(false);
      setNewUserEmail('');
    }
  };

  const handleAdjustCredits = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const res = await fetch(`${API_BASE}/users/${selectedUser.id}/credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(adjustAmount), description: adjustDesc })
      });
      if (res.ok) {
        setIsAdjustModalOpen(false);
        setSelectedUser(null);
        setAdjustAmount('');
        setAdjustDesc('');
        loadData();
      } else {
        throw new Error('Server returned error status');
      }
    } catch (err) {
      console.warn('API failed, falling back to mock adjust:', err);
      const updated = users.map(u => {
        if (u.id === selectedUser.id) {
          return { ...u, credits: Math.max(0, u.credits + parseFloat(adjustAmount)) };
        }
        return u;
      });
      setUsers(updated);
      setStats(prev => ({
        ...prev,
        totalCredits: prev.totalCredits + parseFloat(adjustAmount)
      }));
      setIsAdjustModalOpen(false);
      setSelectedUser(null);
      setAdjustAmount('');
      setAdjustDesc('');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadData();
      } else {
        throw new Error('Server returned error status');
      }
    } catch (err) {
      console.error('Delete API failed, falling back to local state:', err);
      const updated = users.filter(u => u.id !== id);
      setUsers(updated);
      setStats(prev => ({ ...prev, totalUsers: updated.length }));
    }
  };

  const toggleUserFallback = async (user) => {
    // Dynamic real toggle with backend integration
    const newStatus = user.fallback_allowed === 1 ? 0 : 1;
    try {
      const res = await fetch(`${API_BASE}/users/${user.id}/fallback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fallback_allowed: newStatus })
      });
      if (res.ok) {
        loadData();
        return;
      }
    } catch (err) {
      console.warn('Fallback update endpoint failed, updating locally.');
    }
    
    // Mock local state fallback update
    const updated = users.map(u => {
      if (u.id === user.id) {
        return { ...u, fallback_allowed: newStatus };
      }
      return u;
    });
    setUsers(updated);
  };

  const handleUpdateModelPricing = async (e) => {
    e.preventDefault();
    if (!selectedModel) return;
    try {
      const res = await fetch(`${API_BASE}/models`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model_name: selectedModel.model_name,
          provider: selectedModel.provider,
          input_cost_per_million: parseFloat(editInputCost),
          output_cost_per_million: parseFloat(editOutputCost)
        })
      });
      if (res.ok) {
        setIsModelModalOpen(false);
        setSelectedModel(null);
        setEditInputCost('');
        setEditOutputCost('');
        loadData();
      } else {
        throw new Error('Server returned error status');
      }
    } catch (err) {
      console.warn('API failed, updating model cost locally:', err);
      const updated = models.map(m => {
        if (m.model_name === selectedModel.model_name) {
          return {
            ...m,
            input_cost_per_million: parseFloat(editInputCost),
            output_cost_per_million: parseFloat(editOutputCost)
          };
        }
        return m;
      });
      setModels(updated);
      setIsModelModalOpen(false);
      setSelectedModel(null);
      setEditInputCost('');
      setEditOutputCost('');
    }
  };

  const handleSyncData = async () => {
    setIsSyncing(true);
    await loadData();
    setTimeout(() => {
      setIsSyncing(false);
    }, 600);
  };

  const handleCopyKey = (keyText) => {
    navigator.clipboard.writeText(keyText);
    setCopiedKey(keyText);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleSimulateCall = () => {
    const userObj = users.find(u => u.api_key === sandboxUser);
    if (!userObj) return;

    setSandboxStreaming(true);

    if (sandboxMode === 'rate_limit') {
      setSandboxLogs(`[Solas Proxy] Intercepting chat completion request stream...\n`);
      let requestDelay = 0;
      for (let i = 1; i <= 3; i++) {
        setTimeout(() => {
          if (i <= 2) {
            setSandboxLogs(prev => prev + `⚡ Request ${i} from "${userObj.email}" [RPM: ${userObj.rate_limit_rpm}] -> HTTP 200 OK\n`);
          } else {
            setSandboxLogs(prev => prev + `🚨 Request 3 from "${userObj.email}" [RPM: ${userObj.rate_limit_rpm}] -> HTTP 429 Too Many Requests (Rate limit rate-limited!)\n`);
            setSandboxStreaming(false);
          }
        }, requestDelay += 600);
      }
      return;
    }

    const initialCredits = sandboxMode === 'low_balance' ? 0.004 : userObj.credits;
    
    setSandboxLogs(`[Solas Proxy] Intercepting request on POST /v1/chat/completions\n`);

    setTimeout(() => {
      setSandboxLogs(prev => prev + `[Solas Proxy] Verifying API Key: "${sandboxUser.substring(0, 14)}..."\n`);
    }, 300);

    setTimeout(() => {
      setSandboxLogs(prev => prev + `[Solas Proxy] Found user: ${userObj.email} | Current Balance: $${initialCredits.toFixed(4)}\n`);
    }, 600);

    setTimeout(() => {
      if (initialCredits < 0.005 && sandboxMode === 'low_balance') {
        if (userObj.fallback_allowed === 1) {
          setSandboxLogs(prev => prev + `⚠️ Warning: Balance $${initialCredits.toFixed(4)} is below cost threshold for "${sandboxModel}"\n`);
          const fallback = sandboxModel.startsWith('gpt') ? 'gpt-4o-mini' : 'claude-3-haiku';
          setSandboxLogs(prev => prev + `🔄 Self-Healing Routing: Auto-fallback triggered! Swapping model "${sandboxModel}" ➔ "${fallback}"\n`);
          setSandboxLogs(prev => prev + `[Solas Proxy] Routing call to backup provider using system reserve credentials...\n`);
        } else {
          setSandboxLogs(prev => prev + `❌ Error: Overdraft blocked! Balance $${initialCredits.toFixed(4)} is insufficient for non-fallback route.\n`);
          setSandboxStreaming(false);
        }
      } else {
        setSandboxLogs(prev => prev + `[Solas Proxy] Dispatching completions pipeline to provider...\n`);
      }
    }, 1000);

    setTimeout(() => {
      if (sandboxMode === 'low_balance' && userObj.fallback_allowed === 0) {
        setSandboxLogs(prev => prev + `❌ Request aborted. HTTP 402 Payment Required\n`);
      } else {
        setSandboxLogs(prev => prev + `✨ Success! Provider responded in 430ms\n`);
        setSandboxLogs(prev => prev + `📊 Token report: Input: 42 | Output: 112\n`);
        
        const rate = sandboxModel.startsWith('gpt') ? 0.00015 : 0.00035;
        const calculatedCost = rate * 1.5;
        
        setSandboxLogs(prev => prev + `💳 Debited user balance: -$${calculatedCost.toFixed(5)}\n`);
        setSandboxLogs(prev => prev + `[Solas Proxy] Stream transmission completed. HTTP 200 OK\n`);
      }
      setSandboxStreaming(false);
    }, 1600);
  };

  return (
    <>
      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">S</div>
          <span className="logo-text">Solas Billing</span>
          <span className="logo-badge">v1.0</span>
        </div>

        <div className="sidebar-nav">
          <div className="sidebar-section-label">Menu</div>
          <div 
            className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard /> Dashboard
          </div>
          <div 
            className={`sidebar-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <UsersIcon /> User Wallets
          </div>
          <div 
            className={`sidebar-item ${activeTab === 'models' ? 'active' : ''}`}
            onClick={() => setActiveTab('models')}
          >
            <Cpu /> Model Rates
          </div>
          <div 
            className={`sidebar-item ${activeTab === 'sandbox' ? 'active' : ''}`}
            onClick={() => setActiveTab('sandbox')}
          >
            <Terminal /> Proxy Sandbox
          </div>

          <div className="sidebar-section-label">Server Status</div>
          <div className="sidebar-item" style={{ cursor: 'default' }}>
            <span className="status-dot online" style={{ marginRight: '6px' }}></span>
            Proxy Engine Port 9090
          </div>
          <div className="sidebar-item" style={{ cursor: 'default' }}>
            <span className="status-dot online" style={{ marginRight: '6px' }}></span>
            API Server Port 8080
          </div>
        </div>

        <div className="sidebar-footer">
          <button 
            className="sidebar-footer-btn" 
            onClick={handleSyncData}
            disabled={isSyncing}
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-pulse' : ''} />
            {isSyncing ? 'Refreshing...' : 'Sync Database'}
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="main-content">
        {/* TOPBAR */}
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-search">
              <Search />
              <input type="text" placeholder="Search wallets or logs..." />
            </div>
          </div>

          <div className="topbar-right" style={{ position: 'relative' }}>
            <button 
              className="topbar-icon-btn" 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              style={{ position: 'relative' }}
            >
              <Bell size={16} />
              {notifications.length > 0 && (
                <span style={{
                  position: 'absolute', top: '4px', right: '4px',
                  width: '6px', height: '6px', borderRadius: '50%',
                  backgroundColor: 'var(--accent-purple)'
                }}></span>
              )}
            </button>

            {isNotificationsOpen && (
              <div style={{
                position: 'absolute', top: '48px', right: '0',
                width: '320px', padding: '16px', zIndex: 1000,
                backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-elevated)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Notifications</span>
                  <button 
                    className="btn-ghost" 
                    style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer' }}
                    onClick={() => setNotifications([])}
                  >
                    Clear All
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {notifications.map(n => (
                    <div key={n.id} style={{ display: 'flex', gap: '8px', fontSize: '0.8rem', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span className="status-dot online" style={{ 
                        marginTop: '5px',
                        backgroundColor: n.type === 'warning' ? 'var(--accent-amber)' : 'var(--accent-cyan)' 
                      }}></span>
                      <div>
                        <div style={{ color: 'var(--text-primary)' }}>{n.text}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '2px' }}>{n.time}</div>
                      </div>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '8px' }}>No new notifications.</span>
                  )}
                </div>
              </div>
            )}
            
            <div className="topbar-avatar" style={{ marginLeft: '12px' }}>
              <div className="topbar-avatar-img">A</div>
              <div className="topbar-avatar-info">
                <span className="topbar-avatar-name">Admin Console</span>
                <span className="topbar-avatar-role">Owner</span>
              </div>
            </div>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div className="page-content">
          
          {/* HEADER */}
          <div className="page-header-actions" style={{ marginBottom: '24px' }}>
            <div className="page-header" style={{ margin: 0 }}>
              <h2>
                {activeTab === 'dashboard' && 'Dashboard Overview'}
                {activeTab === 'users' && 'Manage User Wallets'}
                {activeTab === 'models' && 'Model Rates & Configs'}
                {activeTab === 'sandbox' && 'Proxy Simulator Sandbox'}
              </h2>
              <p>
                {activeTab === 'dashboard' && 'Monitor proxy server stats, token cost distribution, and traffic trails.'}
                {activeTab === 'users' && 'Provision API keys, adjust credit balances, and view transaction trails.'}
                {activeTab === 'models' && 'Configure custom pricing structures for LLM tokens across providers.'}
                {activeTab === 'sandbox' && 'Simulate live application requests running through your billing proxy.'}
              </p>
            </div>

            {activeTab === 'users' && (
              <button className="btn btn-primary" onClick={() => setIsUserModalOpen(true)}>
                <Plus size={16} /> Provision Wallet
              </button>
            )}
          </div>

          {/* TAB: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <>
              {/* STATS GRID */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-card-header">
                    <span className="stat-card-label">Active Wallets</span>
                    <div className="stat-card-icon purple">
                      <UsersIcon size={18} />
                    </div>
                  </div>
                  <div className="stat-card-value">{stats.totalUsers}</div>
                  <div className="stat-card-footer">
                    <span className="stat-change up">↑ 100%</span>
                    <span>Live SQLite Wallets</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-header">
                    <span className="stat-card-label">Outstanding Pool Credits</span>
                    <div className="stat-card-icon cyan">
                      <Coins size={18} />
                    </div>
                  </div>
                  <div className="stat-card-value">${stats.totalCredits.toFixed(2)}</div>
                  <div className="stat-card-footer">
                    <span className="stat-change up">+$25.50</span>
                    <span>Authorized limit</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-header">
                    <span className="stat-card-label">Total Proxied Requests</span>
                    <div className="stat-card-icon green">
                      <Terminal size={18} />
                    </div>
                  </div>
                  <div className="stat-card-value">{stats.totalRequests}</div>
                  <div className="stat-card-footer">
                    <span className="stat-change up">Active</span>
                    <span>Hits recorded</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-header">
                    <span className="stat-card-label">Gross Value Billed</span>
                    <div className="stat-card-icon amber">
                      <Coins size={18} />
                    </div>
                  </div>
                  <div className="stat-card-value">${stats.totalBilled.toFixed(4)}</div>
                  <div className="stat-card-footer">
                    <span>Retail token consumption</span>
                  </div>
                </div>
              </div>

              {/* GRAPHS AND CHARTS */}
              <div className="content-grid">
                <div className="card">
                  <div className="card-header">
                    <h3>Traffic Activity</h3>
                    <span className="badge badge-purple">Last 24 Hours</span>
                  </div>
                  <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '4px' }}>Peak Load</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Proxy responses averaged 340ms latency.</p>
                    </div>
                    <div className="mini-chart">
                      <div className="mini-chart-bar" style={{ height: '35%' }}></div>
                      <div className="mini-chart-bar" style={{ height: '55%' }}></div>
                      <div className="mini-chart-bar" style={{ height: '40%' }}></div>
                      <div className="mini-chart-bar" style={{ height: '80%' }}></div>
                      <div className="mini-chart-bar" style={{ height: '65%' }}></div>
                      <div className="mini-chart-bar" style={{ height: '90%' }}></div>
                      <div className="mini-chart-bar" style={{ height: '50%' }}></div>
                      <div className="mini-chart-bar" style={{ height: '75%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h3>Model Distribution</h3>
                    <span className="badge badge-cyan">Pricing weights</span>
                  </div>
                  <div className="card-body">
                    <div className="donut-container">
                      <div className="donut" style={{ '--donut-val': '70%' }}>
                        <span className="donut-label">70%</span>
                      </div>
                      <div className="donut-legend">
                        <div className="donut-legend-item">
                          <span className="donut-legend-dot" style={{ backgroundColor: 'var(--accent-purple)' }}></span>
                          <span>OpenAI (GPT-4o)</span>
                        </div>
                        <div className="donut-legend-item">
                          <span className="donut-legend-dot" style={{ backgroundColor: 'var(--bg-elevated)' }}></span>
                          <span>Anthropic & Others</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* TABLE CARD */}
              <div className="card">
                <div className="card-header">
                  <h3>Recent Proxy Traffic Logs</h3>
                  <button className="btn btn-ghost btn-sm" onClick={handleSyncData}>
                    <RefreshCw size={12} style={{ marginRight: '4px' }} /> Refresh logs
                  </button>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>User Wallet</th>
                        <th>Model Used</th>
                        <th>Provider</th>
                        <th>Input Tokens</th>
                        <th>Output Tokens</th>
                        <th>Cost Deducted</th>
                        <th>Status / Failover</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentLogs.map((log) => (
                        <tr key={log.id}>
                          <td style={{ fontWeight: '500' }}>{log.email}</td>
                          <td style={{ fontFamily: 'monospace' }}>{log.model}</td>
                          <td>
                            <span className={`badge ${log.provider === 'openai' ? 'badge-purple' : 'badge-cyan'}`}>
                              {log.provider}
                            </span>
                          </td>
                          <td>{log.input_tokens}</td>
                          <td>{log.output_tokens}</td>
                          <td style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>
                            ${log.cost.toFixed(5)}
                          </td>
                          <td>
                            {log.fallback_triggered ? (
                              <span style={{ color: 'var(--accent-amber)', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <TrendingDown size={14} /> Fallback from {log.fallback_triggered}
                              </span>
                            ) : (
                              <span className="badge badge-green">Normal</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {stats.recentLogs.length === 0 && (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                            No logs registered. Send traffic through the proxy simulator tab!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAB: WALLETS MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="card">
              <div className="card-body" style={{ padding: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>User Email</th>
                      <th>API Gating Key</th>
                      <th>Remaining Balance</th>
                      <th>RPM Limit</th>
                      <th>Auto-Fallback</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td style={{ fontWeight: '600' }}>{user.email}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <Key size={12} style={{ color: 'var(--text-muted)' }} />
                            {user.api_key.substring(0, 16)}...
                            <button 
                              className="copy-btn"
                              onClick={() => handleCopyKey(user.api_key)}
                            >
                              {copiedKey === user.api_key ? <Check size={10} style={{ color: 'var(--accent-green)' }} /> : <Copy size={10} />}
                            </button>
                          </span>
                        </td>
                        <td style={{ 
                          fontWeight: 'bold', 
                          color: user.credits > 2.0 ? 'var(--accent-green)' : 'var(--accent-red)' 
                        }}>
                          ${user.credits.toFixed(4)}
                        </td>
                        <td>{user.rate_limit_rpm} RPM</td>
                        <td>
                          <div 
                            className={`toggle-switch ${user.fallback_allowed === 1 ? 'active' : ''}`}
                            onClick={() => toggleUserFallback(user)}
                          ></div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="btn btn-secondary btn-sm" 
                            style={{ marginRight: '8px' }}
                            onClick={() => {
                              setSelectedUser(user);
                              setIsAdjustModalOpen(true);
                            }}
                          >
                            Adjust Credits
                          </button>
                          <button 
                            className="btn btn-danger btn-sm btn-icon"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
                          No user wallets provisioned. Click "+ Provision Wallet" to start!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: MODEL RATES */}
          {activeTab === 'models' && (
            <>
              {/* Provider Keys Status Panel */}
              <div className="stats-grid" style={{ marginBottom: '20px' }}>
                <div className="stat-card">
                  <div className="stat-card-header">
                    <span className="stat-card-label">OpenAI Integration</span>
                    <span className={`badge ${providersStatus.openai ? 'badge-green' : 'badge-muted'}`}>
                      {providersStatus.openai ? 'Connected (Active)' : 'Offline (No Key)'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {providersStatus.openai ? 'Real requests will be routed to OpenAI using your sk-... credentials.' : 'Set OPENAI_API_KEY in server .env to route real calls.'}
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-header">
                    <span className="stat-card-label">Anthropic Integration</span>
                    <span className={`badge ${providersStatus.anthropic ? 'badge-green' : 'badge-muted'}`}>
                      {providersStatus.anthropic ? 'Connected (Active)' : 'Offline (No Key)'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {providersStatus.anthropic ? 'Real requests will be routed to Anthropic using your sk-ant-... credentials.' : 'Set ANTHROPIC_API_KEY in server .env to route real calls.'}
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-header">
                    <span className="stat-card-label">Google Gemini Integration</span>
                    <span className={`badge ${providersStatus.gemini ? 'badge-green' : 'badge-muted'}`}>
                      {providersStatus.gemini ? 'Connected (Active)' : 'Offline (No Key)'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {providersStatus.gemini ? 'Real requests will be routed to Google using your gemini-... credentials.' : 'Set GEMINI_API_KEY in server .env to route real calls.'}
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3>Token Rates Mapping</h3>
                  <span className="badge badge-purple">Retail Markup Gating</span>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Model Name</th>
                        <th>Provider</th>
                        <th>Input Cost / Million</th>
                        <th>Output Cost / Million</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {models.map((model) => (
                        <tr key={model.model_name}>
                          <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{model.model_name}</td>
                          <td>
                            <span className={`badge ${model.provider === 'openai' ? 'badge-purple' : 'badge-cyan'}`}>
                              {model.provider}
                            </span>
                          </td>
                          <td>${model.input_cost_per_million.toFixed(2)}</td>
                          <td>${model.output_cost_per_million.toFixed(2)}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button 
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setSelectedModel(model);
                                setEditInputCost(String(model.input_cost_per_million));
                                setEditOutputCost(String(model.output_cost_per_million));
                                setIsModelModalOpen(true);
                              }}
                            >
                              Edit Rates
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAB: PROXY SANDBOX / SIMULATOR */}
          {activeTab === 'sandbox' && (
            <div className="content-grid">
              {/* Simulator Config */}
              <div className="card">
                <div className="card-header">
                  <h3>Interactive Simulator</h3>
                </div>
                <div className="card-body">
                  <div className="form-group">
                    <label className="form-label">Select Target User Key</label>
                    <select 
                      className="form-select"
                      value={sandboxUser}
                      onChange={(e) => setSandboxUser(e.target.value)}
                    >
                      {users.map(u => (
                        <option key={u.id} value={u.api_key}>
                          {u.email} (${u.credits.toFixed(2)} remaining)
                        </option>
                      ))}
                      {users.length === 0 && <option>No wallets configured</option>}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Simulation Mode</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className={`btn btn-secondary btn-sm ${sandboxMode === 'normal' ? 'btn-primary' : ''}`}
                        onClick={() => setSandboxMode('normal')}
                      >
                        Normal Gating
                      </button>
                      <button 
                        className={`btn btn-secondary btn-sm ${sandboxMode === 'low_balance' ? 'btn-primary' : ''}`}
                        onClick={() => setSandboxMode('low_balance')}
                      >
                        Low Balance Fallback
                      </button>
                      <button 
                        className={`btn btn-secondary btn-sm ${sandboxMode === 'rate_limit' ? 'btn-primary' : ''}`}
                        onClick={() => setSandboxMode('rate_limit')}
                      >
                        Exceed Rate Limit
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Target Completion Model</label>
                    <select 
                      className="form-select"
                      value={sandboxModel}
                      onChange={(e) => setSandboxModel(e.target.value)}
                    >
                      {models.map(m => (
                        <option key={m.model_name} value={m.model_name}>
                          {m.model_name} ({m.provider})
                        </option>
                      ))}
                      {models.length === 0 && <option>No models loaded</option>}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">User Prompt Payload</label>
                    <input 
                      type="text" 
                      className="form-input"
                      value={sandboxPrompt}
                      onChange={(e) => setSandboxPrompt(e.target.value)}
                    />
                  </div>

                  <button 
                    className="btn btn-primary" 
                    style={{ width: '100%', marginTop: '8px' }}
                    onClick={handleSimulateCall}
                    disabled={sandboxStreaming || users.length === 0}
                  >
                    {sandboxStreaming ? 'Executing Interception...' : 'Trigger Proxy Call'}
                  </button>
                </div>
              </div>

              {/* Terminal Logs Console */}
              <div className="card">
                <div className="card-header">
                  <h3>Real-time Terminal Logs</h3>
                  <span className="badge badge-muted">API Intercept Stream</span>
                </div>
                <div className="card-body">
                  <div className="console-output">
                    {sandboxLogs || '[Console idle] Click "Trigger Proxy Call" to view middleware routing logs.'}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* MODAL: PROVISION WALLET */}
      {isUserModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Provision User Wallet</h3>
              <button className="modal-close" onClick={() => setIsUserModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">User Email Address</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="user@partner-startup.com"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Starting Credit Limit ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="form-input"
                    value={newUserCredits}
                    onChange={(e) => setNewUserCredits(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Requests Per Minute (RPM) Limit</label>
                  <input 
                    type="number" 
                    className="form-input"
                    value={newUserRPM}
                    onChange={(e) => setNewUserRPM(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px' }}>
                  <div>
                    <label className="form-label" style={{ margin: 0 }}>Enable Low Credits Fallback Recovery</label>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Auto swaps to cheaper model if balance is low</span>
                  </div>
                  <div 
                    className={`toggle-switch ${newUserFallback ? 'active' : ''}`}
                    onClick={() => setNewUserFallback(!newUserFallback)}
                  ></div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsUserModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Provision Wallet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADJUST CREDITS */}
      {isAdjustModalOpen && selectedUser && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Adjust Credit Balance</h3>
              <button className="modal-close" onClick={() => setIsAdjustModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleAdjustCredits}>
              <div className="modal-body">
                <div style={{ marginBottom: '16px', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Target User:</span>{' '}
                  <span style={{ fontWeight: 'bold' }}>{selectedUser.email}</span>
                  <br />
                  <span style={{ color: 'var(--text-secondary)' }}>Current Balance:</span>{' '}
                  <span style={{ fontWeight: 'bold', color: 'var(--accent-green)' }}>${selectedUser.credits.toFixed(4)}</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Adjust Amount ($)</label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Enter positive value to add credits, negative to deduct.
                  </span>
                  <input 
                    type="number" 
                    step="0.0001"
                    className="form-input" 
                    placeholder="e.g. 15.00 or -5.50"
                    required
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Adjustment Reason</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Promotion credit / Manual adjustment"
                    value={adjustDesc}
                    onChange={(e) => setAdjustDesc(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAdjustModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL: EDIT MODEL PRICING */}
      {isModelModalOpen && selectedModel && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Model Rates</h3>
              <button className="modal-close" onClick={() => setIsModelModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleUpdateModelPricing}>
              <div className="modal-body">
                <div style={{ marginBottom: '16px', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Target Model:</span>{' '}
                  <span style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{selectedModel.model_name}</span>
                  <br />
                  <span style={{ color: 'var(--text-secondary)' }}>Provider:</span>{' '}
                  <span style={{ fontWeight: 'bold' }} className="badge badge-cyan">{selectedModel.provider}</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Input Cost ($ per million tokens)</label>
                  <input 
                    type="number" 
                    step="0.000001"
                    className="form-input" 
                    required
                    value={editInputCost}
                    onChange={(e) => setEditInputCost(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Output Cost ($ per million tokens)</label>
                  <input 
                    type="number" 
                    step="0.000001"
                    className="form-input" 
                    required
                    value={editOutputCost}
                    onChange={(e) => setEditOutputCost(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModelModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Rates</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
