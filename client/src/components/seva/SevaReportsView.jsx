import React from 'react';
import { Search, Heart, Users, TrendingUp } from 'lucide-react';
import { CircularProgress, SkeletonText } from '../Loaders';
import { SEVA_CATEGORY_LABELS, SEVA_CATEGORY_TAGS } from '../../constants/sabhaConstants';
import { sortMembersBySearchRank } from '../../utils/searchRank';

export default function SevaReportsView({
  sevas,
  sevaTypes,
  sevaMembers,
  sevaReportsData,
  sevaReportsSubTab,
  setSevaReportsSubTab,
  sevaMemberReportSearch,
  setSevaMemberReportSearch,
  selectedSevaMemberReport,
  loadingSevaMemberReport,
  onSelectSevaMemberReport,
  sevaTypeLeaderboardData,
  loadingSevaTypeLeaderboard,
  onPrintSevaLeaderboard,
  selectedParticularSevaId,
  setSelectedParticularSevaId,
  loadingParticularSeva,
  particularSevaReport,
  onPrintParticularSeva,
  fetchSevaReports
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Seva stats cards */}
      <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <div className="glass-panel" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
          <CircularProgress
            value={sevaMembers.length > 0 ? (sevaReportsData.filter(row => row.sevaCount > 0).length / sevaMembers.length) * 100 : 0}
            size={80}
            label="હાજરી દર"
          />
          <div>
            <h4 style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>કુલ કલાકો લોગ થયા</h4>
            <p style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: 4 }}>
              {sevaReportsData.reduce((acc, row) => acc + (row.totalHours || 0), 0)} કલાક
            </p>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: 16, borderRadius: '50%', display: 'inline-flex' }}>
            <Heart size={28} color="var(--color-primary)" />
          </div>
          <div>
            <h4 style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>કુલ આયોજિત સેવાઓ</h4>
            <p style={{ fontSize: '2rem', fontWeight: 800, marginTop: 4 }}>{sevas.length}</p>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: 16, borderRadius: '50%', display: 'inline-flex' }}>
            <Users size={28} color="var(--color-success)" />
          </div>
          <div>
            <h4 style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>સેવાના પ્રકારો</h4>
            <p style={{ fontSize: '2rem', fontWeight: 800, marginTop: 4 }}>{sevaTypes.length}</p>
          </div>
        </div>
      </div>

      {/* Sub Navigation for Seva Reports */}
      <div className="segmented-control" style={{ justifySelf: 'stretch' }}>
        <button
          className={`segmented-button ${sevaReportsSubTab === 'profile' ? 'active' : ''}`}
          onClick={() => setSevaReportsSubTab('profile')}
        >
          સભ્યો પ્રોગ્રેસ
        </button>
        <button
          className={`segmented-button ${sevaReportsSubTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => {
            setSevaReportsSubTab('leaderboard');
            fetchSevaReports();
          }}
        >
          શ્રેષ્ઠ સેવકો (ટોપ ૧૦)
        </button>
        <button
          className={`segmented-button ${sevaReportsSubTab === 'particular' ? 'active' : ''}`}
          onClick={() => setSevaReportsSubTab('particular')}
        >
          સેવા વાર વિગત
        </button>
      </div>

      {/* Seva Sub Tab 1: Member Seva Progress */}
      {sevaReportsSubTab === 'profile' && (
        <div className="reports-main-grid">
          {/* Left list of members */}
          <div className="glass-panel" id="seva-member-report-search" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>સભ્ય સેવા અહેવાલ</h3>
            <div className="search-field">
              <Search className="search-icon" size={16} />
              <input
                type="text"
                className="glass-input"
                style={{ fontSize: '0.9rem' }}
                placeholder="સભ્ય શોધો..."
                value={sevaMemberReportSearch}
                onChange={(e) => setSevaMemberReportSearch(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '350px', overflowY: 'auto', paddingRight: 4 }}>
              {sortMembersBySearchRank(
                sevaMembers.filter(m => {
                  if (!sevaMemberReportSearch.trim()) return true;
                  const q = sevaMemberReportSearch.toLowerCase();
                  return (
                    m.name.toLowerCase().includes(q) ||
                    (m.nameEn && m.nameEn.toLowerCase().includes(q)) ||
                    (m.uniqueCode && m.uniqueCode.toLowerCase().includes(q))
                  );
                }),
                sevaMemberReportSearch
              ).map(member => {
                const isSelected = selectedSevaMemberReport && selectedSevaMemberReport.member._id === member._id;
                return (
                  <div
                    key={member._id}
                    onClick={() => {
                      onSelectSevaMemberReport(member._id);
                      if (window.innerWidth < 768) {
                        setTimeout(() => {
                          document.getElementById('seva-member-report-detail')?.scrollIntoView({ behavior: 'smooth' });
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
                      કોડ: {member.uniqueCode} | {SEVA_CATEGORY_TAGS[member.type]}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right member progress display */}
          <div className="glass-panel" id="seva-member-report-detail" style={{ padding: 24 }}>
            {loadingSevaMemberReport ? (
              <SkeletonText rows={6} />
            ) : selectedSevaMemberReport ? (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <button
                  className="btn-secondary btn-sm mobile-only"
                  style={{ alignSelf: 'flex-start' }}
                  onClick={() => document.getElementById('seva-member-report-search')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  ← સભ્ય યાદી જુઓ
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: 16, flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
                  <div style={{ minWidth: 200 }}>
                    <span className="badge badge-primary">
                      {SEVA_CATEGORY_LABELS[selectedSevaMemberReport.member.type]}
                    </span>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 6, letterSpacing: '-0.01em', wordBreak: 'break-word' }}>
                      {selectedSevaMemberReport.member.name}
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: 2, fontFamily: 'monospace' }}>
                      યુનિક આઈડી કોડ: {selectedSevaMemberReport.member.uniqueCode}
                    </p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>કુલ સેવા કલાકો</p>
                    <p style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-success)', marginTop: 2 }}>
                      {selectedSevaMemberReport.stats.totalHours}
                    </p>
                  </div>
                </div>

                {/* Summary Grid stats */}
                <div className="stats-cards-grid" style={{ textAlign: 'center' }}>
                  <div className="glass-card">
                    <h5 style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>હાજર સેવાઓ</h5>
                    <p style={{ fontSize: '1.3rem', fontWeight: 700, marginTop: 4, color: 'var(--color-success)' }}>
                      {selectedSevaMemberReport.stats.present} / {selectedSevaMemberReport.stats.totalSevas}
                    </p>
                  </div>
                  <div className="glass-card">
                    <h5 style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>ગેરહાજર સભાઓ</h5>
                    <p style={{ fontSize: '1.3rem', fontWeight: 700, marginTop: 4, color: 'var(--color-danger)' }}>
                      {selectedSevaMemberReport.stats.absent}
                    </p>
                  </div>
                  <div className="glass-card">
                    <h5 style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>કુલ કલાક</h5>
                    <p style={{ fontSize: '1.3rem', fontWeight: 700, marginTop: 4, color: 'var(--color-info)' }}>
                      {selectedSevaMemberReport.stats.totalHours}
                    </p>
                  </div>
                </div>

                {/* History Log */}
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12, color: 'var(--color-text-secondary)' }}>સેવા કેલેન્ડર ઇતિહાસ</h3>
                  {selectedSevaMemberReport.history.length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>આ સભ્યનો કોઈ સેવાનો ઇતિહાસ નોંધાયેલ નથી.</p>
                  ) : (
                    <div className="table-wrap" style={{ maxHeight: '260px', overflowY: 'auto', width: '100%', maxWidth: '100%' }}>
                      <table style={{ width: '100%', minWidth: '440px' }}>
                        <thead>
                          <tr>
                            <th>તારીખ</th>
                            <th>સેવા પ્રકાર</th>
                            <th style={{ textAlign: 'center' }}>સ્થિતિ</th>
                            <th style={{ textAlign: 'right' }}>લોગ કરેલ કલાક</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedSevaMemberReport.history.map((log, idx) => (
                            <tr key={idx}>
                              <td>{new Date(log.date).toLocaleDateString('gu-IN')}</td>
                              <td style={{ fontWeight: 600 }}>{log.sevaType}</td>
                              <td style={{ textAlign: 'center' }}>
                                <span className={`badge ${log.status === 'present' ? 'badge-success' : 'badge-danger'}`}>
                                  {log.status === 'present' ? 'હાજર' : 'ગેરહાજર'}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 700 }}>
                                {log.status === 'present' ? `${log.hours} કલાક` : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
                <p className="empty-state-desc" style={{ marginBottom: 0 }}>ડાબી બાજુની યાદીમાંથી સભ્ય પસંદ કરવાથી તેમનો સેવા અહેવાલ અહીં દેખાશે.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Seva Sub Tab 2: Leaderboard */}
      {sevaReportsSubTab === 'leaderboard' && (() => {
        const grouped = {};
        sevaTypeLeaderboardData.forEach(row => {
          if (!grouped[row.sevaTypeName]) {
            grouped[row.sevaTypeName] = [];
          }
          grouped[row.sevaTypeName].push(row);
        });

        const typeNames = Object.keys(grouped);

        return (
          <div className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="panel-header">
              <div>
                <h3 className="panel-title">સેવા પ્રકાર વાઈઝ શ્રેષ્ઠ અહેવાલ (ટોપ ૧૦)</h3>
                <p className="panel-subtitle">સેવા પ્રકાર મુજબ શ્રેષ્ઠ સેવા આપનાર ૧૦ સભ્યો</p>
              </div>
              <button
                className="btn-primary"
                onClick={onPrintSevaLeaderboard}
                disabled={sevaTypeLeaderboardData.length === 0}
              >
                પ્રિન્ટ / PDF ડાઉનલોડ
              </button>
            </div>

            {loadingSevaTypeLeaderboard ? (
              <SkeletonText rows={8} />
            ) : typeNames.length === 0 ? (
              <div className="empty-state" style={{ padding: '36px 20px' }}>
                <div className="empty-state-icon" style={{ width: 48, height: 48 }}>
                  <Heart size={22} />
                </div>
                <p className="empty-state-title" style={{ fontSize: '0.9rem' }}>કોઈ સેવા રેકોર્ડ ઉપલબ્ધ નથી</p>
                <p className="empty-state-desc" style={{ marginBottom: 0 }}>સેવા હાજરી સાચવ્યા બાદ અહીં અહેવાલ દેખાશે.</p>
              </div>
            ) : (
              <div className="grid-2" style={{ gap: 24 }}>
                {typeNames.map((typeName, index) => {
                  const list = grouped[typeName].slice(0, 10);
                  const headerColor = index % 2 === 0 ? 'var(--color-primary)' : 'var(--color-secondary)';
                  return (
                    <div key={typeName} className="glass-card" style={{ overflowX: 'auto', padding: 16 }}>
                      <h4 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 12, color: headerColor, borderBottom: '1px solid var(--glass-border)', paddingBottom: 8 }}>
                        {typeName}: શ્રેષ્ઠ ૧૦ સેવાકર્તા
                      </h4>
                      <table className="mini-table">
                        <thead>
                          <tr>
                            <th style={{ textAlign: 'left', width: '10%' }}>ક્રમ</th>
                            <th style={{ textAlign: 'left', width: '35%' }}>નામ</th>
                            <th style={{ textAlign: 'left', width: '15%' }}>કોડ</th>
                            <th style={{ textAlign: 'center', width: '20%' }}>કુલ સેવા</th>
                            <th style={{ textAlign: 'right', width: '20%' }}>કુલ કલાક</th>
                          </tr>
                        </thead>
                        <tbody>
                          {list.map((item, idx) => (
                            <tr key={idx}>
                              <td>{idx + 1}</td>
                              <td style={{ fontWeight: 600 }}>{item.name}</td>
                              <td style={{ fontFamily: 'monospace' }}>{item.uniqueCode}</td>
                              <td style={{ textAlign: 'center' }}>{item.sevaCount} વખત</td>
                              <td style={{ textAlign: 'right', color: 'var(--color-success)', fontWeight: 700 }}>{item.totalHours} કલાક</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* Seva Sub Tab 3: Particular Seva Report */}
      {sevaReportsSubTab === 'particular' && (
        <div className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="panel-header">
            <div>
              <h3 className="panel-title">વિશિષ્ટ સેવા વિગતવાર રિપોર્ટ</h3>
              <p className="panel-subtitle">ચોક્કસ સેવા તારીખનો સંપૂર્ણ અહેવાલ મેળવો</p>
            </div>
            {particularSevaReport && (
              <button
                className="btn-primary"
                onClick={onPrintParticularSeva}
              >
                પ્રિન્ટ / PDF ડાઉનલોડ
              </button>
            )}
          </div>

          <div>
            <label className="form-label">અહેવાલ માટે સેવા પસંદ કરો:</label>
            <select
              className="glass-input"
              value={selectedParticularSevaId}
              onChange={(e) => setSelectedParticularSevaId(e.target.value)}
            >
              <option value="">-- સેવા પસંદ કરો (તારીખ અને પ્રકાર) --</option>
              {sevas.map(seva => (
                <option key={seva._id} value={seva._id}>
                  {new Date(seva.date).toLocaleDateString('gu-IN', { year: 'numeric', month: 'long', day: 'numeric' })} - {seva.sevaType ? seva.sevaType.name : 'અજ્ઞાત'} {seva.leader ? `(${seva.leader})` : ''}
                </option>
              ))}
            </select>
          </div>

          {loadingParticularSeva ? (
            <SkeletonText rows={6} />
          ) : particularSevaReport ? (() => {
            const recordsMap = {};
            particularSevaReport.attendance.forEach(rec => {
              if (rec.member) {
                recordsMap[rec.member._id] = {
                  status: rec.status,
                  hours: rec.hours
                };
              }
            });

            const combinedList = sevaMembers.map(m => {
              const att = recordsMap[m._id] || { status: 'absent', hours: 0 };
              return {
                _id: m._id,
                name: m.name,
                uniqueCode: m.uniqueCode,
                type: m.type,
                status: att.status,
                hours: att.hours
              };
            });

            combinedList.sort((a, b) => {
              const presentA = a.status === 'present';
              const presentB = b.status === 'present';
              if (presentA && !presentB) return -1;
              if (!presentA && presentB) return 1;
              if (presentA && presentB) {
                return b.hours - a.hours;
              }
              return a.name.localeCompare(b.name, 'gu');
            });

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span className="badge badge-success">હાજર સભ્યો: {combinedList.filter(m => m.status === 'present').length}</span>
                  <span className="badge badge-danger">ગેરહાજર સભ્યો: {combinedList.filter(m => m.status === 'absent').length}</span>
                  <span className="badge badge-info">કુલ લોગ થયેલ કલાક: {combinedList.reduce((sum, item) => sum + item.hours, 0)} કલાક</span>
                </div>

                <div className="table-wrap" style={{ maxHeight: '440px', overflowY: 'auto', width: '100%', maxWidth: '100%' }}>
                  <table style={{ width: '100%', minWidth: '480px' }}>
                    <thead>
                      <tr>
                        <th>ક્રમ</th>
                        <th>નામ</th>
                        <th>કોડ</th>
                        <th>પ્રકાર</th>
                        <th style={{ textAlign: 'center' }}>સ્થિતિ</th>
                        <th style={{ textAlign: 'right' }}>લોગ કરેલ સેવા કલાક</th>
                      </tr>
                    </thead>
                    <tbody>
                      {combinedList.map((m, idx) => {
                        const isPresent = m.status === 'present';
                        return (
                          <tr key={m._id}>
                            <td style={{ color: 'var(--color-text-secondary)' }}>{idx + 1}</td>
                            <td style={{ fontWeight: 600 }}>{m.name}</td>
                            <td style={{ fontFamily: 'monospace' }}>{m.uniqueCode}</td>
                            <td>{SEVA_CATEGORY_TAGS[m.type] || m.type}</td>
                            <td style={{ textAlign: 'center' }}>
                              <span className={`badge ${isPresent ? 'badge-success' : 'badge-danger'}`}>
                                {isPresent ? 'હાજર' : 'ગેરહાજર'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>
                              {isPresent ? `${m.hours} કલાક` : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })() : (
            <div className="empty-state" style={{ padding: '36px 20px' }}>
              <div className="empty-state-icon" style={{ width: 48, height: 48 }}>
                <Heart size={22} />
              </div>
              <p className="empty-state-title" style={{ fontSize: '0.9rem' }}>અહેવાલ માટે સેવા પસંદ કરો</p>
              <p className="empty-state-desc" style={{ marginBottom: 0 }}>ઉપરના ડ્રોપડાઉનમાંથી સેવા પસંદ કરવાથી સંપૂર્ણ અહેવાલ અહીં દેખાશે.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
