import React from 'react';
import { motion } from 'framer-motion';

export default function Logo({ size = 'default', showText = true }) {
  const sizes = {
    small: { icon: 32, text: 'text-lg' },
    default: { icon: 48, text: 'text-2xl' },
    large: { icon: 72, text: 'text-4xl' }
  };

  const { icon, text } = sizes[size];

  return (
    <motion.div 
      className="flex items-center gap-3"
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {/* Custom SVG Logo - Ancient Book with Musical Notes */}
      <svg 
        width={icon} 
        height={icon} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
      >
        {/* Outer glow */}
        <defs>
          <radialGradient id="logoGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#D4A574" stopOpacity="0.4"/>
            <stop offset="100%" stopColor="#D4A574" stopOpacity="0"/>
          </radialGradient>
          <linearGradient id="bookGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5A2B"/>
            <stop offset="50%" stopColor="#D4A574"/>
            <stop offset="100%" stopColor="#8B5A2B"/>
          </linearGradient>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD700"/>
            <stop offset="50%" stopColor="#FFF8DC"/>
            <stop offset="100%" stopColor="#DAA520"/>
          </linearGradient>
          <linearGradient id="pageGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF8E7"/>
            <stop offset="100%" stopColor="#E8DCC8"/>
          </linearGradient>
        </defs>
        
        {/* Background glow circle */}
        <circle cx="50" cy="50" r="48" fill="url(#logoGlow)"/>
        
        {/* Open Book Base */}
        <path 
          d="M15 30 C15 25 20 20 50 20 C80 20 85 25 85 30 L85 75 C85 78 80 82 50 82 C20 82 15 78 15 75 Z" 
          fill="url(#bookGradient)"
          stroke="#5D3A1A"
          strokeWidth="1.5"
        />
        
        {/* Left Page */}
        <path 
          d="M18 32 C18 28 25 25 48 25 L48 78 C25 78 18 75 18 72 Z" 
          fill="url(#pageGradient)"
          stroke="#B8977A"
          strokeWidth="0.5"
        />
        
        {/* Right Page */}
        <path 
          d="M52 25 C75 25 82 28 82 32 L82 72 C82 75 75 78 52 78 Z" 
          fill="url(#pageGradient)"
          stroke="#B8977A"
          strokeWidth="0.5"
        />
        
        {/* Center spine */}
        <line x1="50" y1="22" x2="50" y2="80" stroke="#5D3A1A" strokeWidth="2"/>
        
        {/* Musical Note - Left */}
        <ellipse cx="30" cy="52" rx="5" ry="4" fill="url(#goldGradient)"/>
        <path d="M35 52 L35 35 C35 32 42 30 42 35" stroke="url(#goldGradient)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        
        {/* Musical Note - Right */}
        <ellipse cx="65" cy="55" rx="5" ry="4" fill="url(#goldGradient)"/>
        <ellipse cx="75" cy="52" rx="5" ry="4" fill="url(#goldGradient)"/>
        <path d="M70 55 L70 35 L80 32 L80 52" stroke="url(#goldGradient)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <path d="M70 35 L80 32" stroke="url(#goldGradient)" strokeWidth="2.5" strokeLinecap="round"/>
        
        {/* Cross accent in center */}
        <path d="M50 40 L50 50" stroke="url(#goldGradient)" strokeWidth="2" strokeLinecap="round"/>
        <path d="M46 44 L54 44" stroke="url(#goldGradient)" strokeWidth="2" strokeLinecap="round"/>
        
        {/* Decorative corner flourishes */}
        <path d="M20 30 Q22 28 25 30" stroke="url(#goldGradient)" strokeWidth="1" fill="none"/>
        <path d="M75 30 Q78 28 80 30" stroke="url(#goldGradient)" strokeWidth="1" fill="none"/>
      </svg>

      {showText && (
        <div className="flex flex-col">
          <span className={`${text} font-serif font-bold tracking-wide`} style={{ 
            background: 'linear-gradient(135deg, #8B5A2B 0%, #D4A574 50%, #8B5A2B 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 2px 4px rgba(139, 90, 43, 0.1)'
          }}>
            Bible Harmony
          </span>
          <span className="text-xs tracking-[0.3em] text-amber-700/70 font-light uppercase">
            by GoodGodMusics
          </span>
        </div>
      )}
    </motion.div>
  );
}