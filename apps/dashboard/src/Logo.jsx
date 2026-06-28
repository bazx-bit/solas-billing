import React from 'react';

export default function Logo({ size = 32, className = '' }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 80 80" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Deep tech gradients */}
        <linearGradient id="solas-brand-primary" x1="10" y1="10" x2="70" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a855f7" /> {/* Vibrant Purple */}
          <stop offset="50%" stopColor="#6366f1" /> {/* Indigo */}
          <stop offset="100%" stopColor="#06b6d4" /> {/* Cyan */}
        </linearGradient>

        <linearGradient id="solas-brand-secondary" x1="70" y1="10" x2="10" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f43f5e" /> {/* Rose */}
          <stop offset="100%" stopColor="#8b5cf6" /> {/* Violet */}
        </linearGradient>

        <linearGradient id="solas-brand-dark" x1="40" y1="10" x2="40" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0.9" />
        </linearGradient>

        <filter id="premium-shadow" x="-20%" y="-20%" width="150%" height="150%">
          <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#6366f1" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Outer base container ring */}
      <circle 
        cx="40" 
        cy="40" 
        r="36" 
        fill="url(#solas-brand-dark)" 
        stroke="url(#solas-brand-primary)" 
        strokeWidth="1.5"
        strokeOpacity="0.4"
      />

      {/* Geometric Ribbon 1 (Left Swoosh / Flow routing blade) */}
      <path
        d="M20 54C20 42.9543 28.9543 34 40 34C51.0457 34 60 42.9543 60 54H48C48 49.5817 44.4183 46 40 46C35.5817 46 32 49.5817 32 54H20Z"
        fill="url(#solas-brand-primary)"
        filter="url(#premium-shadow)"
      />

      {/* Geometric Ribbon 2 (Right Swoosh / Fallback loop blade) */}
      <path
        d="M60 26C60 37.0457 51.0457 46 40 46C28.9543 46 20 37.0457 20 26H32C32 30.4183 35.5817 34 40 34C44.4183 34 48 30.4183 48 26H60Z"
        fill="url(#solas-brand-secondary)"
        style={{ mixBlendMode: 'screen' }}
      />

      {/* Central Diamond core (representing Gated Token gateway) */}
      <path
        d="M40 22L48 34L40 46L32 34L40 22Z"
        fill="#ffffff"
        style={{ filter: 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.8))' }}
      />
    </svg>
  );
}
