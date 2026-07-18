import React from 'react';

// 1. Spinner Loader (Apple iOS style)
export const SpinnerLoader = ({ size = 24 }) => {
  return (
    <span className="ios-spinner" style={{ width: size, height: size }}>
      {[...Array(12)].map((_, i) => (
        <div key={i} />
      ))}
    </span>
  );
};

// 2. Linear Progress Indicator
export const LinearProgress = () => {
  return (
    <div className="linear-progress">
      <div className="linear-progress-bar" />
    </div>
  );
};

// 3. Determinate Loader
export const DeterminateProgress = ({ value = 0 }) => {
  const percent = Math.min(Math.max(value, 0), 100);
  return (
    <div className="determinate-progress">
      <div 
        className="determinate-progress-bar" 
        style={{ width: `${percent}%` }}
      />
    </div>
  );
};

// 4. Circular Progress Indicator (SVG based)
export const CircularProgress = ({ value = 0, size = 120, strokeWidth = 8, label = "" }) => {
  const percent = Math.round(Math.min(Math.max(value, 0), 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="circular-progress-container" style={{ width: size, height: size }}>
      <svg className="circular-progress-svg" width={size} height={size}>
        <defs>
          <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <circle
          className="circular-progress-bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className="circular-progress-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <div className="circular-progress-text">
        <span style={{ fontSize: `${size * 0.18}px` }}>{percent}%</span>
        {label && <span style={{ fontSize: `${size * 0.08}px`, color: 'var(--color-text-secondary)', marginTop: 4 }}>{label}</span>}
      </div>
    </div>
  );
};

// 5. Skeleton Loader Blocks
export const SkeletonText = ({ rows = 3 }) => {
  return (
    <div style={{ width: '100%' }}>
      <div className="skeleton skeleton-title" />
      {[...Array(rows)].map((_, idx) => (
        <div key={idx} className="skeleton skeleton-text" style={{ width: idx === rows - 1 ? '75%' : '100%' }} />
      ))}
    </div>
  );
};

export const SkeletonCard = () => {
  return (
    <div className="glass-card" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <div className="skeleton skeleton-avatar" />
      <div style={{ flex: 1 }}>
        <div className="skeleton" style={{ height: 18, width: '40%', marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 12, width: '60%' }} />
      </div>
    </div>
  );
};

// 6. Shimmer Loading Card Container wrapper
export const ShimmerOverlay = ({ children, isLoading }) => {
  if (!isLoading) return children;
  return (
    <div className="shimmer-overlay" style={{ borderRadius: 'inherit' }}>
      {children}
    </div>
  );
};
