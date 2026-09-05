import React from 'react';
import { Search, X, FileSpreadsheet, UserPlus, Users, Edit, Trash2 } from 'lucide-react';
import { SkeletonCard } from '../Loaders';
import { SEVA_CATEGORY_TAGS } from '../../constants/sabhaConstants';
import { sortMembersBySearchRank } from '../../utils/searchRank';
import { transliterateGujaratiToEnglish } from '../../utils/transliterate';

export default function SevaMembersView({
  sevaMembers,
  loadingSevaMembers,
  sevaMemberSearch,
  setSevaMemberSearch,
  sevaMemberTypeFilter,
  setSevaMemberTypeFilter,
  onOpenAddSevaMember,
  onOpenBulkSevaMemberModal,
  onEditSevaMember,
  onDeleteSevaMember
}) {
  const filtered = sevaMembers.filter(m => {
    const q = sevaMemberSearch.toLowerCase();
    const matchesSearch = !sevaMemberSearch.trim() ||
      m.name.toLowerCase().includes(q) ||
      (m.nameEn && m.nameEn.toLowerCase().includes(q)) ||
      (m.uniqueCode && m.uniqueCode.toLowerCase().includes(q)) ||
      (m.mobileNumber && m.mobileNumber.includes(q));
    const matchesType = sevaMemberTypeFilter === 'all' || m.type === sevaMemberTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="panel-header">
        <div>
          <h2 className="panel-title">સેવા સભ્યો સંચાલન</h2>
          <p className="panel-subtitle">
            સેવા માટે નોંધાયેલા તમામ સભ્યોની યાદી ({sevaMembers.length} સભ્યો)
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            className="btn-secondary"
            onClick={onOpenBulkSevaMemberModal}
          >
            <FileSpreadsheet size={16} /> સભ્યો બલ્ક અપલોડ
          </button>
          <button
            className="btn-primary"
            onClick={onOpenAddSevaMember}
          >
            <UserPlus size={16} /> નવો સેવા સભ્ય ઉમેરો
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-field" style={{ minWidth: 220 }}>
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="glass-input"
            placeholder="સભ્યનું નામ અથવા યુનિક કોડથી શોધો..."
            value={sevaMemberSearch}
            onChange={(e) => setSevaMemberSearch(e.target.value)}
          />
          {sevaMemberSearch && (
            <button
              className="icon-btn"
              style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, minWidth: 32 }}
              onClick={() => setSevaMemberSearch('')}
              aria-label="સર્ચ સાફ કરો"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <select
          className="glass-input"
          style={{ width: 180, flex: '0 0 auto' }}
          value={sevaMemberTypeFilter}
          onChange={(e) => setSevaMemberTypeFilter(e.target.value)}
          aria-label="સેવા સભ્ય પ્રકાર ફિલ્ટર"
        >
          <option value="all">બધા પ્રકારો</option>
          <option value="kisori">કિશોરી</option>
          <option value="yuvti">યુવતી</option>
          <option value="prutha">પ્રૌઢા</option>
          <option value="vadil">વડીલ</option>
        </select>
      </div>

      {/* Members Grid layout */}
      {loadingSevaMembers ? (
        <div className="grid-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel empty-state">
          <div className="empty-state-icon">
            <Search size={28} />
          </div>
          <p className="empty-state-title">કોઈ સભ્ય મળ્યો નથી</p>
        </div>
      ) : (
        <div className="grid-3">
          {sortMembersBySearchRank(filtered, sevaMemberSearch).map(m => (
            <div key={m._id} className="glass-panel glass-panel-hover" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <span className="badge badge-primary">
                    {SEVA_CATEGORY_TAGS[m.type] || m.type}
                  </span>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: 8, overflowWrap: 'anywhere' }}>{m.name}</h3>
                  {m.nameEn && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                      {m.nameEn}
                    </p>
                  )}
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 2, fontFamily: 'monospace' }}>
                    કોડ: {m.uniqueCode}
                  </p>
                  {m.mobileNumber && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                      મોબાઈલ: <span style={{ fontWeight: 600 }}>{m.mobileNumber}</span>
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button
                    className="icon-btn"
                    title="સુધારો"
                    aria-label={`${m.name} સુધારો`}
                    onClick={() => onEditSevaMember(m)}
                  >
                    <Edit size={15} />
                  </button>
                  <button
                    className="icon-btn icon-btn-danger"
                    title="કાઢી નાખો"
                    aria-label={`${m.name} કાઢી નાખો`}
                    onClick={() => onDeleteSevaMember(m._id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
