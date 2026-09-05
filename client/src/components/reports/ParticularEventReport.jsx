import React from 'react';
import { Calendar } from 'lucide-react';
import { SkeletonText } from '../Loaders';
import { CATEGORY_TAGS, formatTime12h } from '../../constants/sabhaConstants';

export default function ParticularEventReport({
  events,
  selectedParticularEventId,
  setSelectedParticularEventId,
  loadingParticularEvent,
  particularEventReport,
  members,
  onPrintParticularEvent
}) {
  const filteredEvents = events.filter(e => !e.type || e.type === 'ravi_sabha');

  // Compile records list if particularEventReport exists
  let combinedList = [];
  if (particularEventReport && particularEventReport.attendance) {
    const recordsMap = {};
    particularEventReport.attendance.forEach(rec => {
      if (rec.member) {
        recordsMap[rec.member._id] = {
          status: rec.status,
          isLate: rec.isLate,
          arrivalTime: rec.arrivalTime,
          remark: rec.remark
        };
      }
    });

    combinedList = members.map(m => {
      const att = recordsMap[m._id] || { status: 'absent', isLate: false, arrivalTime: null, remark: '' };
      return {
        _id: m._id,
        name: m.name,
        uniqueCode: m.uniqueCode,
        type: m.type,
        status: att.status,
        isLate: att.isLate,
        arrivalTime: att.arrivalTime,
        remark: att.remark
      };
    });

    combinedList.sort((a, b) => {
      const presentA = a.status === 'present';
      const presentB = b.status === 'present';
      if (presentA && !presentB) return -1;
      if (!presentA && presentB) return 1;
      if (presentA && presentB) {
        const timeA = a.arrivalTime ? new Date(a.arrivalTime).getTime() : 0;
        const timeB = b.arrivalTime ? new Date(b.arrivalTime).getTime() : 0;
        return timeA - timeB;
      }
      return a.name.localeCompare(b.name, 'gu');
    });
  }

  return (
    <div className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="panel-header">
        <div>
          <h3 className="panel-title">વિશિષ્ટ રવિસભા વિગતવાર રિપોર્ટ</h3>
          <p className="panel-subtitle">કોઈ ચોક્કસ રવિસભા તારીખનો સંપૂર્ણ રિપોર્ટ મેળવો</p>
        </div>
        {particularEventReport && (
          <button
            className="btn-primary"
            onClick={onPrintParticularEvent}
          >
            પ્રિન્ટ / PDF ડાઉનલોડ
          </button>
        )}
      </div>

      <div>
        <label className="form-label">રિપોર્ટ માટે રવિસભા પસંદ કરો:</label>
        <select
          className="glass-input"
          value={selectedParticularEventId}
          onChange={(e) => setSelectedParticularEventId(e.target.value)}
        >
          <option value="">-- રવિસભા પસંદ કરો (તારીખ) --</option>
          {filteredEvents.map(event => (
            <option key={event._id} value={event._id}>
              {new Date(event.date).toLocaleDateString('gu-IN', { year: 'numeric', month: 'long', day: 'numeric' })} {event.minReachTime ? `(${formatTime12h(event.minReachTime)})` : ''}
            </option>
          ))}
        </select>
      </div>

      {loadingParticularEvent ? (
        <SkeletonText rows={6} />
      ) : particularEventReport ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className="badge badge-success">હાજર સભ્યો: {combinedList.filter(m => m.status === 'present').length}</span>
            <span className="badge badge-danger">ગેરહાજર સભ્યો: {combinedList.filter(m => m.status === 'absent').length}</span>
            <span className="badge badge-warning">મોડા પડનાર: {combinedList.filter(m => m.status === 'present' && m.isLate).length}</span>
          </div>

          <div className="table-wrap" style={{ maxHeight: '440px', overflowY: 'auto', width: '100%', maxWidth: '100%' }}>
            <table style={{ width: '100%', minWidth: '520px' }}>
              <thead>
                <tr>
                  <th>ક્રમ</th>
                  <th>નામ</th>
                  <th>કોડ</th>
                  <th>પ્રકાર</th>
                  <th>સ્થિતિ</th>
                  <th>પહોંચવાનો સમય</th>
                  <th>નોંધ (રિમાર્ક)</th>
                </tr>
              </thead>
              <tbody>
                {combinedList.map((m, idx) => {
                  const isPresent = m.status === 'present';
                  return (
                    <tr key={m._id}>
                      <td>{idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>{m.name}</td>
                      <td style={{ fontFamily: 'monospace' }}>{m.uniqueCode}</td>
                      <td>{CATEGORY_TAGS[m.type] || m.type}</td>
                      <td>
                        <span className={`badge ${isPresent ? (m.isLate ? 'badge-warning' : 'badge-success') : 'badge-danger'}`}>
                          {isPresent ? (m.isLate ? 'મોડા' : 'હાજર') : 'ગેરહાજર'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>
                        {m.arrivalTime ? new Date(m.arrivalTime).toLocaleTimeString('gu-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td style={{ fontStyle: 'italic', color: 'var(--color-warning)' }}>
                        {m.remark || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="empty-state" style={{ padding: '36px 20px' }}>
          <div className="empty-state-icon" style={{ width: 48, height: 48 }}>
            <Calendar size={22} />
          </div>
          <p className="empty-state-title" style={{ fontSize: '0.9rem' }}>સભા પસંદ કરો</p>
          <p className="empty-state-desc" style={{ marginBottom: 0 }}>ઉપરના ડ્રોપડાઉનમાંથી સભા પસંદ કરવાથી સંપૂર્ણ રિપોર્ટ અહીં દેખાશે.</p>
        </div>
      )}
    </div>
  );
}
