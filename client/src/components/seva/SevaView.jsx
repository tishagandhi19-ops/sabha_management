import React from 'react';
import { Calendar, Search, Plus, Trash2, Heart, X } from 'lucide-react';
import { SkeletonCard } from '../Loaders';
import SevaAttendanceSheet from './SevaAttendanceSheet';
import SevaMembersView from './SevaMembersView';
import SevaReportsView from './SevaReportsView';

export default function SevaView({
  // Active Navigation
  sevaModuleTab,
  selectedSevaId,
  setSelectedSevaId,

  // Seva List State & Handlers
  sevas,
  loadingSevas,
  sevaSearch,
  setSevaSearch,
  onOpenCreateSeva,
  onDeleteSeva,
  onSelectSeva,

  // Active Seva Attendance Sheet Props
  activeSevaData,
  loadingSevaAttendance,
  sevaMembers,
  loadingSevaMembers,
  sevaAttendanceRecords,
  savingSevaAttendance,
  sevaAttendanceSearch,
  setSevaAttendanceSearch,
  hasSevaDraft,
  sevaDraftCount,
  onSaveSevaAttendance,
  onDiscardSevaDraft,
  toggleSevaAttendanceStatus,
  handleSevaHoursChange,

  // Seva Members View Props
  sevaMemberSearch,
  setSevaMemberSearch,
  sevaMemberTypeFilter,
  setSevaMemberTypeFilter,
  onOpenAddSevaMember,
  onOpenBulkSevaMemberModal,
  onEditSevaMember,
  onDeleteSevaMember,

  // Seva Reports View Props
  sevaTypes,
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
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Module 1: Seva Attendance */}
      {sevaModuleTab === 'attendance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {!selectedSevaId ? (
            <div className="glass-panel animate-fade-in" style={{ padding: 24, minHeight: '600px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>સેવા ઈતિહાસ</h3>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
                  <div className="search-field" style={{ minWidth: 250, maxWidth: '100%', flex: '0 1 auto' }}>
                    <Search className="search-icon" size={18} />
                    <input
                      type="text"
                      className="glass-input"
                      placeholder="તારીખ અથવા સેવા પ્રકાર શોધો..."
                      value={sevaSearch}
                      onChange={(e) => setSevaSearch(e.target.value)}
                    />
                    {sevaSearch && (
                      <button
                        className="icon-btn"
                        style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, minWidth: 32 }}
                        onClick={() => setSevaSearch('')}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  <button
                    className="btn-primary"
                    onClick={onOpenCreateSeva}
                  >
                    <Plus size={18} /> નવી સેવા આયોજિત કરો
                  </button>
                </div>
              </div>

              {loadingSevas ? (
                <div className="grid-3">
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              ) : sevas.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <Calendar size={28} />
                  </div>
                  <p className="empty-state-title">કોઈ સેવા મળી નથી</p>
                  <p className="empty-state-desc">નવી સેવા આયોજિત કરવા માટે ઉપરના બટન પર ક્લિક કરો.</p>
                </div>
              ) : (() => {
                const filteredSevas = sevas.filter(seva => {
                  const formattedDate = new Date(seva.date).toLocaleDateString('gu-IN', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                  });
                  const typeName = seva.sevaType ? seva.sevaType.name.toLowerCase() : '';
                  const leaderName = seva.leader ? seva.leader.toLowerCase() : '';
                  if (!sevaSearch.trim()) return true;
                  const query = sevaSearch.trim().toLowerCase();
                  return formattedDate.toLowerCase().includes(query) || typeName.includes(query) || leaderName.includes(query);
                });

                if (filteredSevas.length === 0) {
                  return (
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <Search size={28} />
                      </div>
                      <p className="empty-state-title">કોઈ સેવા મળી નથી</p>
                    </div>
                  );
                }

                return (
                  <div className="grid-3">
                    {filteredSevas.map(seva => {
                      const formattedDate = new Date(seva.date).toLocaleDateString('gu-IN', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                      });
                      const typeName = seva.sevaType ? seva.sevaType.name : 'સેવા';

                      return (
                        <div
                          key={seva._id}
                          className="glass-card glass-panel-hover"
                          onClick={() => onSelectSeva(seva._id)}
                          style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 12, padding: 20 }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 6 }}>{formattedDate}</p>
                              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Heart size={14} /> પ્રકાર: {typeName}
                              </p>
                              {seva.leader && (
                                <p style={{ fontSize: '0.85rem', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                                  લીડર: {seva.leader}
                                </p>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                              <button
                                className="icon-btn icon-btn-danger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteSeva(seva._id);
                                }}
                                title="રદ કરો"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          ) : (
            <SevaAttendanceSheet
              activeSevaData={activeSevaData}
              loadingSevaAttendance={loadingSevaAttendance}
              sevaMembers={sevaMembers}
              sevaAttendanceRecords={sevaAttendanceRecords}
              savingSevaAttendance={savingSevaAttendance}
              sevaAttendanceSearch={sevaAttendanceSearch}
              setSevaAttendanceSearch={setSevaAttendanceSearch}
              hasSevaDraft={hasSevaDraft}
              sevaDraftCount={sevaDraftCount}
              onBack={() => setSelectedSevaId(null)}
              onSaveSevaAttendance={onSaveSevaAttendance}
              onDiscardSevaDraft={onDiscardSevaDraft}
              toggleSevaAttendanceStatus={toggleSevaAttendanceStatus}
              handleSevaHoursChange={handleSevaHoursChange}
            />
          )}
        </div>
      )}

      {/* Module 2: Seva Member Management */}
      {sevaModuleTab === 'members' && (
        <SevaMembersView
          sevaMembers={sevaMembers}
          loadingSevaMembers={loadingSevaMembers}
          sevaMemberSearch={sevaMemberSearch}
          setSevaMemberSearch={setSevaMemberSearch}
          sevaMemberTypeFilter={sevaMemberTypeFilter}
          setSevaMemberTypeFilter={setSevaMemberTypeFilter}
          onOpenAddSevaMember={onOpenAddSevaMember}
          onOpenBulkSevaMemberModal={onOpenBulkSevaMemberModal}
          onEditSevaMember={onEditSevaMember}
          onDeleteSevaMember={onDeleteSevaMember}
        />
      )}

      {/* Module 3: Seva Reports */}
      {sevaModuleTab === 'reports' && (
        <SevaReportsView
          sevas={sevas}
          sevaTypes={sevaTypes}
          sevaMembers={sevaMembers}
          sevaReportsData={sevaReportsData}
          sevaReportsSubTab={sevaReportsSubTab}
          setSevaReportsSubTab={setSevaReportsSubTab}
          sevaMemberReportSearch={sevaMemberReportSearch}
          setSevaMemberReportSearch={setSevaMemberReportSearch}
          selectedSevaMemberReport={selectedSevaMemberReport}
          loadingSevaMemberReport={loadingSevaMemberReport}
          onSelectSevaMemberReport={onSelectSevaMemberReport}
          sevaTypeLeaderboardData={sevaTypeLeaderboardData}
          loadingSevaTypeLeaderboard={loadingSevaTypeLeaderboard}
          onPrintSevaLeaderboard={onPrintSevaLeaderboard}
          selectedParticularSevaId={selectedParticularSevaId}
          setSelectedParticularSevaId={setSelectedParticularSevaId}
          loadingParticularSeva={loadingParticularSeva}
          particularSevaReport={particularSevaReport}
          onPrintParticularSeva={onPrintParticularSeva}
          fetchSevaReports={fetchSevaReports}
        />
      )}
    </div>
  );
}
