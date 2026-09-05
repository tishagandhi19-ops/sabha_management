import React from 'react';
import {
  ArrowLeft,
  UserCheck,
  CheckCircle,
  X,
  Clock,
  AlertTriangle,
  Search,
  Users,
  Check
} from 'lucide-react';
import { SpinnerLoader, DeterminateProgress } from '../Loaders';
import { LATE_REASON_OPTIONS } from '../../constants/sabhaConstants';
import { sortMembersBySearchRank } from '../../utils/searchRank';
import { transliterateEnglishToGujarati } from '../../utils/englishToGujarati';

export default function AttendanceSheet({
  activeEventData,
  loadingEventAttendance,
  members,
  displayMembers,
  attendanceRecords,
  setAttendanceRecords,
  savingAttendance,
  attendanceProgress,
  attendanceSearch,
  setAttendanceSearch,
  hasSabhaDraft,
  sabhaDraftCount,
  onBack,
  onSubmitAttendance,
  onDiscardDraft,
  markAttendance,
  handleRemarkChange
}) {
  const onTimeCount = Object.values(attendanceRecords).filter(r => r.status === 'present' && !r.isLate).length;
  const lateCount = Object.values(attendanceRecords).filter(r => r.status === 'present' && r.isLate).length;
  const absentCount = Object.values(attendanceRecords).filter(r => r.status === 'absent').length;
  const excusedCount = Object.values(attendanceRecords).filter(r => r.status === 'excused').length;

  const filteredMembers = sortMembersBySearchRank(
    displayMembers.filter(m => {
      if (!attendanceSearch.trim()) return true;
      const q = attendanceSearch.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        (m.nameEn && m.nameEn.toLowerCase().includes(q)) ||
        (m.uniqueCode && m.uniqueCode.toLowerCase().includes(q)) ||
        (m.mobileNumber && m.mobileNumber.includes(q))
      );
    }),
    attendanceSearch
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
          onClick={onSubmitAttendance}
          disabled={savingAttendance || (activeEventData && members.length === 0) || loadingEventAttendance}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 20 }}
        >
          {savingAttendance ? <SpinnerLoader size={16} /> : <UserCheck size={16} />} હાજરી સબમિટ કરો
        </button>
      </div>

      {loadingEventAttendance ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 24, textAlign: 'center', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
          <SpinnerLoader size={36} />
          <p style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)' }}>ડેટા લોડ થઈ રહ્યો છે, કૃપા કરીને પ્રતીક્ષા કરો...</p>
        </div>
      ) : activeEventData ? (
        <>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0 8px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: 12 }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-success)', lineHeight: 1.2 }}>
                  {onTimeCount}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>OnTime</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-warning)', lineHeight: 1.2 }}>
                  {lateCount}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Late</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-danger)', lineHeight: 1.2 }}>
                  {absentCount}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Absent</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-text-secondary)', lineHeight: 1.2 }}>
                  {excusedCount}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Excused</div>
              </div>
            </div>
          </div>

          {hasSabhaDraft && (
            <div style={{
              background: 'rgba(254, 240, 138, 0.3)',
              border: '1px solid rgba(202, 138, 4, 0.2)',
              borderRadius: 12,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertTriangle size={20} style={{ color: '#ca8a04', flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.88rem', color: '#ca8a04', marginBottom: 2 }}>
                    અણસાચવેલ સભા હાજરી ડ્રાફ્ટ મોજૂદ છે ({sabhaDraftCount} અણસાચવેલ ફેરફારો)
                  </p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginBottom: 0 }}>
                    તમારો સભા ડ્રાફ્ટ સુરક્ષિત સાચવેલ છે. કૃપા કરીને હાજરી સબમિટ કરો અથવા ડ્રાફ્ટ રદ કરો.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn-primary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  onClick={onSubmitAttendance}
                  disabled={savingAttendance}
                >
                  {savingAttendance ? <SpinnerLoader size={14} /> : <UserCheck size={14} />} હવે સબમિટ કરો
                </button>
                <button
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  onClick={onDiscardDraft}
                >
                  ડ્રાફ્ટ રદ કરો
                </button>
              </div>
            </div>
          )}

          {savingAttendance && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span>હાજરી સેવ થઈ રહી છે...</span>
                <span>{attendanceProgress}%</span>
              </div>
              <DeterminateProgress value={attendanceProgress} />
            </div>
          )}

          {/* Attendance Search Bar */}
          <div className="search-field">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              className="glass-input"
              placeholder="નામ અથવા કોડથી સભ્યને શોધો..."
              value={attendanceSearch}
              onChange={(e) => setAttendanceSearch(e.target.value)}
            />
            {attendanceSearch && (
              <button
                className="icon-btn"
                style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, minWidth: 32 }}
                onClick={() => setAttendanceSearch('')}
                aria-label="સર્ચ સાફ કરો"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Attendance Cards Grid */}
          {displayMembers.length === 0 ? (
            <div className="empty-state" style={{ padding: '48px 24px', background: 'rgba(255,255,255,0.4)', borderRadius: 12, border: '1px dashed var(--glass-border-strong)' }}>
              <div className="empty-state-icon">
                <Users size={28} />
              </div>
              <p className="empty-state-title">કોઈ સભ્યો નોંધાયેલા નથી</p>
              <p className="empty-state-desc" style={{ marginBottom: 0 }}>હાજરી પૂરવા માટે પહેલા "સભ્યો" વિભાગમાંથી સભ્યો ઉમેરો.</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="empty-state" style={{ padding: '36px 20px' }}>
              <div className="empty-state-icon" style={{ width: 48, height: 48 }}>
                <Search size={22} />
              </div>
              <p className="empty-state-title" style={{ fontSize: '0.9rem' }}>સર્ચ મુજબ કોઈ સભ્ય મળ્યો નથી</p>
              <button className="btn-ghost btn-sm" onClick={() => setAttendanceSearch('')}>સર્ચ સાફ કરો</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: 14, maxHeight: '420px', overflowY: 'auto', paddingRight: 4 }}>
              {filteredMembers.map(member => {
                const rec = attendanceRecords[member._id] || { status: 'absent' };
                const isPresent = rec.status === 'present';

                return (
                  <div
                    key={member._id}
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
                          {member.name}
                          {member.nameEn && (
                            <span style={{ fontSize: '0.82rem', color: '#6b7280', marginLeft: 6, fontWeight: 400 }}>
                              ({member.nameEn})
                            </span>
                          )}
                        </h4>
                        <p style={{ fontSize: '0.8rem', color: '#666', margin: 0, marginTop: 4 }}>
                          SMK ID: <span style={{ fontWeight: 600 }}>{member.uniqueCode}</span>
                        </p>
                      </div>

                      {/* Present / Late / Absent Buttons */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                        <button
                          onClick={() => markAttendance(member._id, 'present')}
                          style={{
                            borderRadius: '50%',
                            width: 36,
                            height: 36,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            background: isPresent && !rec.isLate ? '#15803d' : '#dcfce7',
                            color: isPresent && !rec.isLate ? '#fff' : '#15803d',
                            border: 'none',
                            transition: 'var(--transition-smooth)',
                          }}
                          title="હાજર (OnTime)"
                          aria-label={`${member.name} હાજર`}
                        >
                          <CheckCircle size={18} />
                        </button>

                        <button
                          onClick={() => {
                            setAttendanceRecords(prev => {
                              const current = prev[member._id] || {};
                              const isAlreadyLate = current.status === 'present' && current.isLate;
                              return {
                                ...prev,
                                [member._id]: {
                                  ...current,
                                  status: 'present',
                                  arrivalTime: current.arrivalTime || new Date(),
                                  isLate: !isAlreadyLate,
                                  remark: !isAlreadyLate ? (current.remark || '') : ''
                                }
                              };
                            });
                          }}
                          style={{
                            borderRadius: '50%',
                            width: 36,
                            height: 36,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            background: isPresent && rec.isLate ? '#ca8a04' : '#fef08a',
                            color: isPresent && rec.isLate ? '#fff' : '#ca8a04',
                            border: 'none',
                            transition: 'var(--transition-smooth)',
                          }}
                          title="મોડા (Late)"
                          aria-label={`${member.name} મોડા`}
                        >
                          <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>!</span>
                        </button>

                        <button
                          onClick={() => markAttendance(member._id, 'absent')}
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
                          aria-label={`${member.name} ગેરહાજર`}
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Arrival Time and Late prompt */}
                    {isPresent && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px dashed var(--glass-border)', paddingTop: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={12} /> આવ્યા સમય: {new Date(rec.arrivalTime).toLocaleTimeString('gu-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {rec.isLate && (
                            <span className="badge badge-warning">
                              <AlertTriangle size={11} /> મોડા પડ્યા!
                            </span>
                          )}
                        </div>

                        {rec.isLate && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                            {/* Predefined Quick-Select Options in Gujarati */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {LATE_REASON_OPTIONS.map((opt) => {
                                const currentTrimmed = (rec.remark || '').trim();
                                const isSelected = opt === 'અન્ય'
                                  ? Boolean(currentTrimmed && !LATE_REASON_OPTIONS.slice(0, 6).includes(currentTrimmed))
                                  : currentTrimmed === opt;
                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => {
                                      if (opt === 'અન્ય') {
                                        if (LATE_REASON_OPTIONS.slice(0, 6).includes(currentTrimmed)) {
                                          handleRemarkChange(member._id, '');
                                        }
                                        setTimeout(() => {
                                          document.getElementById(`late-reason-input-${member._id}`)?.focus();
                                        }, 50);
                                      } else {
                                        handleRemarkChange(member._id, isSelected ? '' : opt);
                                      }
                                    }}
                                    style={{
                                      padding: '3px 9px',
                                      fontSize: '0.75rem',
                                      borderRadius: 14,
                                      border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--glass-border-strong)',
                                      background: isSelected ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.6)',
                                      color: isSelected ? '#ffffff' : 'var(--color-text-primary)',
                                      cursor: 'pointer',
                                      fontWeight: isSelected ? 600 : 500,
                                      transition: 'all 0.15s ease',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4
                                    }}
                                  >
                                    {isSelected && <Check size={11} />}
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>

                            <input
                              id={`late-reason-input-${member._id}`}
                              type="text"
                              className="glass-input"
                              placeholder="મોડા આવવાનું કારણ લખો (દા.ત. dukan → દુકાન)..."
                              value={rec.remark || ''}
                              onChange={(e) => {
                                let val = e.target.value;
                                if (val.endsWith(' ')) {
                                  val = transliterateEnglishToGujarati(val);
                                }
                                handleRemarkChange(member._id, val);
                              }}
                              onBlur={(e) => {
                                const converted = transliterateEnglishToGujarati(e.target.value);
                                if (converted !== e.target.value) {
                                  handleRemarkChange(member._id, converted);
                                }
                              }}
                              style={{ padding: '8px 12px', minHeight: 38, fontSize: '0.8rem', borderRadius: 8 }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
