import React from 'react';

export default function Logo({ size = 32, className = '' }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ filter: 'drop-shadow(0 2px 8px rgba(139, 92, 246, 0.35))' }}
    >
      <defs>
        {/* Glowing Gradient Definitions */}
        <linearGradient id="solas-grad-1" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="50%" stopColor="#d946ef" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="solas-grad-2" x1="44" y1="4" x2="4" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Background soft glow ring */}
      <circle 
        cx="24" 
        cy="24" 
        r="20" 
        stroke="url(#solas-grad-1)" 
        strokeWidth="1.5" 
        strokeOpacity="0.15" 
      />

      {/* Main geometric 'S' Ribbon 1 (Top Left to Bottom Right loop) */}
      <path
        d="M12 18C12 12.4772 16.4772 8 22 8H26C31.5228 8 36 12.4772 36 18C36 21.5 34 24.5 31 26L17 33C14 34.5 12 37.5 12 41"
        stroke="url(#solas-grad-1)"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Intersecting geometric 'S' Ribbon 2 (Bottom Right to Top Left loop) */}
      <path
        d="M36 30C36 35.5228 31.5228 40 26 40H22C16.4772 40 12 35.5228 12 30C12 26.5 14 23.5 17 22L31 15C34 13.5 36 10.5 36 7"
        stroke="url(#solas-grad-2)"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ mixBlendMode: 'screen' }}
      />

      {/* Center glowing core connection node */}
      <circle 
        cx="24" 
        cy="24" 
        r="4.5" 
        fill="#ffffff" 
        style={{ filter: 'drop-shadow(0 0 4px #8b5cf6)' }}
      />
    </svg>
  );
}
