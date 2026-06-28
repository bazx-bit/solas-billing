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
  CheckCircle, 
  AlertCircle 
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
  
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustDesc, setAdjustDesc] = useState('');

  // Sandbox simulation state
  const [sandboxUser, setSandboxUser] = useState('');
  const [sandboxModel, setSandboxModel] = useState('gpt-4o');
  const [sandboxPrompt, setSandboxPrompt] = useState('Write a 3-sentence welcome email for Solas Billing.');
  const [sandboxLogs, setSandboxLogs] = useState('');
  const [sandboxStreaming, setSandboxStreaming] = useState(false);

  // Load dashboard data
  const loadData = async () => {
    try {
      // Try to load from active server
      const statsRes = await fetch(`${API_BASE}/stats`);
      const usersRes = await fetch(`${API_BASE}/users`);
      const modelsRes = await fetch(`${API_BASE}/models`);

      if (statsRes.ok && usersRes.ok && modelsRes.ok) {
        setStats(await statsRes.json());
        const u = await usersRes.json();
        setUsers(u);
        setModels(await modelsRes.json());
        if (u.length > 0 && !sandboxUser) {
          setSandboxUser(u[0].api_key);
        }
      }
    } catch (err) {
      console.warn('Server offline, using mock data for frontend demonstration.');
      setupMockData();
    }
  };

  const setupMockData = () => {
    // Generate mock data if local server is not started yet
    const mockUsers = [
      { id: '1', email: 'dev-team@startup.io', api_key: 'solas_5f8a9e2d1c3b4a56c7d8e9f', credits: 8.42, created_at: '2026-06-25 10:00:00' },
      { id: '2', email: 'customer-success@enterprise.com', api_key: 'solas_a1b2c3d4e5f6g7h8i9j0k1l', credits: 145.22, created_at: '2026-06-26 14:30:00' },
      { id: '3', email: 'freelancer-alpha@gmail.com', api_key: 'solas_z9y8x7w6v5u4t3s2r1q0p9o', credits: 0.12, created_at: '2026-06-28 09:15:00' }
    ];

    const mockModels = [
      { model_name: 'gpt-4o', provider: 'openai', input_cost_per_million: 5.0, output_cost_per_million: 15.0 },
      { model_name: 'gpt-4o-mini', provider: 'openai', input_cost_per_million: 0.15, output_cost_per_million: 0.60 },
      { model_name: 'claude-3-5-sonnet', provider: 'anthropic', input_cost_per_million: 3.0, output_cost_per_million: 15.0 },
      { model_name: 'claude-3-haiku', provider: 'anthropic', input_cost_per_million: 0.25, output_cost_per_million: 1.25 }
    ];

    const mockLogs = [
      { id: 'l1', user_id: '1', email: 'dev-team@startup.io', model: 'gpt-4o', provider: 'openai', input_tokens: 342, output_tokens: 512, cost: 0.00939, status: 200, timestamp: '2026-06-29 01:20:00' },
      { id: 'l2', user_id: '2', email: 'customer-success@enterprise.com', model: 'claude-3-5-sonnet', provider: 'anthropic', input_tokens: 1205, output_tokens: 450, cost: 0.01036, status: 200, timestamp: '2026-06-29 01:15:00' },
      { id: 'l3', user_id: '3', email: 'freelancer-alpha@gmail.com', model: 'gpt-4o', provider: 'openai', input_tokens: 89, output_tokens: 12, cost: 0.000625, status: 402, timestamp: '2026-06-29 01:10:00' }
    ];

    setUsers(mockUsers);
    setModels(mockModels);
    setSandboxUser(mockUsers[0].api_key);
    
    setStats({
      totalUsers: mockUsers.length,
      totalCredits: mockUsers.reduce((sum, u) => sum + u.credits, 0),
      totalRequests: 28,
      totalBilled: 12.84,
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
        body: JSON.stringify({ email: newUserEmail, credits: parseFloat(newUserCredits) })
      });
      if (res.ok) {
        setIsUserModalOpen(false);
        setNewUserEmail('');
        loadData();
      }
    } catch (err) {
      // Mock Action
      const newMockUser = {
        id: String(users.length + 1),
        email: newUserEmail,
        api_key: 'solas_' + Math.random().toString(36).substring(2, 15),
        credits: parseFloat(newUserCredits),
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
      }
    } catch (err) {
      // Mock Action
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
      await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      // Mock Action
      const updated = users.filter(u => u.id !== id);
      setUsers(updated);
      setStats(prev => ({ ...prev, totalUsers: updated.length }));
    }
  };

  // Simulate proxy interception in sandbox
  const handleSimulateCall = () => {
    const userObj = users.find(u => u.api_key === sandboxUser);
    if (!userObj) return;

    setSandboxStreaming(true);
    setSandboxLogs(`[Solas Proxy] Intercepting request on POST /v1/chat/completions\n`);

    setTimeout(() => {
      setSandboxLogs(prev => prev + `[Solas Proxy] Verifying API Key: "${sandboxUser.substring(0, 12)}..."\n`);
    }, 400);

    setTimeout(() => {
      setSandboxLogs(prev => prev + `[Solas Proxy] Found user: ${userObj.email} | Current Balance: $${userObj.credits.toFixed(5)}\n`);
    }, 800);

    setTimeout(() => {
      const tokensCount = Math.ceil(sandboxPrompt.length / 4) + 12;
      setSandboxLogs(prev => prev + `[Solas Proxy] Pre-evaluating estimated input tokens: ${tokensCount} tokens\n`);
    }, 1200);

    setTimeout(() => {
      if (userObj.credits <= 0) {
        setSandboxLogs(prev => prev + `\n❌ [Solas Error] HTTP 402: Insufficient credits! Request blocked.\n`);
        setSandboxStreaming(false);
        return;
      }

      setSandboxLogs(prev => prev + `[Solas Proxy] Forwarding call to real LLM backend...\n`);
    }, 1600);

    setTimeout(() => {
      if (userObj.credits <= 0) return;
      
      const mockCompletion = "Welcome to Solas Billing! This sandbox simulates how easily our proxy monitors token cost directly in the stream.";
      const inputTokens = Math.ceil(sandboxPrompt.length / 4) + 12;
      const outputTokens = Math.ceil(mockCompletion.length / 4);
      
      const price = models.find(m => m.model_name === sandboxModel) || { input_cost_per_million: 5, output_cost_per_million: 15 };
      const inputCost = (inputTokens / 1000000) * price.input_cost_per_million;
      const outputCost = (outputTokens / 1000000) * price.output_cost_per_million;
      const totalCost = inputCost + outputCost;

      setSandboxLogs(prev => prev + `[Solas Proxy] HTTP 200 OK | Response received.\n`);
      setSandboxLogs(prev => prev + `[Solas Proxy] Usage Details:\n`);
      setSandboxLogs(prev => prev + `  - Prompt Tokens: ${inputTokens} ($${inputCost.toFixed(6)})\n`);
      setSandboxLogs(prev => prev + `  - Completion Tokens: ${outputTokens} ($${outputCost.toFixed(6)})\n`);
      setSandboxLogs(prev => prev + `  - Billed Total Cost: $${totalCost.toFixed(6)}\n`);
      
      // Update local wallet state
      const nextCredits = Math.max(0, userObj.credits - totalCost);
      const updated = users.map(u => u.api_key === sandboxUser ? { ...u, credits: nextCredits } : u);
      setUsers(updated);
      
      setStats(prev => {
        const newLog = {
          id: 'l' + (prev.recentLogs.length + 1),
          user_id: userObj.id,
          email: userObj.email,
          model: sandboxModel,
          provider: 'openai',
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          cost: totalCost,
          status: 200,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };
        return {
          ...prev,
          totalRequests: prev.totalRequests + 1,
          totalBilled: prev.totalBilled + totalCost,
          totalCredits: prev.totalCredits - totalCost,
          recentLogs: [newLog, ...prev.recentLogs]
        };
      });

      setSandboxLogs(prev => prev + `[Solas Proxy] Successfully deducted credit. New balance: $${nextCredits.toFixed(5)}\n`);
      setSandboxStreaming(false);
    }, 2200);
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <div className="sidebar">
        <div className="brand-section">
          <div className="brand-logo">
            <Coins />
          </div>
          <span className="brand-name">Solas Billing</span>
        </div>

        <ul className="nav-links">
          <li 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard />
            Overview
          </li>
          <li 
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <UsersIcon />
            User Wallets
          </li>
          <li 
            className={`nav-item ${activeTab === 'models' ? 'active' : ''}`}
            onClick={() => setActiveTab('models')}
          >
            <Coins />
            Model Rates
          </li>
          <li 
            className={`nav-item ${activeTab === 'sandbox' ? 'active' : ''}`}
            onClick={() => setActiveTab('sandbox')}
          >
            <Code />
            Proxy Sandbox
          </li>
        </ul>

        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
          <button className="btn btn-secondary" style={{ width: '100%' }} onClick={loadData}>
            <RefreshCw size={16} /> Sync Server
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="main-content">
        <div className="header-bar">
          <div>
            <h1 className="page-title">
              {activeTab === 'dashboard' && 'Dashboard Overview'}
              {activeTab === 'users' && 'Manage User Wallets'}
              {activeTab === 'models' && 'Model Rates & Pricing'}
              {activeTab === 'sandbox' && 'Zero-SDK Proxy Sandbox'}
            </h1>
            <p className="page-subtitle">
              {activeTab === 'dashboard' && 'Monitor usage, active users, and token cost in real time.'}
              {activeTab === 'users' && 'Provision API keys, adjust credit balances, and view transaction trails.'}
              {activeTab === 'models' && 'Configure custom input/output costs per million tokens.'}
              {activeTab === 'sandbox' && 'Test proxy interception dynamically with mock requests.'}
            </p>
          </div>
          
          {activeTab === 'users' && (
            <button className="btn btn-primary" onClick={() => setIsUserModalOpen(true)}>
              <Plus size={16} /> Provision Wallet
            </button>
          )}
        </div>

        {/* ----------------------------------------------------
            TAB: OVERVIEW
        ---------------------------------------------------- */}
        {activeTab === 'dashboard' && (
          <>
            <div className="stats-grid">
              <div className="glass-panel stat-card">
                <div className="stat-header">
                  <span>Active Wallets</span>
                  <UsersIcon />
                </div>
                <div className="stat-value">{stats.totalUsers}</div>
                <div className="stat-footer">Provisioned API keys</div>
              </div>

              <div className="glass-panel stat-card">
                <div className="stat-header">
                  <span>Total Pool Credits</span>
                  <Coins />
                </div>
                <div className="stat-value">${stats.totalCredits.toFixed(2)}</div>
                <div className="stat-footer">Outstanding balance</div>
              </div>

              <div className="glass-panel stat-card">
                <div className="stat-header">
                  <span>API Requests</span>
                  <Terminal />
                </div>
                <div className="stat-value">{stats.totalRequests}</div>
                <div className="stat-footer">Through proxy</div>
              </div>

              <div className="glass-panel stat-card">
                <div className="stat-header">
                  <span>Gross Cost Billed</span>
                  <Coins />
                </div>
                <div className="stat-value">${stats.totalBilled.toFixed(4)}</div>
                <div className="stat-footer">Token value consumed</div>
              </div>
            </div>

            <div className="data-section">
              {/* Recent Proxy Traffic Log */}
              <div className="glass-panel table-card">
                <div className="card-title-section">
                  <h3 className="card-title">Live Proxy Stream</h3>
                  <span className="badge badge-success">Active</span>
                </div>

                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Model</th>
                      <th>Input</th>
                      <th>Output</th>
                      <th>Cost Billed</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentLogs.map((log) => (
                      <tr key={log.id}>
                        <td>{log.email}</td>
                        <td style={{ fontFamily: 'monospace' }}>{log.model}</td>
                        <td>{log.input_tokens}</td>
                        <td>{log.output_tokens}</td>
                        <td style={{ color: 'var(--accent-cyan)' }}>${log.cost.toFixed(5)}</td>
                        <td>
                          <span className={`badge ${log.status === 200 ? 'badge-success' : 'badge-error'}`}>
                            {log.status === 200 ? '200 OK' : `${log.status} Blocked`}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {stats.recentLogs.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No request logs recorded yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Developer Integration Guideline */}
              <div className="glass-panel table-card">
                <h3 className="card-title" style={{ marginBottom: '16px' }}>Zero-SDK Config</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px', lineHeight: '1.4' }}>
                  Forward your app completions to the proxy to enforce token gating.
                </p>
                <div className="code-container" style={{ fontSize: '0.8rem' }}>
                  <span className="comment">// NodeJS Client</span><br />
                  <span className="token">const</span> openai = <span className="token">new</span> OpenAI({'{'}<br />
                  &nbsp;&nbsp;apiKey: <span className="string">"USER_API_KEY"</span>,<br />
                  &nbsp;&nbsp;baseURL: <span className="string">"http://localhost:8080/v1"</span><br />
                  {'}'});
                </div>
              </div>
            </div>
          </>
        )}

        {/* ----------------------------------------------------
            TAB: USER WALLETS
        ---------------------------------------------------- */}
        {activeTab === 'users' && (
          <div className="glass-panel table-card">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>API Key / Token</th>
                  <th>Remaining Credits</th>
                  <th>Provisioned Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td style={{ fontWeight: '500' }}>{user.email}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Key size={12} /> {user.api_key.substring(0, 16)}...
                      </span>
                    </td>
                    <td style={{ 
                      fontWeight: 'bold', 
                      color: user.credits > 2 ? 'var(--accent-green)' : 'var(--accent-red)' 
                    }}>
                      ${user.credits.toFixed(4)}
                    </td>
                    <td>{user.created_at}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '0.75rem', marginRight: '8px' }}
                        onClick={() => {
                          setSelectedUser(user);
                          setIsAdjustModalOpen(true);
                        }}
                      >
                        Adjust Credits
                      </button>
                      <button 
                        className="btn btn-secondary"
                        style={{ padding: '6px 10px', color: 'var(--accent-red)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ----------------------------------------------------
            TAB: MODEL PRICING
        ---------------------------------------------------- */}
        {activeTab === 'models' && (
          <div className="glass-panel table-card">
            <h3 className="card-title" style={{ marginBottom: '16px' }}>Configured Rates (Per 1 Million Tokens)</h3>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Model ID</th>
                  <th>Provider</th>
                  <th>Input Cost</th>
                  <th>Output Cost</th>
                </tr>
              </thead>
              <tbody>
                {models.map((model) => (
                  <tr key={model.model_name}>
                    <td style={{ fontFamily: 'monospace', fontWeight: '500' }}>{model.model_name}</td>
                    <td style={{ textTransform: 'capitalize' }}>{model.provider}</td>
                    <td>${model.input_cost_per_million.toFixed(2)}</td>
                    <td>${model.output_cost_per_million.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ----------------------------------------------------
            TAB: PROXY SANDBOX
        ---------------------------------------------------- */}
        {activeTab === 'sandbox' && (
          <div className="playground-section">
            <div className="glass-panel table-card">
              <h3 className="card-title" style={{ marginBottom: '16px' }}>Request Parameters</h3>
              
              <div className="form-group">
                <label className="form-label">Client API Key Wallet</label>
                <select 
                  className="form-input"
                  value={sandboxUser}
                  onChange={(e) => setSandboxUser(e.target.value)}
                >
                  {users.map(u => (
                    <option key={u.id} value={u.api_key}>{u.email} (${u.credits.toFixed(4)} left)</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Model Target</label>
                <select
                  className="form-input"
                  value={sandboxModel}
                  onChange={(e) => setSandboxModel(e.target.value)}
                >
                  {models.map(m => (
                    <option key={m.model_name} value={m.model_name}>{m.model_name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">System / User Messages</label>
                <textarea 
                  className="form-input" 
                  rows="4"
                  value={sandboxPrompt}
                  onChange={(e) => setSandboxPrompt(e.target.value)}
                ></textarea>
              </div>

              <button 
                className="btn btn-primary" 
                style={{ width: '100%' }}
                disabled={sandboxStreaming}
                onClick={handleSimulateCall}
              >
                {sandboxStreaming ? 'Simulating Intercept...' : 'Simulate Proxy Request'}
              </button>
            </div>

            <div className="glass-panel table-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 className="card-title" style={{ marginBottom: '16px' }}>Live Proxy Interception Terminal</h3>
              <div className="console-output" style={{ flex: 1 }}>
                {sandboxLogs || 'Terminal idle. Click "Simulate Proxy Request" to watch proxy log.'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------
          MODAL: PROVISION USER WALLET
      ---------------------------------------------------- */}
      {isUserModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <div className="modal-header">
              <h3>Provision Credit Wallet</h3>
              <button className="modal-close-btn" onClick={() => setIsUserModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label className="form-label">User Email</label>
                <input 
                  type="email" 
                  className="form-input" 
                  required
                  placeholder="e.g. dev@client.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Start Credits ($ USD)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="form-input"
                  value={newUserCredits}
                  onChange={(e) => setNewUserCredits(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                Provision Wallet
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          MODAL: ADJUST BALANCE
      ---------------------------------------------------- */}
      {isAdjustModalOpen && selectedUser && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <div className="modal-header">
              <h3>Adjust Balance</h3>
              <button className="modal-close-btn" onClick={() => setIsAdjustModalOpen(false)}>✕</button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
              Adjusting wallet balance for <strong>{selectedUser.email}</strong>. Use negative values to deduct.
            </p>
            <form onSubmit={handleAdjustCredits}>
              <div className="form-group">
                <label className="form-label">Adjustment Amount ($)</label>
                <input 
                  type="number" 
                  step="0.0001"
                  className="form-input" 
                  required
                  placeholder="e.g. 20.00 or -5.50"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Reason / Transaction label</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Customer top-up"
                  value={adjustDesc}
                  onChange={(e) => setAdjustDesc(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                Apply Adjustment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
