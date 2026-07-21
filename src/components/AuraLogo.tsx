import React from 'react';

interface AuraLogoProps {
  className?: string;
  size?: number;
  animate?: boolean;
}

export default function AuraLogo({ className = '', size = 180, animate = false }: AuraLogoProps) {
  const rotationClass = animate ? "animate-spin-slow" : "";
  const reverseRotationClass = animate ? "animate-spin-reverse-slow" : "";

  return (
    <div 
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
      id="aura-logo-container"
    >
      {/* Outer Halo Glow */}
      <div className="absolute inset-0 rounded-full bg-brand-gold/5 blur-xl pointer-events-none" />

      {/* Primary SVG Emblem */}
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-[0_0_15px_rgba(242,201,76,0.3)]"
        id="aura-logo-svg"
      >
        <defs>
          {/* Gold Gradients */}
          <linearGradient id="gold-grad-light" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF2AF" />
            <stop offset="30%" stopColor="#F2C94C" />
            <stop offset="70%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#8A640F" />
          </linearGradient>

          <linearGradient id="gold-grad-dark" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8A640F" />
            <stop offset="50%" stopColor="#4A3404" />
            <stop offset="100%" stopColor="#1A1201" />
          </linearGradient>

          <linearGradient id="gold-grad-border" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFF2AF" />
            <stop offset="25%" stopColor="#B38F1E" />
            <stop offset="50%" stopColor="#F2C94C" />
            <stop offset="75%" stopColor="#8A640F" />
            <stop offset="100%" stopColor="#FFF2AF" />
          </linearGradient>

          {/* Core Shield Blue Gradient */}
          <radialGradient id="shield-radial" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1A2233" />
            <stop offset="60%" stopColor="#0B0F19" />
            <stop offset="100%" stopColor="#05070B" />
          </radialGradient>

          {/* Text Paths */}
          <path
            id="aura-top-text-path"
            d="M 28 100 A 72 72 0 1 1 172 100"
            fill="none"
          />
          <path
            id="aura-bottom-text-path"
            d="M 172 100 A 72 72 0 1 1 28 100"
            fill="none"
          />
        </defs>

        {/* Outer Tech Ring with Notches */}
        <circle
          cx="100"
          cy="100"
          r="92"
          fill="none"
          stroke="url(#gold-grad-border)"
          strokeWidth="1.5"
          className={reverseRotationClass}
          strokeDasharray="4 8 20 8 4 12"
        />

        {/* Medium Tech Outer Border */}
        <circle
          cx="100"
          cy="100"
          r="86"
          fill="none"
          stroke="url(#gold-grad-light)"
          strokeWidth="2"
        />

        {/* Dark Textured Coin Rim */}
        <circle
          cx="100"
          cy="100"
          r="81"
          fill="url(#gold-grad-dark)"
          stroke="url(#gold-grad-border)"
          strokeWidth="1"
        />

        {/* Inner Gold Bevel Ring */}
        <circle
          cx="100"
          cy="100"
          r="66"
          fill="url(#shield-radial)"
          stroke="url(#gold-grad-border)"
          strokeWidth="3.5"
        />

        {/* Concentric Grid lines / Cybernetic Radar Background */}
        <g className={rotationClass} style={{ transformOrigin: '100px 100px' }}>
          {/* Globe Latitude Lines */}
          <path
            d="M 40 100 L 160 100 M 45 75 Q 100 90 155 75 M 45 125 Q 100 110 155 125"
            fill="none"
            stroke="#F2C94C"
            strokeWidth="0.4"
            strokeOpacity="0.25"
          />
          {/* Globe Longitude Lines */}
          <path
            d="M 100 40 Q 115 100 100 160 M 100 40 Q 85 100 100 160 M 100 40 L 100 160"
            fill="none"
            stroke="#F2C94C"
            strokeWidth="0.4"
            strokeOpacity="0.25"
          />
          {/* Outer Compass Tick marks */}
          <circle
            cx="100"
            cy="100"
            r="60"
            fill="none"
            stroke="#F2C94C"
            strokeWidth="1"
            strokeDasharray="2 6"
            strokeOpacity="0.4"
          />
        </g>

        {/* Infrastructure / Power Pylons Silhouette (Behind the main Chevron) */}
        <g opacity="0.4" stroke="url(#gold-grad-light)" strokeWidth="0.8" fill="none">
          {/* Left Pylon */}
          <path d="M 60 135 L 70 100 L 73 100 M 65 115 L 75 115 M 70 100 L 80 135 M 65 135 L 75 100" />
          {/* Right Pylon */}
          <path d="M 140 135 L 130 100 L 127 100 M 135 115 L 125 115 M 130 100 L 120 135 M 135 135 L 125 100" />
          {/* Background Hills/Uplink station */}
          <path d="M 45 138 Q 65 130 90 138 M 110 138 Q 135 131 155 138" strokeOpacity="0.5" />
          <line x1="100" y1="135" x2="100" y2="120" strokeWidth="1" />
          <circle cx="100" cy="120" r="1.5" fill="#F2C94C" />
        </g>

        {/* Central Logo Chevron: "A" Arrowhead */}
        <g drop-shadow="0 0 8px rgba(254,242,175,0.8)">
          {/* Left Wing of Chevron */}
          <polygon
            points="100,56 100,82 72,135 84,135"
            fill="url(#gold-grad-light)"
          />
          {/* Right Wing of Chevron */}
          <polygon
            points="100,56 100,82 128,135 116,135"
            fill="url(#gold-grad-light)"
            opacity="0.9"
          />
          {/* Inner Golden Arrowhead Spacer/shadow */}
          <polygon
            points="100,68 100,90 85,124 93,124"
            fill="#0B0F19"
            opacity="0.95"
          />
          <polygon
            points="100,68 100,90 115,124 107,124"
            fill="#05070B"
            opacity="0.95"
          />
          {/* Central Core Core Beam */}
          <polygon
            points="100,74 103,118 100,121 97,118"
            fill="url(#gold-grad-light)"
          />
          {/* Horizontal Golden Energy Bar (The Bar of the A) */}
          <polygon
            points="84,114 116,114 113,120 87,120"
            fill="url(#gold-grad-light)"
          />
          {/* Base Anchor Ship/Shield */}
          <path
            d="M 88 135 L 100 128 L 112 135 L 100 139 Z"
            fill="url(#gold-grad-light)"
          />
        </g>

        {/* Floating tech nodes / beacons */}
        <circle cx="100" cy="56" r="2" fill="#FFF" className="animate-pulse" />
        <circle cx="72" cy="135" r="1.5" fill="#F2C94C" />
        <circle cx="128" cy="135" r="1.5" fill="#F2C94C" />

        {/* Top Arc Text: AURA */}
        <text className="font-sans font-bold tracking-[0.2em] text-[12px] fill-url(#gold-grad-light)" id="aura-top-text">
          <textPath href="#aura-top-text-path" startOffset="50%" textAnchor="middle">
            AURA
          </textPath>
        </text>

        {/* Bottom Arc Text: ENERGY RESILIENCE */}
        <text className="font-sans font-medium tracking-[0.16em] text-[5.8px] fill-[#F2C94C] opacity-80" id="aura-bottom-text">
          <textPath href="#aura-bottom-text-path" startOffset="50%" textAnchor="middle">
            ENERGY RESILIENCE
          </textPath>
        </text>
      </svg>
    </div>
  );
}
