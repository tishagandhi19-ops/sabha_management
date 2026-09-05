import React from 'react';
import { Search, TrendingUp } from 'lucide-react';
import { CircularProgress, SkeletonText } from '../Loaders';
import { CATEGORY_LABELS, CATEGORY_TAGS } from '../../constants/sabhaConstants';
import { sortMembersBySearchRank } from '../../utils/searchRank';

export default function MemberProfileReport({
  members,
  reportSearch,
  setReportSearch,
  selectedMemberReport,
  loadingMemberReport,
  onSelectMember
}) {
  return (
    <div className="reports-main-grid">
      {/* Search list of members */}
      <div className="glass-panel" id="sabha-member-report-search" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>સભ્ય પ્રોગ્રેસ રીપોર્ટ</h3>
        <div className="search-field">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            className="glass-input"
            style={{ fontSize: '0.9rem' }}
            placeholder="સભ્ય શોધો..."
            value={reportSearch}
            onChange={(e) => setReportSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '350px', overflowY: 'auto', paddingRight: 4 }}>
          {sortMembersBySearchRank(
            members.filter(m => {
              if (!reportSearch.trim()) return true;
              const q = reportSearch.toLowerCase();
              return (
                m.name.toLowerCase().includes(q) ||
                (m.nameEn && m.nameEn.toLowerCase().includes(q)) ||
                (m.uniqueCode && m.uniqueCode.toLowerCase().includes(q))
              );
            }),
            reportSearch
          ).map(member => {
            const isSelected = selectedMemberReport && selectedMemberReport.member._id === member._id;
            return (
              <div
                key={member._id}
                onClick={() => {
                  onSelectMember(member._id);
                  if (window.innerWidth < 768) {
                    setTimeout(() => {
                      document.getElementById('sabha-member-report-detail')?.scrollIntoView({ behavior: 'smooth' });
                    }, 150);
                  }
                }}
                className="glass-card"
                style={{
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255,255,255,0.01)',
                  borderLeft: isSelected ? '4px solid var(--color-primary)' : '1px solid var(--glass-border)',
                  padding: 10
                }}
              >
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                  {member.name}
                  {member.nameEn && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginLeft: 6, fontWeight: 400 }}>
                      ({member.nameEn})
                    </span>
                  )}
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                  કોડ: {member.uniqueCode} | {CATEGORY_TAGS[member.type]}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed profile visualization */}
      <div className="glass-panel" id="sabha-member-report-detail" style={{ padding: 24 }}>
        {loadingMemberReport ? (
          <SkeletonText rows={6} />
        ) : selectedMemberReport ? (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <button
              className="btn-secondary btn-sm mobile-only"
              style={{ alignSelf: 'flex-start' }}
              onClick={() => document.getElementById('sabha-member-report-search')?.scrollIntoView({ behavior: 'smooth' })}
            >
              ← સભ્ય યાદી જુઓ
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: 16, flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
              <div style={{ minWidth: 200 }}>
                <span className="badge badge-primary">
                  {CATEGORY_LABELS[selectedMemberReport.member.type]}
                </span>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 6, letterSpacing: '-0.01em', wordBreak: 'break-word' }}>
                  {selectedMemberReport.member.name}
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: 2, fontFamily: 'monospace' }}>
                  યુનિક આઈડી કોડ: {selectedMemberReport.member.uniqueCode}
                </p>
              </div>

              <CircularProgress value={selectedMemberReport.stats.attendanceRate} size={90} label="હાજરી દર" />
            </div>

            {/* Summary Grid stats */}
            <div className="stats-cards-grid" style={{ textAlign: 'center', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
              <div className="glass-card">
                <h5 style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>હાજર સભા / કુલ સભા</h5>
                <p style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: 4, color: 'var(--color-success)' }}>
                  {selectedMemberReport.stats.present} / {selectedMemberReport.stats.totalCreatedEvents || selectedMemberReport.stats.totalEvents}
                </p>
              </div>
              <div className="glass-card">
                <h5 style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>મોડા આવ્યા (Late)</h5>
                <p style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: 4, color: 'var(--color-warning)' }}>
                  {selectedMemberReport.stats.late}
                </p>
              </div>
              <div className="glass-card">
                <h5 style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>સરેરાશ સમય (Avg Time)</h5>
                <p style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: 4, color: 'var(--color-primary)' }}>
                  {selectedMemberReport.stats.avgTime || '-'}
                </p>
              </div>
              <div className="glass-card">
                <h5 style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>કુલ પોઇન્ટ્સ</h5>
                <p style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: 4, color: '#6366f1' }}>
                  {selectedMemberReport.stats.totalPoints || 0}
                </p>
              </div>
              <div className="glass-card">
                <h5 style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>ગેરહાજર સભા</h5>
                <p style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: 4, color: 'var(--color-danger)' }}>
                  {selectedMemberReport.stats.absent}
                </p>
              </div>
            </div>

            {/* Attendance Calendar Heatmap Grid */}
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12, color: 'var(--color-text-secondary)' }}>હાજરી કેલેન્ડર ફ્લો</h3>
              {selectedMemberReport.history.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>આ સભ્યની કોઈ સભાની હાજરી નોંધાયેલી નથી.</p>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                    {selectedMemberReport.history.map((log) => {
                      const dateStr = new Date(log.date).toLocaleDateString('gu-IN', { day: 'numeric', month: 'short' });
                      let color = 'var(--color-danger)';
                      let title = `${dateStr}: ગેરહાજર`;

                      if (log.status === 'present') {
                        if (log.isLate) {
                          color = 'var(--color-warning)';
                          title = `${dateStr}: હાજર (મોડા પડ્યા - ${log.remark || 'અન્ય'})`;
                        } else {
                          color = 'var(--color-success)';
                          title = `${dateStr}: હાજર`;
                        }
                      }

                      return (
                        <div
                          key={log._id}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            background: color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            color: '#fff',
                            cursor: 'pointer'
                          }}
                          title={title}
                        >
                          ર
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--color-success)' }} /> હાજર
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--color-warning)' }} /> મોડા પડ્યા
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--color-danger)' }} /> ગેરહાજર
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Late Arrival Remarks Log */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)', margin: 0 }}>
                  મોડા આવવાના રીમાર્કસ / કારણો {selectedMemberReport.remarks?.length > 0 ? `(${selectedMemberReport.remarks.length})` : ''}
                </h3>
              </div>
              {(!selectedMemberReport.remarks || selectedMemberReport.remarks.length === 0) ? (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>આ સભ્ય સભામાં ક્યારેય મોડા પડ્યા નથી.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '220px', overflowY: 'auto' }}>
                  {selectedMemberReport.remarks.map((rem, idx) => {
                    const isOther = rem.remark === 'અન્ય';
                    return (
                      <div key={idx} className="glass-card" style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                            {new Date(rem.date).toLocaleDateString('gu-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                          {rem.arrivalTime && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4 }}>
                              {new Date(rem.arrivalTime).toLocaleTimeString('gu-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <span style={{
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          padding: '3px 10px',
                          borderRadius: 12,
                          background: isOther ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                          color: isOther ? 'var(--color-danger)' : 'var(--color-warning)',
                          border: isOther ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(245, 158, 11, 0.25)',
                          wordBreak: 'break-word'
                        }}>
                          {rem.remark}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <TrendingUp size={28} />
            </div>
            <p className="empty-state-title">કોઈ સભ્ય પસંદ કરેલ નથી</p>
            <p className="empty-state-desc" style={{ marginBottom: 0 }}>ડાબી બાજુની યાદીમાંથી સભ્ય પસંદ કરવાથી તેમનો પ્રોગ્રેસ રિપોર્ટ અહીં દેખાશે.</p>
          </div>
        )}
      </div>
    </div>
  );
}
