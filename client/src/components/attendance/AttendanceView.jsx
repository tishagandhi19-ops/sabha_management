import React from 'react';
import { Calendar, Search, Plus, Edit, Trash2, Clock, X } from 'lucide-react';
import { SkeletonCard } from '../Loaders';
import { formatTime12h } from '../../constants/sabhaConstants';

export default function AttendanceView({
  events,
  loadingEvents,
  eventSearch,
  setEventSearch,
  onSelectEvent,
  onOpenCreateEvent,
  onOpenEditEvent,
  onRequestDeleteEvent
}) {
  const filteredEvents = events
    .filter(e => !e.type || e.type === 'ravi_sabha')
    .filter(e => {
      const formattedDate = new Date(e.date).toLocaleDateString('gu-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
      return !eventSearch.trim() || formattedDate.toLowerCase().includes(eventSearch.trim().toLowerCase());
    });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>રવિસભા</h2>
        <button className="btn-primary" onClick={onOpenCreateEvent}>
          <Plus size={18} /> નવી સભા
        </button>
      </div>

      <div className="glass-panel animate-fade-in" style={{ padding: 24, minHeight: '600px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>સભા ઈતિહાસ (રવિસભા)</h3>
          <div className="search-field" style={{ minWidth: 250, maxWidth: '100%', flex: 1 }}>
            <Search className="search-icon" size={18} />
            <input
              type="text"
              className="glass-input"
              placeholder="તારીખ શોધો..."
              value={eventSearch}
              onChange={(e) => setEventSearch(e.target.value)}
            />
            {eventSearch && (
              <button
                className="icon-btn"
                style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, minWidth: 32 }}
                onClick={() => setEventSearch('')}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {loadingEvents ? (
          <div className="grid-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              {eventSearch ? <Search size={28} /> : <Calendar size={28} />}
            </div>
            <p className="empty-state-title">કોઈ સભા મળી નથી</p>
            {!eventSearch && <p className="empty-state-desc">ઉપરના બટનથી નવી સભા આયોજિત કરો.</p>}
          </div>
        ) : (
          <div className="grid-3">
            {filteredEvents.map(event => {
              const formattedDate = new Date(event.date).toLocaleDateString('gu-IN', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
              });

              return (
                <div
                  key={event._id}
                  className="glass-card glass-panel-hover"
                  onClick={() => onSelectEvent(event._id)}
                  style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 12, padding: 20 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 6 }}>{formattedDate}</p>
                      {event.minReachTime && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={14} /> સમય: {formatTime12h(event.minReachTime)} સુધીમાં
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button
                        className="icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenEditEvent(event);
                        }}
                        title="સુધારો"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRequestDeleteEvent(event);
                        }}
                        title="રદ કરો"
                        style={{ color: 'var(--color-danger)' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
