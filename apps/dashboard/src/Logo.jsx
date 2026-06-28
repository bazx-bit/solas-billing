import React from 'react';

export default function Logo({ size = 32, className = '' }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ filter: 'drop-shadow(0 4px 12px rgba(139, 92, 246, 0.4))' }}
    >
      <defs>
        {/* Core Gradients */}
        <linearGradient id="hex-grad" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8b5cf6" /> {/* Purple */}
          <stop offset="50%" stopColor="#d946ef" /> {/* Magenta */}
          <stop offset="100%" stopColor="#06b6d4" /> {/* Cyan */}
        </linearGradient>

        <linearGradient id="coin-grad" x1="20" y1="20" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f59e0b" /> {/* Gold */}
          <stop offset="100%" stopColor="#ec4899" /> {/* Pinkish orange */}
        </linearGradient>

        <linearGradient id="arrow-grad" x1="16" y1="16" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10b981" /> {/* Green */}
          <stop offset="100%" stopColor="#06b6d4" /> {/* Cyan */}
        </linearGradient>

        {/* Glow filter */}
        <filter id="glow-heavy" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* 1. Outer Gateway: Hexagonal Shield (Gated Security & Proxy) */}
      <polygon 
        points="32,4 56,18 56,46 32,60 8,46 8,18" 
        stroke="url(#hex-grad)" 
        strokeWidth="3" 
        strokeLinejoin="round"
        fill="rgba(17, 17, 24, 0.6)"
      />

      {/* 2. Provider Nodes (Small colored dots representing OpenAI, Anthropic, Gemini connected to proxy) */}
      {/* OpenAI Node (Top Right) */}
      <circle cx="56" cy="18" r="4.5" fill="#a855f7" />
      <circle cx="56" cy="18" r="7" stroke="#a855f7" strokeWidth="1" strokeOpacity="0.4" />
      <line x1="32" y1="32" x2="56" y2="18" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />

      {/* Anthropic Node (Left) */}
      <circle cx="8" cy="18" r="4.5" fill="#f97316" />
      <circle cx="8" cy="18" r="7" stroke="#f97316" strokeWidth="1" strokeOpacity="0.4" />
      <line x1="32" y1="32" x2="8" y2="18" stroke="#f97316" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />

      {/* Gemini Node (Bottom) */}
      <circle cx="32" cy="60" r="4.5" fill="#06b6d4" />
      <circle cx="32" cy="60" r="7" stroke="#06b6d4" strokeWidth="1" strokeOpacity="0.4" />
      <line x1="32" y1="32" x2="32" y2="60" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />

      {/* 3. Self-Healing Fallback: Interlocking Routing Loop Arrows */}
      {/* Outer Routing Circle Path */}
      <path 
        d="M 45 32 A 13 13 0 0 1 19 32" 
        stroke="url(#arrow-grad)" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
      />
      <path 
        d="M 19 32 A 13 13 0 0 1 45 32" 
        stroke="url(#hex-grad)" 
        strokeWidth="2.5" 
        strokeLinecap="round"
      />
      
      {/* Arrow Head 1 (Clockwise swap indicator) */}
      <path d="M 48 30 L 45 35 L 42 30" fill="url(#arrow-grad)" stroke="url(#arrow-grad)" strokeWidth="1" strokeLinejoin="round" />
      
      {/* Arrow Head 2 (Clockwise swap indicator) */}
      <path d="M 16 34 L 19 29 L 22 34" fill="url(#hex-grad)" stroke="url(#hex-grad)" strokeWidth="1" strokeLinejoin="round" />

      {/* 4. Token Ledger: Central Gilded Credit Coin */}
      <circle 
        cx="32" 
        cy="32" 
        r="9.5" 
        fill="url(#coin-grad)" 
        stroke="#ffffff"
        strokeWidth="1.5"
        filter="url(#glow-heavy)"
      />
      
      {/* Dollar Sign on Coin */}
      <path 
        d="M32 26V38 M30 28.5H33.5C35 28.5 35 31 33.5 32H30.5C29 32 29 34.5 30.5 35.5H34" 
        stroke="#ffffff" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
}
