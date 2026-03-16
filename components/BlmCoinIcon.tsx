
import React from 'react';

export const BlmCoinIcon: React.FC<{ className?: string; size?: number | string; fill?: string }> = ({ className, size = 24, fill = "none" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <text 
      x="12" 
      y="12" 
      fontSize="9" 
      fontWeight="900" 
      textAnchor="middle" 
      dominantBaseline="central"
      stroke="none" 
      fill="currentColor"
      style={{ fontFamily: 'serif' }}
    >
      Blm
    </text>
  </svg>
);
