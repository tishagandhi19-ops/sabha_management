import React from 'react';
import {
  ArrowLeft,
  UserCheck,
  CheckCircle,
  X,
  Clock,
  AlertTriangle,
  Search,
  Users
} from 'lucide-react';
import { SpinnerLoader } from '../Loaders';
import { SEVA_CATEGORY_TAGS } from '../../constants/sabhaConstants';
import { sortMembersBySearchRank } from '../../utils/searchRank';

export default function SevaAttendanceSheet({
  activeSevaData,
  loadingSevaAttendance,
  sevaMembers,
  sevaAttendanceRecords,
  savingSevaAttendance,
  sevaAttendanceSearch,
  setSevaAttendanceSearch,
  hasSevaDraft,
  sevaDraftCount,
  onBack,
  onSaveSevaAttendance,
  onDiscardSevaDraft,
  toggleSevaAttendanceStatus,
  handleSevaHoursChange
}) {
  const presentCount = Object.values(sevaAttendanceRecords).filter(r => r.status === 'present').length;
  const absentCount = Object.values(sevaAttendanceRecords).filter(r => r.status === 'absent').length;

  const filteredSevaMembers = sortMembersBySearchRank(
    sevaMembers.filter(m => {
      if (!sevaAttendanceSearch.trim()) return true;
      const query = sevaAttendanceSearch.toLowerCase();
      return (
        m.name.toLowerCase().includes(query) ||
        (m.nameEn && m.nameEn.toLowerCase().includes(query)) ||
        (m.uniqueCode && m.uniqueCode.toLowerCase().includes(query)) ||
        (m.mobileNumber && m.mobileNumber.includes(query))
      );
    }),
    sevaAttendanceSearch
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
        <button
          className="btn-secondary"
          onClick={onBack}
          style={{ width: 40, height: 40, borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="પાછા જાવ"
        >
          <ArrowLeft size={20} />
        </button>

        <button
          className="btn-primary btn-sm"
          onClick={onSaveSevaAttendance}
          disabled={savingSevaAttendance || (activeSevaData && sevaMembers.length === 0) || loadingSevaAttendance}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 20 }}
        >
          {savingSevaAttendance ? <SpinnerLoader size={16} /> : <UserCheck size={16} />} હાજરી સબમિટ કરો
        </button>
      </div>

      {loadingSevaAttendance ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 24, textAlign: 'center', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
          <SpinnerLoader size={36} />
          <p style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)' }}>ડેટા લોડ થઈ રહ્યો છે, કૃપા કરીને પ્રતીક્ષા કરો...</p>
        </div>
      ) : activeSevaData ? (
        <div className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <h2 className="panel-title" style={{ fontSize: '1.4rem', fontWeight: 700, margin: '4px 0' }}>
              હાજરી પત્રક: {new Date(activeSevaData.date).toLocaleDateString('gu-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </h2>
            <p className="panel-subtitle" style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: 12 }}>
              સેવા પ્રકાર: {activeSevaData.sevaType ? activeSevaData.sevaType.name : 'અજ્ઞાત'} {activeSevaData.leader ? `| લીડર: ${activeSevaData.leader}` : ''}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0 8px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: 12 }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-success)', lineHeight: 1.2 }}>
                  {presentCount}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Present</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-danger)', lineHeight: 1.2 }}>
                  {absentCount}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Absent</div>
              </div>
            </div>
          </div>

          {hasSevaDraft && (
            <div style={{
              background: 'rgba(219, 181, 238, 0.3)',
              border: '1px solid rgba(76, 5, 133, 0.2)',
              borderRadius: 12,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertTriangle size={20} style={{ color: '#4C0585', flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.88rem', color: '#4C0585', marginBottom: 2 }}>
                    અણસાચવેલ સેવા હાજરી ડ્રાફ્ટ મોજૂદ છે ({sevaDraftCount} અણસાચવેલ ફેરફારો)
                  </p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginBottom: 0 }}>
                    તમારો સેવા ડ્રાફ્ટ સુરક્ષિત સાચવેલ છે. કૃપા કરીને હાજરી સબમિટ કરો અથવા ડ્રાફ્ટ રદ કરો.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn-primary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  onClick={onSaveSevaAttendance}
                  disabled={savingSevaAttendance}
                >
                  {savingSevaAttendance ? <SpinnerLoader size={14} /> : <UserCheck size={14} />} હવે સબમિટ કરો
                </button>
                <button
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  onClick={onDiscardSevaDraft}
                >
                  ડ્રાફ્ટ રદ કરો
                </button>
              </div>
            </div>
          )}

          {/* Search Bar for Member Attendance */}
          <div className="search-field">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              className="glass-input"
              placeholder="સભ્યનું નામ અથવા કોડથી શોધો..."
              value={sevaAttendanceSearch}
              onChange={(e) => setSevaAttendanceSearch(e.target.value)}
            />
            {sevaAttendanceSearch && (
              <button
                className="icon-btn"
                style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, minWidth: 32 }}
                onClick={() => setSevaAttendanceSearch('')}
                aria-label="સર્ચ સાફ કરો"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Attendance Cards Grid */}
          {sevaMembers.length === 0 ? (
            <div className="empty-state" style={{ padding: '48px 24px', background: 'rgba(255,255,255,0.4)', borderRadius: 12, border: '1px dashed var(--glass-border-strong)' }}>
              <div className="empty-state-icon">
                <Users size={28} />
              </div>
              <p className="empty-state-title">કોઈ સેવા સભ્યો નોંધાયેલા નથી</p>
              <p className="empty-state-desc" style={{ marginBottom: 0 }}>હાજરી પૂરવા માટે પહેલા "સભ્યો" વિભાગમાંથી સભ્યો ઉમેરો.</p>
            </div>
          ) : filteredSevaMembers.length === 0 ? (
            <div className="empty-state" style={{ padding: '36px 20px' }}>
              <div className="empty-state-icon" style={{ width: 48, height: 48 }}>
                <Search size={22} />
              </div>
              <p className="empty-state-title" style={{ fontSize: '0.9rem' }}>સર્ચ મુજબ કોઈ સભ્ય મળ્યો નથી</p>
              <button className="btn-ghost btn-sm" onClick={() => setSevaAttendanceSearch('')}>સર્ચ સાફ કરો</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: 14, maxHeight: '420px', overflowY: 'auto', paddingRight: 4 }}>
              {filteredSevaMembers.map(m => {
                const rec = sevaAttendanceRecords[m._id] || { status: 'absent', hours: 0 };
                const isPresent = rec.status === 'present';

                return (
                  <div
                    key={m._id}
                    className="animate-fade-in"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      padding: '12px 0',
                      borderBottom: '1px solid rgba(0,0,0,0.05)',
                      background: 'transparent',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h4 style={{ fontWeight: 500, fontSize: '1.05rem', color: '#111', overflowWrap: 'anywhere', margin: 0 }}>
                          {m.name}
                          {m.nameEn && (
                            <span style={{ fontSize: '0.82rem', color: '#6b7280', marginLeft: 6, fontWeight: 400 }}>
                              ({m.nameEn})
                            </span>
                          )}
                        </h4>
                        <p style={{ fontSize: '0.8rem', color: '#666', margin: 0, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          SMK ID: <span style={{ fontWeight: 600 }}>{m.uniqueCode}</span>
                          <span className="badge badge-primary" style={{ padding: '2px 6px', fontSize: '0.7rem' }}>
                            {SEVA_CATEGORY_TAGS[m.type] || m.type}
                          </span>
                        </p>
                      </div>

                      {/* Present / Absent Buttons */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                        <button
                          onClick={() => {
                            if (!isPresent) {
                              toggleSevaAttendanceStatus(m._id);
                            }
                          }}
                          style={{
                            borderRadius: '50%',
                            width: 36,
                            height: 36,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            background: isPresent ? '#15803d' : '#dcfce7',
                            color: isPresent ? '#fff' : '#15803d',
                            border: 'none',
                            transition: 'var(--transition-smooth)',
                          }}
                          title="હાજર (Present)"
                          aria-label={`${m.name} હાજર`}
                        >
                          <CheckCircle size={18} />
                        </button>

                        <button
                          onClick={() => {
                            if (isPresent) {
                              toggleSevaAttendanceStatus(m._id);
                            }
                          }}
                          style={{
                            borderRadius: '50%',
                            width: 36,
                            height: 36,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            background: !isPresent ? '#dc2626' : '#fee2e2',
                            color: !isPresent ? '#fff' : '#dc2626',
                            border: 'none',
                            transition: 'var(--transition-smooth)',
                          }}
                          title="ગેરહાજર (Absent)"
                          aria-label={`${m.name} ગેરહાજર`}
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Ask for hours inline (shown when present) */}
                    {isPresent && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px dashed var(--glass-border)', paddingTop: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={12} /> સેવાના કલાકો:
                          </span>
                          <input
                            type="number"
                            min="0"
                            max="24"
                            step="0.5"
                            className="glass-input"
                            placeholder="કલાકો લખો..."
                            style={{
                              width: 100,
                              padding: '6px 10px',
                              minHeight: 34,
                              fontSize: '0.85rem',
                              borderRadius: 8
                            }}
                            value={rec.hours}
                            onChange={(e) => handleSevaHoursChange(m._id, e.target.value)}
                            aria-label={`${m.name} સેવાના કલાકો`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
