import React from 'react';
import { Search, X, FileSpreadsheet, UserPlus, Users, Edit, Trash2 } from 'lucide-react';
import { SkeletonCard } from '../Loaders';
import { CATEGORY_LABELS, CATEGORY_TAGS } from '../../constants/sabhaConstants';
import { sortMembersBySearchRank } from '../../utils/searchRank';

export default function MembersView({
  members,
  loadingMembers,
  memberSearch,
  setMemberSearch,
  memberTypeFilter,
  setMemberTypeFilter,
  onOpenAddMember,
  onOpenBulkModal,
  onEditMember,
  onDeleteMember
}) {
  const filteredMembers = (members || []).filter(member => {
    const q = (memberSearch || '').trim().toLowerCase();
    const matchesSearch = !q ||
      (member.name && member.name.toLowerCase().includes(q)) ||
      (member.nameEn && member.nameEn.toLowerCase().includes(q)) ||
      (member.uniqueCode && member.uniqueCode.toLowerCase().includes(q)) ||
      (member.mobileNumber && member.mobileNumber.toString().includes(q));

    const matchesType = !memberTypeFilter || memberTypeFilter === 'all' || member.type === memberTypeFilter;

    return matchesSearch && matchesType;
  });

  const displayList = sortMembersBySearchRank(filteredMembers, memberSearch);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Controls bar */}
      <div className="glass-panel controls-bar" style={{ padding: 20 }}>
        <div className="search-filter-group">
          <div className="search-field" style={{ minWidth: 200 }}>
            <Search className="search-icon" size={18} />
            <input
              type="text"
              className="glass-input"
              placeholder="નામ અથવા યુનિક કોડથી સર્ચ કરો..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
            />
            {memberSearch && (
              <button
                className="icon-btn"
                style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, minWidth: 32 }}
                onClick={() => setMemberSearch('')}
                aria-label="સર્ચ સાફ કરો"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <select
            className="glass-input"
            style={{ maxWidth: 200, width: 'auto', flex: '0 1 auto' }}
            value={memberTypeFilter}
            onChange={(e) => setMemberTypeFilter(e.target.value)}
            aria-label="સભ્ય પ્રકાર ફિલ્ટર"
          >
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <div className="action-btn-group">
          <button className="btn-secondary" onClick={onOpenBulkModal}>
            <FileSpreadsheet size={16} /> સભ્ય બલ્ક
          </button>

          <button className="btn-primary" onClick={onOpenAddMember}>
            <UserPlus size={16} /> સભ્ય ઉમેરો
          </button>
        </div>
      </div>

      {/* Members List Grid */}
      {loadingMembers ? (
        <div className="grid-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : displayList.length === 0 ? (
        <div className="glass-panel empty-state">
          <div className="empty-state-icon">
            <Users size={28} />
          </div>
          <p className="empty-state-title">કોઈ સભ્ય મળ્યો નથી</p>
          <p className="empty-state-desc">સર્ચ/ફિલ્ટર બદલો અથવા નવો સભ્ય ઉમેરો.</p>
          <button className="btn-primary" onClick={onOpenAddMember}>
            <UserPlus size={16} /> સભ્ય ઉમેરો
          </button>
        </div>
      ) : (
        <div className="grid-3">
          {displayList.map(member => (
            <div key={member._id} className="glass-panel glass-panel-hover" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <span className="badge badge-primary">
                    {CATEGORY_TAGS[member.type]}
                  </span>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: 8, overflowWrap: 'anywhere' }}>{member.name}</h3>
                  {member.nameEn && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                      {member.nameEn}
                    </p>
                  )}
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 2, fontFamily: 'monospace' }}>
                    કોડ: {member.uniqueCode}
                  </p>
                  {member.mobileNumber && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                      મોબાઈલ: <span style={{ fontWeight: 600 }}>{member.mobileNumber}</span>
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button
                    className="icon-btn"
                    onClick={() => onEditMember(member)}
                    title="સુધારો"
                    aria-label={`${member.name} સુધારો`}
                  >
                    <Edit size={15} />
                  </button>
                  <button
                    className="icon-btn icon-btn-danger"
                    onClick={() => onDeleteMember(member._id)}
                    title="ડીલીટ"
                    aria-label={`${member.name} ડીલીટ`}
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
