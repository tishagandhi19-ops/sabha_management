import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useAttendanceDraft } from './hooks/useAttendanceDraft';
import InstallPWA from './components/InstallPWA';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import Login from './components/Login';
import AttendanceView from './components/attendance/AttendanceView';
import AttendanceSheet from './components/attendance/AttendanceSheet';
import MembersView from './components/members/MembersView';
import MemberModal from './components/members/MemberModal';
import BulkMemberModal from './components/members/BulkMemberModal';
import ReportsView from './components/reports/ReportsView';
import PrintModal from './components/reports/PrintModal';
import EventModal from './components/events/EventModal';
import ConfirmModal from './components/common/ConfirmModal';
import SevaView from './components/seva/SevaView';
import {
  SevaModal,
  SevaTypeModal,
  SevaMemberModal,
  BulkSevaMemberModal
} from './components/seva/SevaModals';
import {
  parseExcelMembers
} from './constants/sabhaConstants';
import { transliterateGujaratiToEnglish } from './utils/transliterate';
import { transliterateEnglishToGujarati } from './utils/englishToGujarati';

function AppContent() {
  const { token, user, login, logout, apiRequest, loading: authLoading, error: authError } = useAuth();

  // Tab State: 'attendance' | 'members' | 'reports' | 'seva'
  const [activeTab, setActiveTab] = useState('attendance');

  // Seva States
  const [sevas, setSevas] = useState([]);
  const [sevaTypes, setSevaTypes] = useState([]);
  const [loadingSevas, setLoadingSevas] = useState(false);
  const [loadingSevaTypes, setLoadingSevaTypes] = useState(false);
  const [showSevaModal, setShowSevaModal] = useState(false);
  const [showSevaTypeModal, setShowSevaTypeModal] = useState(false);

  // New Seva Form State
  const [sevaDate, setSevaDate] = useState(new Date().toISOString().split('T')[0]);
  const [sevaTypeId, setSevaTypeId] = useState('');
  const [sevaLeader, setSevaLeader] = useState('');
  const [creatingSeva, setCreatingSeva] = useState(false);
  const [newSevaTypeNameInput, setNewSevaTypeNameInput] = useState('');

  // New Seva Type Form State
  const [newSevaTypeName, setNewSevaTypeName] = useState('');
  const [creatingSevaType, setCreatingSevaType] = useState(false);

  // Active Seva Attendance State
  const [selectedSevaId, setSelectedSevaId] = useState(null);
  const [activeSevaData, setActiveSevaData] = useState(null);
  const [sevaAttendanceRecords, setSevaAttendanceRecords] = useState({});
  const [savingSevaAttendance, setSavingSevaAttendance] = useState(false);
  const [sevaAttendanceSearch, setSevaAttendanceSearch] = useState('');
  const [sevaSearch, setSevaSearch] = useState('');

  // Seva Reports State
  const [sevaModuleTab, setSevaModuleTab] = useState('attendance'); // 'attendance' | 'members' | 'reports'
  const [sevaReportsSubTab, setSevaReportsSubTab] = useState('profile'); // 'profile' | 'leaderboard' | 'particular'
  const [selectedSevaMemberReport, setSelectedSevaMemberReport] = useState(null);
  const [loadingSevaMemberReport, setLoadingSevaMemberReport] = useState(false);
  const [selectedParticularSevaId, setSelectedParticularSevaId] = useState('');
  const [particularSevaReport, setParticularSevaReport] = useState(null);
  const [loadingParticularSeva, setLoadingParticularSeva] = useState(false);
  const [sevaReportsData, setSevaReportsData] = useState([]);
  const [sevaTypeLeaderboardData, setSevaTypeLeaderboardData] = useState([]);
  const [loadingSevaTypeLeaderboard, setLoadingSevaTypeLeaderboard] = useState(false);
  const [sevaMemberReportSearch, setSevaMemberReportSearch] = useState('');

  // App Global Data State
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);

  // Screen Loaders State
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingEventAttendance, setLoadingEventAttendance] = useState(false);
  const [loadingSevaAttendance, setLoadingSevaAttendance] = useState(false);

  // Active Attendance Module State (Ravi Sabha)
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [activeEventData, setActiveEventData] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [attendanceProgress, setAttendanceProgress] = useState(0);
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [eventSearch, setEventSearch] = useState('');
  const [displayMembers, setDisplayMembers] = useState([]);
  const [eventToDelete, setEventToDelete] = useState(null);

  // Refs for Draft Persistence
  const loadedEventIdRef = useRef(null);
  const loadedSevaIdRef = useRef(null);
  const dbSabhaRecordsRef = useRef({});
  const dbSevaRecordsRef = useRef({});

  // Local Draft Persistence Hooks
  const {
    hasDraft: hasSabhaDraft,
    draftCount: sabhaDraftCount,
    saveDraft: saveSabhaDraft,
    clearDraft: clearSabhaDraft
  } = useAttendanceDraft('sabha', selectedEventId);

  const {
    hasDraft: hasSevaDraft,
    draftCount: sevaDraftCount,
    saveDraft: saveSevaDraft,
    clearDraft: clearSevaDraft
  } = useAttendanceDraft('seva', selectedSevaId);

  // Auto-save drafts when changed
  useEffect(() => {
    if (selectedEventId && loadedEventIdRef.current === selectedEventId && Object.keys(attendanceRecords).length > 0) {
      saveSabhaDraft(attendanceRecords, dbSabhaRecordsRef.current);
    }
  }, [attendanceRecords, selectedEventId, saveSabhaDraft]);

  useEffect(() => {
    if (selectedSevaId && loadedSevaIdRef.current === selectedSevaId && Object.keys(sevaAttendanceRecords).length > 0) {
      saveSevaDraft(sevaAttendanceRecords, dbSevaRecordsRef.current);
    }
  }, [sevaAttendanceRecords, selectedSevaId, saveSevaDraft]);

  // Reports states
  const [reportsSubTab, setReportsSubTab] = useState('profile');
  const [reportSearch, setReportSearch] = useState('');
  const [selectedMemberReport, setSelectedMemberReport] = useState(null);
  const [loadingMemberReport, setLoadingMemberReport] = useState(false);
  const [topAttendeesData, setTopAttendeesData] = useState(null);
  const [loadingTopAttendees, setLoadingTopAttendees] = useState(false);
  const [leaderboardTypeFilter, setLeaderboardTypeFilter] = useState('all');
  const [selectedParticularEventId, setSelectedParticularEventId] = useState('');
  const [particularEventReport, setParticularEventReport] = useState(null);
  const [loadingParticularEvent, setLoadingParticularEvent] = useState(false);
  const [printData, setPrintData] = useState(null);

  // Event Creation Dialog State
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventMinReachTimeText, setEventMinReachTimeText] = useState('10:00');
  const [eventMinReachTimePeriod, setEventMinReachTimePeriod] = useState('AM');
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);

  // Member CRUD Dialog State
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [memberName, setMemberName] = useState('');
  const [memberEnName, setMemberEnName] = useState('');
  const [memberType, setMemberType] = useState('yuva');
  const [memberCode, setMemberCode] = useState('');
  const [memberMobileNumber, setMemberMobileNumber] = useState('');
  const [bulkImportTab, setBulkImportTab] = useState('excel');
  const [parsedExcelMembers, setParsedExcelMembers] = useState([]);
  const [excelFileName, setExcelFileName] = useState('');
  const [submittingMember, setSubmittingMember] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberTypeFilter, setMemberTypeFilter] = useState('all');

  // Bulk Upload State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkImportProgress, setBulkImportProgress] = useState(0);
  const [importingBulk, setImportingBulk] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  // Seva Member CRUD State
  const [sevaMembers, setSevaMembers] = useState([]);
  const [loadingSevaMembers, setLoadingSevaMembers] = useState(false);
  const [showSevaMemberModal, setShowSevaMemberModal] = useState(false);
  const [editingSevaMember, setEditingSevaMember] = useState(null);
  const [sevaMemberName, setSevaMemberName] = useState('');
  const [sevaMemberEnName, setSevaMemberEnName] = useState('');
  const [sevaMemberType, setSevaMemberType] = useState('yuvti');
  const [sevaMemberUniqueCode, setSevaMemberUniqueCode] = useState('');
  const [sevaMemberMobileNumber, setSevaMemberMobileNumber] = useState('');
  const [bulkSevaImportTab, setBulkSevaImportTab] = useState('excel');
  const [parsedExcelSevaMembers, setParsedExcelSevaMembers] = useState([]);
  const [excelSevaFileName, setExcelSevaFileName] = useState('');
  const [submittingSevaMember, setSubmittingSevaMember] = useState(false);
  const [sevaMemberSearch, setSevaMemberSearch] = useState('');
  const [sevaMemberTypeFilter, setSevaMemberTypeFilter] = useState('all');

  // Bulk Upload Seva State
  const [showBulkSevaMemberModal, setShowBulkSevaMemberModal] = useState(false);
  const [bulkSevaMemberText, setBulkSevaMemberText] = useState('');
  const [bulkSevaImportProgress, setBulkSevaImportProgress] = useState(0);
  const [importingBulkSeva, setImportingBulkSeva] = useState(false);
  const [bulkSevaMemberResult, setBulkSevaMemberResult] = useState(null);

  // Delete Confirm Modal State
  const [confirmDeleteModal, setConfirmDeleteModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    loading: false
  });

  // UI Toast State
  const [notification, setNotification] = useState(null);

  const triggerNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const isSevaUser = user?.role === 'seva_admin';

  // Initial Data Fetch
  useEffect(() => {
    if (token) {
      if (user?.role === 'seva_admin') {
        setActiveTab('seva');
      } else {
        setActiveTab('attendance');
      }
      fetchMembers();
      fetchEvents();
      fetchDashboardStats();
      fetchSevas();
      fetchSevaTypes();
      fetchSevaMembers();
    }
  }, [token, user]);

  useEffect(() => {
    if (members.length > 0) {
      setDisplayMembers([...members]);
    }
  }, [members]);

  useEffect(() => {
    if (activeTab === 'seva' && sevaModuleTab === 'reports' && sevaReportsSubTab === 'particular' && selectedParticularSevaId) {
      fetchParticularSevaReport(selectedParticularSevaId);
    }
  }, [activeTab, sevaModuleTab, sevaReportsSubTab, selectedParticularSevaId]);

  useEffect(() => {
    if (activeTab === 'reports' && reportsSubTab === 'leaderboard') {
      fetchTopAttendees();
    }
  }, [activeTab, reportsSubTab, leaderboardTypeFilter]);

  useEffect(() => {
    if (activeTab === 'reports' && reportsSubTab === 'particular' && selectedParticularEventId) {
      fetchParticularEventReport(selectedParticularEventId);
    }
  }, [activeTab, reportsSubTab, selectedParticularEventId]);

  // Auth Submit
  const handleLoginSubmit = async (username, password) => {
    try {
      await login(username, password);
    } catch (err) {
      // Handled in AuthContext
    }
  };

  // Fetch functions
  const fetchMembers = async () => {
    setLoadingMembers(true);
    try {
      const data = await apiRequest('/members');
      setMembers(data || []);
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setLoadingMembers(false);
    }
  };

  const fetchEvents = async () => {
    setLoadingEvents(true);
    try {
      const data = await apiRequest('/events');
      setEvents(data || []);
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const data = await apiRequest('/reports/dashboard');
      setDashboardStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTopAttendees = async () => {
    setLoadingTopAttendees(true);
    try {
      const query = leaderboardTypeFilter !== 'all' ? `?type=${leaderboardTypeFilter}` : '';
      const data = await apiRequest(`/reports/top-attendees${query}`);
      setTopAttendeesData(data);
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setLoadingTopAttendees(false);
    }
  };

  const fetchParticularEventReport = async (eventId) => {
    if (!eventId) return;
    setLoadingParticularEvent(true);
    try {
      const data = await apiRequest(`/events/${eventId}`);
      setParticularEventReport(data);
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setLoadingParticularEvent(false);
    }
  };

  const loadMemberReport = async (memberId) => {
    setLoadingMemberReport(true);
    try {
      const data = await apiRequest(`/reports/member/${memberId}`);
      setSelectedMemberReport(data);
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setLoadingMemberReport(false);
    }
  };

  // Seva Fetch Functions
  const fetchSevas = async () => {
    setLoadingSevas(true);
    try {
      const data = await apiRequest('/sevas');
      setSevas(data || []);
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setLoadingSevas(false);
    }
  };

  const fetchSevaTypes = async () => {
    setLoadingSevaTypes(true);
    try {
      const data = await apiRequest('/sevas/types');
      setSevaTypes(data || []);
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setLoadingSevaTypes(false);
    }
  };

  const fetchSevaMembers = async () => {
    setLoadingSevaMembers(true);
    try {
      const data = await apiRequest('/sevas/members');
      setSevaMembers(data || []);
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setLoadingSevaMembers(false);
    }
  };

  const fetchSevaReports = async () => {
    try {
      const data = await apiRequest('/sevas/reports/summary');
      setSevaReportsData(data || []);
    } catch (err) {
      console.error(err);
    }

    setLoadingSevaTypeLeaderboard(true);
    try {
      const leaderboard = await apiRequest('/sevas/reports/leaderboard');
      setSevaTypeLeaderboardData(leaderboard || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSevaTypeLeaderboard(false);
    }
  };

  const loadSevaMemberReport = async (memberId) => {
    setLoadingSevaMemberReport(true);
    try {
      const data = await apiRequest(`/sevas/reports/member/${memberId}`);
      setSelectedSevaMemberReport(data);
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setLoadingSevaMemberReport(false);
    }
  };

  const fetchParticularSevaReport = async (sevaId) => {
    if (!sevaId) return;
    setLoadingParticularSeva(true);
    try {
      const data = await apiRequest(`/sevas/${sevaId}`);
      setParticularSevaReport(data);
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setLoadingParticularSeva(false);
    }
  };

  // Event Handlers
  const handleSaveEvent = async (e) => {
    e.preventDefault();
    setCreatingEvent(true);
    try {
      let time24 = '';
      if (eventMinReachTimeText && eventMinReachTimeText.trim()) {
        const [hStr, mStr] = eventMinReachTimeText.trim().split(':');
        let hours = parseInt(hStr, 10);
        if (eventMinReachTimePeriod === 'PM' && hours < 12) hours += 12;
        if (eventMinReachTimePeriod === 'AM' && hours === 12) hours = 0;
        time24 = `${String(hours).padStart(2, '0')}:${mStr || '00'}`;
      }

      const body = {
        date: eventDate,
        type: 'ravi_sabha',
        minReachTime: time24
      };

      if (editingEventId) {
        await apiRequest(`/events/${editingEventId}`, 'PUT', body);
        triggerNotification('સભા વિગતો સફળતાપૂર્વક સુધારાઈ છે');
      } else {
        await apiRequest('/events', 'POST', body);
        triggerNotification('નવી સભા સફળતાપૂર્વક ઉમેરાઈ છે');
      }

      setShowEventModal(false);
      setEditingEventId(null);
      fetchEvents();
      fetchDashboardStats();
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setCreatingEvent(false);
    }
  };

  const confirmDeleteEventAction = async () => {
    if (!eventToDelete) return;
    try {
      await apiRequest(`/events/${eventToDelete._id}`, 'DELETE');
      triggerNotification('સભા સફળતાપૂર્વક રદ કરવામાં આવી છે');
      setEventToDelete(null);
      fetchEvents();
      fetchDashboardStats();
      if (selectedEventId === eventToDelete._id) {
        setSelectedEventId(null);
      }
    } catch (err) {
      triggerNotification(err.message, 'error');
    }
  };

  const handleOpenEditEvent = (event) => {
    setEditingEventId(event._id);
    setEventDate(new Date(event.date).toISOString().split('T')[0]);
    const timeStr = event.minReachTime || '10:00';
    const [hStr, mStr] = timeStr.split(':');
    let hours = parseInt(hStr, 10);
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    setEventMinReachTimeText(`${String(hours).padStart(2, '0')}:${mStr}`);
    setEventMinReachTimePeriod(period);
    setShowEventModal(true);
  };

  // Member Handlers
  const handleSaveMember = async (e) => {
    e.preventDefault();
    setSubmittingMember(true);
    try {
      const payload = {
        name: memberName.trim(),
        nameEn: memberEnName.trim(),
        type: memberType,
        uniqueCode: memberCode.trim(),
        mobileNumber: memberMobileNumber.trim()
      };

      if (editingMember) {
        await apiRequest(`/members/${editingMember._id}`, 'PUT', payload);
        triggerNotification('સભ્યની વિગતો સફળતાપૂર્વક સુધારાઈ ગઈ');
      } else {
        await apiRequest('/members', 'POST', payload);
        triggerNotification('નવો સભ્ય સફળતાપૂર્વક ઉમેરાયો');
      }

      setShowMemberModal(false);
      fetchMembers();
      fetchDashboardStats();
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setSubmittingMember(false);
    }
  };

  const handleDeleteMember = (memberId) => {
    setConfirmDeleteModal({
      isOpen: true,
      title: 'સભ્ય ડીલીટ કરો',
      message: 'શું તમે ખરેખર આ સભ્યને ડીલીટ કરવા માંગો છો? તેમની તમામ હાજરીનો રેકોર્ડ પણ નીકળી જશે.',
      onConfirm: async () => {
        try {
          await apiRequest(`/members/${memberId}`, 'DELETE');
          triggerNotification('સભ્ય સફળતાપૂર્વક ડીલીટ થયો');
          setConfirmDeleteModal(prev => ({ ...prev, isOpen: false }));
          fetchMembers();
          fetchDashboardStats();
        } catch (err) {
          triggerNotification(err.message, 'error');
        }
      }
    });
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
    setMemberName(member.name);
    setMemberEnName(member.nameEn || transliterateGujaratiToEnglish(member.name));
    setMemberType(member.type);
    setMemberCode(member.uniqueCode);
    setMemberMobileNumber(member.mobileNumber || '');
    setShowMemberModal(true);
  };

  const handleExcelFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setExcelFileName(file.name);
    try {
      const parsed = await parseExcelMembers(file, false);
      setParsedExcelMembers(parsed);
      triggerNotification(`${parsed.length} સભ્યો ફાઈલમાંથી વાંચવામાં આવ્યા`, 'success');
    } catch (err) {
      triggerNotification(err.message, 'error');
      setParsedExcelMembers([]);
      setExcelFileName('');
    }
  };

  const handleBulkExcelImport = async () => {
    if (parsedExcelMembers.length === 0) return;
    setImportingBulk(true);
    setBulkImportProgress(10);
    try {
      const res = await apiRequest('/members/bulk', 'POST', { members: parsedExcelMembers });
      setBulkImportProgress(100);
      setBulkResult(res);
      triggerNotification(`${res.successCount} સભ્યો સફળતાપૂર્વક ઉમેરાયા`, 'success');
      fetchMembers();
      fetchDashboardStats();
      setTimeout(() => {
        setShowBulkModal(false);
        setParsedExcelMembers([]);
        setExcelFileName('');
      }, 1500);
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setImportingBulk(false);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkText.trim()) return;
    setImportingBulk(true);
    setBulkImportProgress(20);
    try {
      const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
      const membersList = lines.map(line => {
        const parts = line.split(',').map(p => p.trim());
        return {
          name: parts[0] || '',
          nameEn: transliterateGujaratiToEnglish(parts[0] || ''),
          type: parts[1] || 'yuva',
          uniqueCode: parts[2] || '',
          mobileNumber: parts[3] || ''
        };
      });

      const res = await apiRequest('/members/bulk', 'POST', { members: membersList });
      setBulkImportProgress(100);
      setBulkResult(res);
      triggerNotification(`${res.successCount} સભ્યો ઉમેરાયા`, 'success');
      fetchMembers();
      fetchDashboardStats();
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setImportingBulk(false);
    }
  };

  // Sabha Attendance Handlers
  const loadEventAttendance = async (eventId) => {
    setSelectedEventId(eventId);
    setLoadingEventAttendance(true);
    setAttendanceProgress(0);
    try {
      const data = await apiRequest(`/events/${eventId}`);
      setActiveEventData(data.event);

      const dbMap = {};
      if (data.attendance && data.attendance.length > 0) {
        data.attendance.forEach(rec => {
          if (rec.member) {
            dbMap[rec.member._id] = {
              status: rec.status,
              arrivalTime: rec.arrivalTime,
              isLate: rec.isLate,
              remark: rec.remark || ''
            };
          }
        });
      }

      dbSabhaRecordsRef.current = dbMap;
      loadedEventIdRef.current = eventId;
      setAttendanceRecords(dbMap);
    } catch (err) {
      triggerNotification(err.message, 'error');
      setSelectedEventId(null);
    } finally {
      setLoadingEventAttendance(false);
    }
  };

  const markAttendance = (memberId, status) => {
    setAttendanceRecords(prev => {
      const current = prev[memberId] || {};
      let isLate = false;
      let arrivalTime = current.arrivalTime;

      if (status === 'present') {
        arrivalTime = arrivalTime || new Date();
        if (activeEventData && activeEventData.minReachTime) {
          const [hStr, mStr] = activeEventData.minReachTime.split(':');
          const deadline = new Date(activeEventData.date);
          deadline.setHours(parseInt(hStr, 10), parseInt(mStr, 10), 0, 0);
          if (new Date(arrivalTime) > deadline) {
            isLate = true;
          }
        }
      }

      return {
        ...prev,
        [memberId]: {
          status,
          arrivalTime: status === 'present' ? arrivalTime : null,
          isLate: status === 'present' ? isLate : false,
          remark: status === 'present' ? current.remark || '' : ''
        }
      };
    });
  };

  const handleRemarkChange = (memberId, remark) => {
    setAttendanceRecords(prev => {
      const current = prev[memberId] || {};
      return {
        ...prev,
        [memberId]: {
          ...current,
          remark
        }
      };
    });
  };

  const handleSubmitAttendance = async () => {
    if (!selectedEventId) return;
    setSavingAttendance(true);
    setAttendanceProgress(20);
    try {
      const records = Object.entries(attendanceRecords).map(([memberId, rec]) => ({
        memberId,
        status: rec.status,
        arrivalTime: rec.arrivalTime,
        isLate: rec.isLate,
        remark: rec.remark
      }));

      setAttendanceProgress(60);
      await apiRequest('/attendance/bulk', 'POST', {
        eventId: selectedEventId,
        records
      });

      setAttendanceProgress(100);
      clearSabhaDraft();
      triggerNotification('હાજરી સફળતાપૂર્વક સબમિટ થઈ ગઈ છે');
      dbSabhaRecordsRef.current = { ...attendanceRecords };
      fetchDashboardStats();
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setSavingAttendance(false);
    }
  };

  const handleDiscardSabhaDraft = () => {
    clearSabhaDraft();
    setAttendanceRecords(dbSabhaRecordsRef.current);
    triggerNotification('ડ્રાફ્ટ રદ કરવામાં આવ્યો', 'warning');
  };

  // Seva Handlers
  const handleCreateSeva = async (e) => {
    e.preventDefault();
    setCreatingSeva(true);
    try {
      let finalTypeId = sevaTypeId;
      if (sevaTypeId === 'new_type' && newSevaTypeNameInput.trim()) {
        const newType = await apiRequest('/sevas/types', 'POST', { name: newSevaTypeNameInput.trim() });
        finalTypeId = newType._id;
        fetchSevaTypes();
      }

      await apiRequest('/sevas', 'POST', {
        date: sevaDate,
        sevaType: finalTypeId,
        leader: sevaLeader.trim()
      });

      triggerNotification('નવી સેવા સફળતાપૂર્વક આયોજિત થઈ');
      setShowSevaModal(false);
      fetchSevas();
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setCreatingSeva(false);
    }
  };

  const handleDeleteSeva = (sevaId) => {
    setConfirmDeleteModal({
      isOpen: true,
      title: 'સેવા રદ કરો',
      message: 'શું તમે આ સેવા અને તેના તમામ હાજરી રેકોર્ડ રદ કરવા માંગો છો?',
      onConfirm: async () => {
        try {
          await apiRequest(`/sevas/${sevaId}`, 'DELETE');
          triggerNotification('સેવા સફળતાપૂર્વક રદ થઈ');
          setConfirmDeleteModal(prev => ({ ...prev, isOpen: false }));
          fetchSevas();
          if (selectedSevaId === sevaId) setSelectedSevaId(null);
        } catch (err) {
          triggerNotification(err.message, 'error');
        }
      }
    });
  };

  const handleCreateSevaType = async (e) => {
    e.preventDefault();
    if (!newSevaTypeName.trim()) return;
    setCreatingSevaType(true);
    try {
      await apiRequest('/sevas/types', 'POST', { name: newSevaTypeName.trim() });
      triggerNotification('સેવા પ્રકાર ઉમેરાયો');
      setNewSevaTypeName('');
      fetchSevaTypes();
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setCreatingSevaType(false);
    }
  };

  const handleDeleteSevaType = async (typeId) => {
    try {
      await apiRequest(`/sevas/types/${typeId}`, 'DELETE');
      triggerNotification('સેવા પ્રકાર રદ થયો');
      fetchSevaTypes();
    } catch (err) {
      triggerNotification(err.message, 'error');
    }
  };

  const loadSevaAttendance = async (sevaId) => {
    setSelectedSevaId(sevaId);
    setLoadingSevaAttendance(true);
    try {
      const data = await apiRequest(`/sevas/${sevaId}`);
      setActiveSevaData(data.seva);

      const dbMap = {};
      if (data.attendance && data.attendance.length > 0) {
        data.attendance.forEach(rec => {
          if (rec.member) {
            dbMap[rec.member._id] = {
              status: rec.status,
              hours: rec.hours || 0
            };
          }
        });
      }

      dbSevaRecordsRef.current = dbMap;
      loadedSevaIdRef.current = sevaId;
      setSevaAttendanceRecords(dbMap);
    } catch (err) {
      triggerNotification(err.message, 'error');
      setSelectedSevaId(null);
    } finally {
      setLoadingSevaAttendance(false);
    }
  };

  const toggleSevaAttendanceStatus = (memberId) => {
    setSevaAttendanceRecords(prev => {
      const current = prev[memberId] || { status: 'absent', hours: 0 };
      const nextStatus = current.status === 'present' ? 'absent' : 'present';
      return {
        ...prev,
        [memberId]: {
          status: nextStatus,
          hours: nextStatus === 'present' ? (current.hours || 1) : 0
        }
      };
    });
  };

  const handleSevaHoursChange = (memberId, hours) => {
    setSevaAttendanceRecords(prev => {
      const current = prev[memberId] || { status: 'present', hours: 0 };
      return {
        ...prev,
        [memberId]: {
          ...current,
          hours: parseFloat(hours) || 0
        }
      };
    });
  };

  const handleSaveSevaAttendance = async () => {
    if (!selectedSevaId) return;
    setSavingSevaAttendance(true);
    try {
      const records = Object.entries(sevaAttendanceRecords).map(([memberId, rec]) => ({
        memberId,
        status: rec.status,
        hours: rec.hours
      }));

      await apiRequest(`/sevas/${selectedSevaId}/attendance`, 'POST', { records });
      clearSevaDraft();
      triggerNotification('સેવા હાજરી સફળતાપૂર્વક સબમિટ થઈ ગઈ');
      dbSevaRecordsRef.current = { ...sevaAttendanceRecords };
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setSavingSevaAttendance(false);
    }
  };

  const handleDiscardSevaDraft = () => {
    clearSevaDraft();
    setSevaAttendanceRecords(dbSevaRecordsRef.current);
    triggerNotification('સેવા ડ્રાફ્ટ રદ કરવામાં આવ્યો', 'warning');
  };

  const handleSaveSevaMember = async (e) => {
    e.preventDefault();
    setSubmittingSevaMember(true);
    try {
      const payload = {
        name: sevaMemberName.trim(),
        nameEn: sevaMemberEnName.trim(),
        type: sevaMemberType,
        uniqueCode: sevaMemberUniqueCode.trim(),
        mobileNumber: sevaMemberMobileNumber.trim()
      };

      if (editingSevaMember) {
        await apiRequest(`/sevas/members/${editingSevaMember._id}`, 'PUT', payload);
        triggerNotification('સેવા સભ્ય સુધારી લેવાયો');
      } else {
        await apiRequest('/sevas/members', 'POST', payload);
        triggerNotification('નવો સેવા સભ્ય ઉમેરાયો');
      }

      setShowSevaMemberModal(false);
      fetchSevaMembers();
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setSubmittingSevaMember(false);
    }
  };

  const handleDeleteSevaMember = (memberId) => {
    setConfirmDeleteModal({
      isOpen: true,
      title: 'સેવા સભ્ય ડીલીટ કરો',
      message: 'શું તમે આ સેવા સભ્યને ડીલીટ કરવા માંગો છો?',
      onConfirm: async () => {
        try {
          await apiRequest(`/sevas/members/${memberId}`, 'DELETE');
          triggerNotification('સેવા સભ્ય ડીલીટ થયો');
          setConfirmDeleteModal(prev => ({ ...prev, isOpen: false }));
          fetchSevaMembers();
        } catch (err) {
          triggerNotification(err.message, 'error');
        }
      }
    });
  };

  const handleExcelSevaFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setExcelSevaFileName(file.name);
    try {
      const parsed = await parseExcelMembers(file, true);
      setParsedExcelSevaMembers(parsed);
      triggerNotification(`${parsed.length} મહિલા સભ્યો ફાઈલમાંથી વાંચવામાં આવ્યા`, 'success');
    } catch (err) {
      triggerNotification(err.message, 'error');
      setParsedExcelSevaMembers([]);
      setExcelSevaFileName('');
    }
  };

  const handleBulkExcelSevaImport = async () => {
    if (parsedExcelSevaMembers.length === 0) return;
    setImportingBulkSeva(true);
    setBulkSevaImportProgress(10);
    try {
      const res = await apiRequest('/sevas/members/bulk', 'POST', { members: parsedExcelSevaMembers });
      setBulkSevaImportProgress(100);
      setBulkSevaMemberResult(res);
      triggerNotification(`${res.successCount} મહિલા સેવા સભ્યો ઉમેરાયા`, 'success');
      fetchSevaMembers();
      setTimeout(() => {
        setShowBulkSevaMemberModal(false);
        setParsedExcelSevaMembers([]);
        setExcelSevaFileName('');
      }, 1500);
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setImportingBulkSeva(false);
    }
  };

  const handleBulkSevaMemberImport = async () => {
    if (!bulkSevaMemberText.trim()) return;
    setImportingBulkSeva(true);
    setBulkSevaImportProgress(20);
    try {
      const lines = bulkSevaMemberText.split('\n').map(l => l.trim()).filter(Boolean);
      const membersList = lines.map(line => {
        const parts = line.split(',').map(p => p.trim());
        return {
          name: parts[0] || '',
          nameEn: transliterateGujaratiToEnglish(parts[0] || ''),
          type: parts[1] || 'yuvti',
          uniqueCode: parts[2] || '',
          mobileNumber: parts[3] || ''
        };
      });

      const res = await apiRequest('/sevas/members/bulk', 'POST', { members: membersList });
      setBulkSevaImportProgress(100);
      setBulkSevaMemberResult(res);
      triggerNotification(`${res.successCount} સભ્યો ઉમેરાયા`, 'success');
      fetchSevaMembers();
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setImportingBulkSeva(false);
    }
  };

  // Print Handlers
  const handlePrintLeaderboard = () => {
    if (!topAttendeesData) return;
    setPrintData({
      type: 'leaderboard',
      title: 'રવિસભા શ્રેષ્ઠ અહેવાલ (ટોપ ૧૦)',
      filterType: leaderboardTypeFilter,
      data: topAttendeesData
    });
    setTimeout(() => window.print(), 200);
  };

  const handlePrintParticularEvent = () => {
    if (!particularEventReport) return;
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

    const combinedList = members.map(m => {
      const att = recordsMap[m._id] || { status: 'absent', isLate: false, arrivalTime: null, remark: '' };
      return {
        name: m.name,
        uniqueCode: m.uniqueCode,
        type: m.type,
        status: att.status,
        isLate: att.isLate,
        arrivalTime: att.arrivalTime,
        remark: att.remark
      };
    });

    setPrintData({
      type: 'particular_event',
      title: `સભા હાજરી રિપોર્ટ: ${new Date(particularEventReport.event.date).toLocaleDateString('gu-IN')}`,
      data: combinedList
    });
    setTimeout(() => window.print(), 200);
  };

  const handlePrintSevaLeaderboard = () => {
    const grouped = {};
    sevaTypeLeaderboardData.forEach(row => {
      if (!grouped[row.sevaTypeName]) {
        grouped[row.sevaTypeName] = [];
      }
      grouped[row.sevaTypeName].push(row);
    });

    setPrintData({
      type: 'seva_leaderboard',
      title: 'સેવા પ્રકાર વાઈઝ શ્રેષ્ઠ અહેવાલ (ટોપ ૧૦)',
      data: grouped
    });
    setTimeout(() => window.print(), 200);
  };

  const handlePrintParticularSeva = () => {
    if (!particularSevaReport) return;
    const recordsMap = {};
    particularSevaReport.attendance.forEach(rec => {
      if (rec.member) {
        recordsMap[rec.member._id] = {
          status: rec.status,
          hours: rec.hours
        };
      }
    });

    const combinedList = sevaMembers.map(m => {
      const att = recordsMap[m._id] || { status: 'absent', hours: 0 };
      return {
        name: m.name,
        uniqueCode: m.uniqueCode,
        type: m.type,
        status: att.status,
        hours: att.hours
      };
    });

    setPrintData({
      type: 'particular_seva',
      title: `સેવા હાજરી અહેવાલ: ${new Date(particularSevaReport.seva.date).toLocaleDateString('gu-IN')}`,
      data: combinedList
    });
    setTimeout(() => window.print(), 200);
  };

  const handleTabClick = (key) => {
    if (activeTab === 'attendance' && key !== 'attendance' && selectedEventId && hasSabhaDraft) {
      triggerNotification('ડ્રાફ્ટ સાચવેલ છે', 'success');
      setSelectedEventId(null);
    }

    if (isSevaUser) {
      setSevaModuleTab(key);
      if (key === 'reports') {
        fetchSevaReports();
      }
    } else {
      setActiveTab(key);
    }
  };

  if (!token) {
    return <Login onLogin={handleLoginSubmit} authLoading={authLoading} authError={authError} />;
  }

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {notification && (
        <div
          role="status"
          aria-live="polite"
          className={`toast ${notification.type === 'error' ? 'toast-error' : notification.type === 'warning' ? 'toast-warning' : 'toast-success'}`}
        >
          {notification.type === 'error' ? (
            <XCircle color="var(--color-danger)" size={20} style={{ flexShrink: 0 }} />
          ) : notification.type === 'warning' ? (
            <AlertTriangle color="var(--color-warning)" size={20} style={{ flexShrink: 0 }} />
          ) : (
            <CheckCircle color="var(--color-success)" size={20} style={{ flexShrink: 0 }} />
          )}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Header Panel */}
      <Navbar
        user={user}
        logout={logout}
        activeTab={activeTab}
        sevaModuleTab={sevaModuleTab}
        onTabChange={handleTabClick}
        isAttendanceSheetOpen={activeTab === 'attendance' && !!selectedEventId}
      />

      {/* --- PANEL 1: ATTENDANCE (Ravi Sabha) --- */}
      {activeTab === 'attendance' && (
        !selectedEventId ? (
          <AttendanceView
            events={events}
            loadingEvents={loadingEvents}
            eventSearch={eventSearch}
            setEventSearch={setEventSearch}
            onSelectEvent={loadEventAttendance}
            onOpenCreateEvent={() => {
              setEditingEventId(null);
              setEventMinReachTimeText('10:00');
              setEventMinReachTimePeriod('AM');
              setShowEventModal(true);
            }}
            onOpenEditEvent={handleOpenEditEvent}
            onRequestDeleteEvent={(event) => setEventToDelete(event)}
          />
        ) : (
          <AttendanceSheet
            activeEventData={activeEventData}
            loadingEventAttendance={loadingEventAttendance}
            members={members}
            displayMembers={displayMembers}
            attendanceRecords={attendanceRecords}
            setAttendanceRecords={setAttendanceRecords}
            savingAttendance={savingAttendance}
            attendanceProgress={attendanceProgress}
            attendanceSearch={attendanceSearch}
            setAttendanceSearch={setAttendanceSearch}
            hasSabhaDraft={hasSabhaDraft}
            sabhaDraftCount={sabhaDraftCount}
            onBack={() => {
              if (hasSabhaDraft) {
                triggerNotification('ડ્રાફ્ટ સાચવેલ છે', 'success');
              }
              setSelectedEventId(null);
            }}
            onSubmitAttendance={handleSubmitAttendance}
            onDiscardDraft={handleDiscardSabhaDraft}
            markAttendance={markAttendance}
            handleRemarkChange={handleRemarkChange}
          />
        )
      )}

      {/* --- PANEL 2: MEMBER MANAGEMENT --- */}
      {activeTab === 'members' && (
        <MembersView
          members={members}
          loadingMembers={loadingMembers}
          memberSearch={memberSearch}
          setMemberSearch={setMemberSearch}
          memberTypeFilter={memberTypeFilter}
          setMemberTypeFilter={setMemberTypeFilter}
          onOpenAddMember={() => {
            setEditingMember(null);
            setMemberName('');
            setMemberEnName('');
            setMemberCode('');
            setMemberType('yuva');
            setShowMemberModal(true);
          }}
          onOpenBulkModal={() => {
            setBulkResult(null);
            setBulkText('');
            setShowBulkModal(true);
          }}
          onEditMember={handleEditMember}
          onDeleteMember={handleDeleteMember}
        />
      )}

      {/* --- PANEL 3: REPORTS & ANALYTICS --- */}
      {activeTab === 'reports' && (
        <ReportsView
          dashboardStats={dashboardStats}
          reportsSubTab={reportsSubTab}
          setReportsSubTab={setReportsSubTab}
          members={members}
          reportSearch={reportSearch}
          setReportSearch={setReportSearch}
          selectedMemberReport={selectedMemberReport}
          loadingMemberReport={loadingMemberReport}
          onSelectMemberReport={loadMemberReport}
          topAttendeesData={topAttendeesData}
          loadingTopAttendees={loadingTopAttendees}
          leaderboardTypeFilter={leaderboardTypeFilter}
          setLeaderboardTypeFilter={setLeaderboardTypeFilter}
          onPrintLeaderboard={handlePrintLeaderboard}
          fetchTopAttendees={fetchTopAttendees}
          events={events}
          selectedParticularEventId={selectedParticularEventId}
          setSelectedParticularEventId={setSelectedParticularEventId}
          loadingParticularEvent={loadingParticularEvent}
          particularEventReport={particularEventReport}
          onPrintParticularEvent={handlePrintParticularEvent}
        />
      )}

      {/* --- PANEL 4: SEVA MANAGEMENT --- */}
      {activeTab === 'seva' && (
        <SevaView
          sevaModuleTab={sevaModuleTab}
          selectedSevaId={selectedSevaId}
          setSelectedSevaId={setSelectedSevaId}
          sevas={sevas}
          loadingSevas={loadingSevas}
          sevaSearch={sevaSearch}
          setSevaSearch={setSevaSearch}
          onOpenCreateSeva={() => {
            setSevaDate(new Date().toISOString().split('T')[0]);
            setSevaTypeId('');
            setSevaLeader('');
            setShowSevaModal(true);
          }}
          onDeleteSeva={handleDeleteSeva}
          onSelectSeva={loadSevaAttendance}
          activeSevaData={activeSevaData}
          loadingSevaAttendance={loadingSevaAttendance}
          sevaMembers={sevaMembers}
          loadingSevaMembers={loadingSevaMembers}
          sevaAttendanceRecords={sevaAttendanceRecords}
          savingSevaAttendance={savingSevaAttendance}
          sevaAttendanceSearch={sevaAttendanceSearch}
          setSevaAttendanceSearch={setSevaAttendanceSearch}
          hasSevaDraft={hasSevaDraft}
          sevaDraftCount={sevaDraftCount}
          onSaveSevaAttendance={handleSaveSevaAttendance}
          onDiscardSevaDraft={handleDiscardSevaDraft}
          toggleSevaAttendanceStatus={toggleSevaAttendanceStatus}
          handleSevaHoursChange={handleSevaHoursChange}
          sevaMemberSearch={sevaMemberSearch}
          setSevaMemberSearch={setSevaMemberSearch}
          sevaMemberTypeFilter={sevaMemberTypeFilter}
          setSevaMemberTypeFilter={setSevaMemberTypeFilter}
          onOpenAddSevaMember={() => {
            setEditingSevaMember(null);
            setSevaMemberName('');
            setSevaMemberEnName('');
            setSevaMemberUniqueCode('');
            setSevaMemberType('yuvti');
            setShowSevaMemberModal(true);
          }}
          onOpenBulkSevaMemberModal={() => {
            setBulkSevaMemberText('');
            setBulkSevaMemberResult(null);
            setShowBulkSevaMemberModal(true);
          }}
          onEditSevaMember={(m) => {
            setEditingSevaMember(m);
            setSevaMemberName(m.name);
            setSevaMemberEnName(m.nameEn || transliterateGujaratiToEnglish(m.name));
            setSevaMemberType(m.type);
            setSevaMemberUniqueCode(m.uniqueCode);
            setSevaMemberMobileNumber(m.mobileNumber || '');
            setShowSevaMemberModal(true);
          }}
          onDeleteSevaMember={handleDeleteSevaMember}
          sevaTypes={sevaTypes}
          sevaReportsData={sevaReportsData}
          sevaReportsSubTab={sevaReportsSubTab}
          setSevaReportsSubTab={setSevaReportsSubTab}
          sevaMemberReportSearch={sevaMemberReportSearch}
          setSevaMemberReportSearch={setSevaMemberReportSearch}
          selectedSevaMemberReport={selectedSevaMemberReport}
          loadingSevaMemberReport={loadingSevaMemberReport}
          onSelectSevaMemberReport={loadSevaMemberReport}
          sevaTypeLeaderboardData={sevaTypeLeaderboardData}
          loadingSevaTypeLeaderboard={loadingSevaTypeLeaderboard}
          onPrintSevaLeaderboard={handlePrintSevaLeaderboard}
          selectedParticularSevaId={selectedParticularSevaId}
          setSelectedParticularSevaId={setSelectedParticularSevaId}
          loadingParticularSeva={loadingParticularSeva}
          particularSevaReport={particularSevaReport}
          onPrintParticularSeva={handlePrintParticularSeva}
          fetchSevaReports={fetchSevaReports}
        />
      )}

      {/* --- MODALS --- */}
      {/* Event Modal (Ravi Sabha) */}
      <EventModal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        onSubmit={handleSaveEvent}
        editingEventId={editingEventId}
        eventDate={eventDate}
        setEventDate={setEventDate}
        eventMinReachTimeText={eventMinReachTimeText}
        setEventMinReachTimeText={setEventMinReachTimeText}
        eventMinReachTimePeriod={eventMinReachTimePeriod}
        setEventMinReachTimePeriod={setEventMinReachTimePeriod}
        loading={creatingEvent}
      />

      {/* Confirm Delete Event Modal */}
      <ConfirmModal
        isOpen={!!eventToDelete}
        title="સભા રદ કરો"
        message="શું તમે ખાતરીપૂર્વક સભા રદ કરવા માંગો છો? તેના તમામ હાજરી રેકોર્ડ પણ કાયમ માટે નીકળી જશે."
        onConfirm={confirmDeleteEventAction}
        onCancel={() => setEventToDelete(null)}
      />

      {/* Confirm Delete Generic Modal */}
      <ConfirmModal
        isOpen={confirmDeleteModal.isOpen}
        title={confirmDeleteModal.title}
        message={confirmDeleteModal.message}
        onConfirm={confirmDeleteModal.onConfirm}
        onCancel={() => setConfirmDeleteModal(prev => ({ ...prev, isOpen: false }))}
        loading={confirmDeleteModal.loading}
      />

      {/* Member Modal */}
      <MemberModal
        isOpen={showMemberModal}
        onClose={() => setShowMemberModal(false)}
        onSubmit={handleSaveMember}
        editingMember={editingMember}
        memberName={memberName}
        setMemberName={setMemberName}
        memberEnName={memberEnName}
        setMemberEnName={setMemberEnName}
        memberType={memberType}
        setMemberType={setMemberType}
        memberCode={memberCode}
        setMemberCode={setMemberCode}
        memberMobileNumber={memberMobileNumber}
        setMemberMobileNumber={setMemberMobileNumber}
        submittingMember={submittingMember}
      />

      {/* Bulk Member Modal */}
      <BulkMemberModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        bulkImportTab={bulkImportTab}
        setBulkImportTab={setBulkImportTab}
        excelFileName={excelFileName}
        parsedExcelMembers={parsedExcelMembers}
        handleExcelFileChange={handleExcelFileChange}
        handleBulkExcelImport={handleBulkExcelImport}
        bulkText={bulkText}
        setBulkText={setBulkText}
        handleBulkImport={handleBulkImport}
        importingBulk={importingBulk}
        bulkImportProgress={bulkImportProgress}
        bulkResult={bulkResult}
      />

      {/* Seva Modals */}
      <SevaModal
        isOpen={showSevaModal}
        onClose={() => setShowSevaModal(false)}
        onSubmit={handleCreateSeva}
        sevaDate={sevaDate}
        setSevaDate={setSevaDate}
        sevaTypeId={sevaTypeId}
        setSevaTypeId={setSevaTypeId}
        sevaTypes={sevaTypes}
        newSevaTypeNameInput={newSevaTypeNameInput}
        setNewSevaTypeNameInput={setNewSevaTypeNameInput}
        sevaLeader={sevaLeader}
        setSevaLeader={setSevaLeader}
        creatingSeva={creatingSeva}
      />

      <SevaTypeModal
        isOpen={showSevaTypeModal}
        onClose={() => setShowSevaTypeModal(false)}
        onSubmit={handleCreateSevaType}
        newSevaTypeName={newSevaTypeName}
        setNewSevaTypeName={setNewSevaTypeName}
        creatingSevaType={creatingSevaType}
        sevaTypes={sevaTypes}
        onDeleteSevaType={handleDeleteSevaType}
      />

      <SevaMemberModal
        isOpen={showSevaMemberModal}
        onClose={() => setShowSevaMemberModal(false)}
        onSubmit={handleSaveSevaMember}
        editingSevaMember={editingSevaMember}
        sevaMemberName={sevaMemberName}
        setSevaMemberName={setSevaMemberName}
        sevaMemberEnName={sevaMemberEnName}
        setSevaMemberEnName={setSevaMemberEnName}
        sevaMemberType={sevaMemberType}
        setSevaMemberType={setSevaMemberType}
        sevaMemberUniqueCode={sevaMemberUniqueCode}
        setSevaMemberUniqueCode={setSevaMemberUniqueCode}
        sevaMemberMobileNumber={sevaMemberMobileNumber}
        setSevaMemberMobileNumber={setSevaMemberMobileNumber}
        submittingSevaMember={submittingSevaMember}
      />

      <BulkSevaMemberModal
        isOpen={showBulkSevaMemberModal}
        onClose={() => setShowBulkSevaMemberModal(false)}
        bulkSevaImportTab={bulkSevaImportTab}
        setBulkSevaImportTab={setBulkSevaImportTab}
        excelSevaFileName={excelSevaFileName}
        parsedExcelSevaMembers={parsedExcelSevaMembers}
        handleExcelSevaFileChange={handleExcelSevaFileChange}
        handleBulkExcelSevaImport={handleBulkExcelSevaImport}
        bulkSevaMemberText={bulkSevaMemberText}
        setBulkSevaMemberText={setBulkSevaMemberText}
        handleBulkSevaMemberImport={handleBulkSevaMemberImport}
        importingBulkSeva={importingBulkSeva}
        bulkSevaImportProgress={bulkSevaImportProgress}
        bulkSevaMemberResult={bulkSevaMemberResult}
      />

      {/* Mobile Bottom Navigation */}
      <BottomNav
        user={user}
        activeTab={activeTab}
        sevaModuleTab={sevaModuleTab}
        onTabChange={handleTabClick}
      />

      {/* Print Preview Container */}
      <PrintModal printData={printData} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <InstallPWA />
    </AuthProvider>
  );
}
