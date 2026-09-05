import React from 'react';
import { X } from 'lucide-react';
import { SpinnerLoader } from '../Loaders';

export default function EventModal({
  isOpen,
  onClose,
  onSubmit,
  editingEventId,
  eventDate,
  setEventDate,
  eventMinReachTimeText,
  setEventMinReachTimeText,
  eventMinReachTimePeriod,
  setEventMinReachTimePeriod,
  loading
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-panel" style={{ maxWidth: 450 }}>
        <div className="modal-header">
          <h3 className="modal-title">
            {editingEventId ? 'સભા વિગતો સુધારો' : 'નવી રવિસભા આયોજિત કરો'}
          </h3>
          <button
            className="icon-btn"
            onClick={onClose}
            aria-label="બંધ કરો"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="form-label">સભાની તારીખ (Date)</label>
            <input
              type="date"
              className="glass-input"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="form-label">
              પહોંચવાનો સમય મર્યાદા (Deadline Reach Time)
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="text"
                className="glass-input"
                style={{ flex: 2 }}
                placeholder="ઉદા. 10:00"
                pattern="^(0?[1-9]|1[0-2]):[0-5][0-9]$"
                title="કૃપા કરીને ૧૨ કલાકના ફોર્મેટમાં લખો (HH:MM), જેમ કે 10:00 કે 08:30"
                value={eventMinReachTimeText}
                onChange={(e) => setEventMinReachTimeText(e.target.value)}
                required
              />
              <select
                className="glass-input"
                style={{ flex: 1, cursor: 'pointer' }}
                value={eventMinReachTimePeriod}
                onChange={(e) => setEventMinReachTimePeriod(e.target.value)}
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
            <span className="form-hint">
              આ સમય પછી હાજરી પૂરનાર સભ્યોને મોડા (Late) ગણવામાં આવશે અને નોંધ (Remark) પૂછવામાં આવશે. (૧૨ કલાક ફોર્મેટ, ઉદા. 10:00 PM)
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn-secondary" onClick={onClose}>રદ કરો</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <SpinnerLoader size={16} /> : 'સાચવો'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
