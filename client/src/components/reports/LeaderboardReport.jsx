import React from 'react';
import { Printer, AlertTriangle } from 'lucide-react';
import { SkeletonText } from '../Loaders';
import { CATEGORY_LABELS, CATEGORY_TAGS } from '../../constants/sabhaConstants';

export default function LeaderboardReport({
  topAttendeesData,
  loadingTopAttendees,
  leaderboardTypeFilter,
  setLeaderboardTypeFilter,
  onPrintLeaderboard,
  onRetry
}) {
  return (
    <div className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="panel-header" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 className="panel-title">રવિસભા શ્રેષ્ઠ અહેવાલ (ટોપ ૧૦)</h3>
          <p className="panel-subtitle">રવિસભામાં સમયસર અને મોડા પહોંચનાર સભ્યોનું સરેરાશ સમય પત્રક</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
              સભા સભ્ય પ્રકાર:
            </label>
            <select
              className="glass-input"
              style={{ padding: '6px 12px', minWidth: 140 }}
              value={leaderboardTypeFilter}
              onChange={(e) => setLeaderboardTypeFilter(e.target.value)}
            >
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <button
            className="btn-primary"
            onClick={onPrintLeaderboard}
            disabled={loadingTopAttendees || !topAttendeesData}
          >
            <Printer size={16} /> પ્રિન્ટ / PDF ડાઉનલોડ
          </button>
        </div>
      </div>

      {loadingTopAttendees ? (
        <SkeletonText rows={8} />
      ) : topAttendeesData ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Table 1: Early / On-Time AVG Time Top 10 */}
          <div className="glass-card" style={{ overflowX: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid var(--glass-border)', paddingBottom: 8 }}>
              <div>
                <h4 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-primary)', margin: 0 }}>
                  ૧. રવિસભા: સમયસર / વહેલા પહોંચનાર શ્રેષ્ઠ ૧૦ (વહેલા સરેરાશ સમય મુજબ)
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: 0, marginTop: 2 }}>
                  રવિસભામાં સૌથી વહેલા સરેરાશ પહોંચવાનો સમય અને નિયમિત હાજરી ધરાવતા સભ્યો
                </p>
              </div>
              <span className="badge badge-primary">
                {topAttendeesData.raviTopGroups ? `${topAttendeesData.raviTopGroups.length} રેન્ક` : '૦'}
              </span>
            </div>

            {(!topAttendeesData.raviTopGroups || topAttendeesData.raviTopGroups.length === 0) ? (
              <p style={{ padding: '16px 8px', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                આ કેટેગરીમાં રવિસભામાં વહેલા/સમયસર પહોંચવાનો સમય નોંધાયેલ હોય તેવા કોઈ સભ્યો મળ્યા નથી.
              </p>
            ) : (
              <table className="mini-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'center', width: 90 }}>ક્રમ (સંખ્યા)</th>
                    <th style={{ textAlign: 'left' }}>સભ્ય / સભ્યોનું નામ</th>
                    <th style={{ textAlign: 'center', width: 150 }}>સરેરાશ સમય (AVG Time)</th>
                    <th style={{ textAlign: 'right', width: 120 }}>સભા હાજરી</th>
                  </tr>
                </thead>
                <tbody>
                  {topAttendeesData.raviTopGroups.map((group) => (
                    <tr key={group.rank}>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          className="badge"
                          style={{
                            fontWeight: 700,
                            fontSize: '0.88rem',
                            padding: '4px 10px',
                            background: group.rank <= 3 ? 'rgba(76, 5, 133, 0.15)' : 'rgba(255,255,255,0.05)',
                            color: group.rank <= 3 ? 'var(--color-primary)' : 'inherit',
                            border: group.rank <= 3 ? '1px solid var(--color-primary)' : '1px solid var(--glass-border)'
                          }}
                        >
                          {group.rankLabel}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {group.members.map((m) => (
                            <div key={m._id} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{m.name}</span>
                              {m.nameEn && (
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                  ({m.nameEn})
                                </span>
                              )}
                              <span className="badge badge-secondary" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>
                                {CATEGORY_TAGS[m.type] || m.type}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          className="badge badge-success"
                          style={{ fontWeight: 700, fontSize: '0.9rem', padding: '4px 10px' }}
                        >
                          {group.avgTime}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {group.members.map(m => m.count).join(', ')} સભા
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Table 2: Late AVG Time Top 20 */}
          <div className="glass-card" style={{ overflowX: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid var(--glass-border)', paddingBottom: 8 }}>
              <div>
                <h4 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-warning)', margin: 0 }}>
                  ૨. રવિસભા: મોડા પડનાર ૨૦ સભ્યો (મોડા સરેરાશ સમય મુજબ)
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: 0, marginTop: 2 }}>
                  રવિસભામાં સૌથી મોડા સરેરાશ પહોંચવાનો સમય અને મોડા પડવાના મુખ્ય કારણો (ટોપ ૩)
                </p>
              </div>
              <span className="badge badge-warning">
                {topAttendeesData.raviLateGroups ? `${topAttendeesData.raviLateGroups.length} રેન્ક` : '૦'}
              </span>
            </div>

            {(!topAttendeesData.raviLateGroups || topAttendeesData.raviLateGroups.length === 0) ? (
              <p style={{ padding: '16px 8px', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                આ કેટેગરીમાં રવિસભામાં મોડા પડ્યા હોય તેવા કોઈ સભ્યો મળ્યા નથી.
              </p>
            ) : (
              <table className="mini-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'center', width: 90 }}>ક્રમ (સંખ્યા)</th>
                    <th style={{ textAlign: 'left' }}>સભ્ય / સભ્યોનું નામ</th>
                    <th style={{ textAlign: 'left', minWidth: 160 }}>મોડા પડવાના મુખ્ય કારણો (Top 3)</th>
                    <th style={{ textAlign: 'center', width: 140 }}>સરેરાશ સમય (AVG Time)</th>
                    <th style={{ textAlign: 'right', width: 120 }}>મોડા પડ્યા</th>
                  </tr>
                </thead>
                <tbody>
                  {topAttendeesData.raviLateGroups.map((group) => (
                    <tr key={group.rank}>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          className="badge"
                          style={{
                            fontWeight: 700,
                            fontSize: '0.88rem',
                            padding: '4px 10px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: 'var(--color-danger)',
                            border: '1px solid rgba(239, 68, 68, 0.3)'
                          }}
                        >
                          {group.rankLabel}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {group.members.map((m) => (
                            <div key={m._id} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{m.name}</span>
                              {m.nameEn && (
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                  ({m.nameEn})
                                </span>
                              )}
                              <span className="badge badge-secondary" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>
                                {CATEGORY_TAGS[m.type] || m.type}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {group.members.map((m) => (
                            <div key={m._id} style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              {(!m.topReasons || m.topReasons.length === 0) ? (
                                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>-</span>
                              ) : (
                                m.topReasons.map((r, rIdx) => {
                                  const isOther = r.reason === 'અન્ય';
                                  return (
                                    <span
                                      key={rIdx}
                                      style={{
                                        fontSize: '0.74rem',
                                        fontWeight: 600,
                                        padding: '2px 8px',
                                        borderRadius: 10,
                                        background: isOther ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.12)',
                                        color: isOther ? 'var(--color-danger)' : 'var(--color-warning)',
                                        border: isOther ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(245, 158, 11, 0.25)'
                                      }}
                                    >
                                      {r.label}
                                    </span>
                                  );
                                })
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          className="badge badge-danger"
                          style={{ fontWeight: 700, fontSize: '0.9rem', padding: '4px 10px' }}
                        >
                          {group.avgTime}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-danger)' }}>
                        {group.members.map(m => m.count).join(', ')} વખત
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        <div className="empty-state" style={{ padding: '36px 20px' }}>
          <div className="empty-state-icon" style={{ width: 48, height: 48 }}>
            <AlertTriangle size={22} />
          </div>
          <p className="empty-state-title" style={{ fontSize: '0.9rem' }}>રેકોર્ડ મેળવવામાં ભૂલ થઈ છે</p>
          <button className="btn-secondary btn-sm" onClick={onRetry}>ફરી પ્રયત્ન કરો</button>
        </div>
      )}
    </div>
  );
}
