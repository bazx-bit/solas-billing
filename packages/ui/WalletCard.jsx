import React from 'react';

/**
 * Shared UI component for displaying user wallet credits
 */
export default function WalletCard({ email, credits, rateLimit, fallbackEnabled, onAdjustClick }) {
  return (
    <div className="glass-panel stat-card" style={{ padding: '20px' }}>
      <div className="stat-header" style={{ marginBottom: '8px' }}>
        <span style={{ fontWeight: '600' }}>{email}</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{rateLimit} RPM</span>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginTop: '12px' }}>
        <div>
          <div className="stat-value" style={{ fontSize: '1.5rem', color: credits > 2 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
            ${credits.toFixed(4)}
          </div>
          <div className="stat-footer">
            Fallback: {fallbackEnabled ? 'Auto-recovery' : 'Blocked'}
          </div>
        </div>
        
        <button 
          className="btn btn-secondary" 
          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          onClick={onAdjustClick}
        >
          Adjust
        </button>
      </div>
    </div>
  );
}
