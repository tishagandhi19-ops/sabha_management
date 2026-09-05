import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { CircularProgress, SkeletonCard } from '../Loaders';

export default function DashboardReports({ dashboardStats }) {
  if (!dashboardStats) {
    return (
      <div className="grid-3">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
      <div className="glass-panel" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
        <CircularProgress value={dashboardStats.overallAttendanceRate} size={80} label="કુલ હાજરી" />
        <div>
          <h4 style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>કુલ નોંધાયેલ સભ્યો</h4>
          <p style={{ fontSize: '2rem', fontWeight: 800, marginTop: 4 }}>{dashboardStats.totalMembers}</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
        <CircularProgress value={dashboardStats.raviSabhaRate} size={80} label="રવિસભા" />
        <div>
          <h4 style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>રવિસભા રેટ</h4>
          <p style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: 4, color: 'var(--color-primary)' }}>
            હાજર: {Math.round(dashboardStats.raviSabhaRate)}%
          </p>
          {dashboardStats.raviSabhaLateRate > 0 && (
            <p style={{ fontSize: '0.8rem', color: 'var(--color-warning)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <AlertTriangle size={12} /> મોડા આવનાર: {dashboardStats.raviSabhaLateRate}%
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
