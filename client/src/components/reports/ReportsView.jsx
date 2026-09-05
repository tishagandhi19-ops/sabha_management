import React from 'react';
import DashboardReports from './DashboardReports';
import MemberProfileReport from './MemberProfileReport';
import LeaderboardReport from './LeaderboardReport';
import ParticularEventReport from './ParticularEventReport';

export default function ReportsView({
  dashboardStats,
  reportsSubTab,
  setReportsSubTab,
  members,
  reportSearch,
  setReportSearch,
  selectedMemberReport,
  loadingMemberReport,
  onSelectMemberReport,
  topAttendeesData,
  loadingTopAttendees,
  leaderboardTypeFilter,
  setLeaderboardTypeFilter,
  onPrintLeaderboard,
  fetchTopAttendees,
  events,
  selectedParticularEventId,
  setSelectedParticularEventId,
  loadingParticularEvent,
  particularEventReport,
  onPrintParticularEvent
}) {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Main stats overview */}
      <DashboardReports dashboardStats={dashboardStats} />

      {/* Sub Tab Navigation for Reports */}
      <div className="segmented-control" style={{ justifySelf: 'stretch' }}>
        <button
          className={`segmented-button ${reportsSubTab === 'profile' ? 'active' : ''}`}
          onClick={() => setReportsSubTab('profile')}
        >
          સભ્યો પ્રોગ્રેસ
        </button>
        <button
          className={`segmented-button ${reportsSubTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => {
            setReportsSubTab('leaderboard');
            fetchTopAttendees();
          }}
        >
          શ્રેષ્ઠ સભ્યો (ટોપ ૧૦)
        </button>
        <button
          className={`segmented-button ${reportsSubTab === 'particular' ? 'active' : ''}`}
          onClick={() => setReportsSubTab('particular')}
        >
          સભા વાર વિગત
        </button>
      </div>

      {/* Sub Tab 1: Member Profile Progress */}
      {reportsSubTab === 'profile' && (
        <MemberProfileReport
          members={members}
          reportSearch={reportSearch}
          setReportSearch={setReportSearch}
          selectedMemberReport={selectedMemberReport}
          loadingMemberReport={loadingMemberReport}
          onSelectMember={onSelectMemberReport}
        />
      )}

      {/* Sub Tab 2: Leaderboard */}
      {reportsSubTab === 'leaderboard' && (
        <LeaderboardReport
          topAttendeesData={topAttendeesData}
          loadingTopAttendees={loadingTopAttendees}
          leaderboardTypeFilter={leaderboardTypeFilter}
          setLeaderboardTypeFilter={setLeaderboardTypeFilter}
          onPrintLeaderboard={onPrintLeaderboard}
          onRetry={fetchTopAttendees}
        />
      )}

      {/* Sub Tab 3: Particular Sabha Report */}
      {reportsSubTab === 'particular' && (
        <ParticularEventReport
          events={events}
          selectedParticularEventId={selectedParticularEventId}
          setSelectedParticularEventId={setSelectedParticularEventId}
          loadingParticularEvent={loadingParticularEvent}
          particularEventReport={particularEventReport}
          members={members}
          onPrintParticularEvent={onPrintParticularEvent}
        />
      )}
    </div>
  );
}
