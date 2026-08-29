import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  TrendingUp,
  Search,
  UserPlus,
  FileSpreadsheet,
  Edit,
  Trash2,
  LogOut,
  Clock,
  AlertTriangle,
  Plus,
  UserCheck,
  MapPin,
  Heart,
  X,
  Check,
  ArrowLeft,
  Printer
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useAttendanceDraft } from './hooks/useAttendanceDraft';
import {
  SpinnerLoader,
  LinearProgress,
  DeterminateProgress,
  CircularProgress,
  SkeletonCard,
  SkeletonText,
  ShimmerOverlay
} from './components/Loaders';
import InstallPWA from './components/InstallPWA';
import { transliterateGujaratiToEnglish } from './utils/transliterate';
import { transliterateEnglishToGujarati } from './utils/englishToGujarati';
import { sortMembersBySearchRank } from './utils/searchRank';

// Predefined Late Reasons in Gujarati
const LATE_REASON_OPTIONS = [
  'દુકાન',
  'ધંધાર્થે',
  'આળસ',
  'ઊંઘતા હતા',
  'બહારગામ ગયા હોવાથી',
  'ભણતા હતા',
  'અન્ય'
];

// Localization mapping for categories
const CATEGORY_LABELS = {
  all: 'બધા સભ્યો',
  bal: 'બાળ (૧૪ થી નીચે)',
  kishor: 'કિશોર (૧૪-૧૭)',
  yuva: 'યુવા (૧૮-૫૦)',
  proudh: 'પ્રૌઢ',
  vadil: 'વડીલ (૫૦+)'
};

const CATEGORY_TAGS = {
  bal: 'બાળ',
  kishor: 'કિશોર',
  yuva: 'યુવા',
  proudh: 'પ્રૌઢ',
  vadil: 'વડીલ'
};

const SEVA_CATEGORY_LABELS = {
  all: 'બધા સભ્યો',
  bal: 'બાળ (૧૪ થી નીચે)',
  kisori: 'કિશોરી (૧૪-૧૭)',
  yuvti: 'યુવતી (૧૮-૫૦)',
  prutha: 'પ્રૌઢા',
  vadil: 'વડીલ (૫૦+)'
};

const SEVA_CATEGORY_TAGS = {
  bal: 'બાળ',
  kisori: 'કિશોરી',
  yuvti: 'યુવતી',
  prutha: 'પ્રૌઢા',
  vadil: 'વડીલ'
};

const SABHA_TYPES = {
  savar_ni_katha: 'સવારની કથા',
  ravi_sabha: 'રવિસભા'
};

const formatTime12h = (time24) => {
  if (!time24) return '';
  const [hoursStr, minutesStr] = time24.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = minutesStr;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const paddedHours = String(hours).padStart(2, '0');
  return `${paddedHours}:${minutes} ${ampm}`;
};

const parseExcelMembers = (file, isSeva) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet);

        if (rows.length > 0) {
          const hasGenderColumn = Object.keys(rows[0]).some(k => /[gz]ender/i.test(k) || /sex/i.test(k) || /જાતિ/i.test(k));
          if (!hasGenderColumn) {
            throw new Error('એક્સેલ ફાઇલમાં Gender/Zender (જાતિ) કોલમ હોવી જરૂરી છે.');
          }
        }

        const mapped = rows.map((row) => {
          const findValue = (regexes) => {
            for (const regex of regexes) {
              const key = Object.keys(row).find(k => regex.test(k));
              if (key !== undefined) return row[key];
            }
            return undefined;
          };

          const genderVal = findValue([/[gz]ender/i, /sex/i, /જાતિ/i]);
          const gStr = genderVal ? genderVal.toString().trim().toLowerCase() : '';
          const isMale = gStr.startsWith('m') || gStr === 'purush' || gStr === 'પુરુષ' || gStr === 'પુરૂષ';
          const isFemale = gStr.startsWith('f') || gStr === 'stri' || gStr === 'સ્ત્રી';

          if (isSeva && !isFemale) return null;
          if (!isSeva && !isMale) return null;

          const nameVal = findValue([/fullnameguj/i, /name/i]);
          const nameEnVal = findValue([/fullnameeng/i, /englishname/i, /nameen/i, /engname/i]);
          const ageVal = findValue([/age/i]);
          const mobileVal = findValue([/mobile\s*no\s*1/i, /mobile/i, /phone/i]);
          const smkVal = findValue([/smk/i, /uniquecode/i, /code/i]);

          let type = isSeva ? 'yuvti' : 'yuva';
          if (ageVal !== undefined && ageVal !== null && ageVal !== '') {
            const age = parseInt(ageVal, 10);
            if (!isNaN(age)) {
              if (age < 14) {
                type = 'bal';
              } else if (age >= 14 && age <= 17) {
                type = isSeva ? 'kisori' : 'kishor';
              } else if (age >= 18 && age <= 50) {
                type = isSeva ? 'yuvti' : 'yuva';
              } else if (age > 50) {
                type = 'vadil';
              }
            }
          }

          const cleanName = nameVal ? nameVal.toString().trim() : '';
          const cleanNameEn = nameEnVal && nameEnVal.toString().trim()
            ? nameEnVal.toString().trim()
            : transliterateGujaratiToEnglish(cleanName);

          return {
            name: cleanName,
            nameEn: cleanNameEn,
            type: type,
            uniqueCode: smkVal ? smkVal.toString().trim() : '',
            mobileNumber: mobileVal ? mobileVal.toString().trim() : ''
          };
        }).filter(m => m !== null && m.name !== '');

        resolve(mapped);
      } catch (err) {
        reject(new Error(err.message));
      }
    };
    reader.onerror = () => reject(new Error('ફાઇલ લોડ કરવામાં ભૂલ આવી'));
    reader.readAsArrayBuffer(file);
  });
};

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
  const [sevaAttendanceRecords, setSevaAttendanceRecords] = useState({}); // { memberId: { status, hours } }
  const [savingSevaAttendance, setSavingSevaAttendance] = useState(false);
  const [sevaAttendanceSearch, setSevaAttendanceSearch] = useState('');
  const [sevaSearch, setSevaSearch] = useState('');

  // Seva Reports State
  const [sevaTab, setSevaTab] = useState(''); // active Seva Type tab ID
  const [sevaModuleTab, setSevaModuleTab] = useState('attendance'); // 'attendance' | 'reports'
  const [sevaReportsSubTab, setSevaReportsSubTab] = useState('profile'); // 'profile' | 'leaderboard' | 'particular'
  const [selectedSevaMemberReport, setSelectedSevaMemberReport] = useState(null);
  const [loadingSevaMemberReport, setLoadingSevaMemberReport] = useState(false);
  const [selectedParticularSevaId, setSelectedParticularSevaId] = useState('');
  const [particularSevaReport, setParticularSevaReport] = useState(null);
  const [loadingParticularSeva, setLoadingParticularSeva] = useState(false);
  const [sevaReportsData, setSevaReportsData] = useState([]);
  const [sevaTypeLeaderboardData, setSevaTypeLeaderboardData] = useState([]);
  const [loadingSevaReports, setLoadingSevaReports] = useState(false);
  const [loadingSevaTypeLeaderboard, setLoadingSevaTypeLeaderboard] = useState(false);
  const [sevaReportSearch, setSevaReportSearch] = useState('');
  const [sevaMemberReportSearch, setSevaMemberReportSearch] = useState('');

  // Login fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // App Global Data State
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);

  // Screen Loaders State
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingEventAttendance, setLoadingEventAttendance] = useState(false);
  const [loadingSevaAttendance, setLoadingSevaAttendance] = useState(false);

  // Active Attendance Module State
  const [sabhaTab, setSabhaTab] = useState('savar_ni_katha'); // 'savar_ni_katha' | 'ravi_sabha'
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [activeEventData, setActiveEventData] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState({}); // { memberId: { status, arrivalTime, isLate, remark } }
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [attendanceProgress, setAttendanceProgress] = useState(0); // for determinate save progress
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [eventSearch, setEventSearch] = useState('');
  const [displayMembers, setDisplayMembers] = useState([]);
  const [eventToDelete, setEventToDelete] = useState(null);

  // Refs to ensure auto-save ONLY saves when attendanceRecords belongs to the currently loaded event and differs from DB
  const loadedEventIdRef = useRef(null);
  const loadedSevaIdRef = useRef(null);
  const dbSabhaRecordsRef = useRef({});
  const dbSevaRecordsRef = useRef({});

  // Local Draft Persistence Hooks (Sparse Delta)
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

  // Auto-save Sabha attendance draft ONLY if records differ from DB baseline state
  useEffect(() => {
    if (selectedEventId && loadedEventIdRef.current === selectedEventId && Object.keys(attendanceRecords).length > 0) {
      saveSabhaDraft(attendanceRecords, dbSabhaRecordsRef.current);
    }
  }, [attendanceRecords, selectedEventId, saveSabhaDraft]);

  // Auto-save Seva attendance draft ONLY if records differ from DB baseline state
  useEffect(() => {
    if (selectedSevaId && loadedSevaIdRef.current === selectedSevaId && Object.keys(sevaAttendanceRecords).length > 0) {
      saveSevaDraft(sevaAttendanceRecords, dbSevaRecordsRef.current);
    }
  }, [sevaAttendanceRecords, selectedSevaId, saveSevaDraft]);

  // Reports new states
  const [reportsSubTab, setReportsSubTab] = useState('profile'); // 'profile' | 'leaderboard' | 'particular'
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
  const [eventType, setEventType] = useState('savar_ni_katha');
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
  const [bulkImportTab, setBulkImportTab] = useState('excel'); // 'excel' | 'text'
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
  const [bulkSevaImportTab, setBulkSevaImportTab] = useState('excel'); // 'excel' | 'text'
  const [parsedExcelSevaMembers, setParsedExcelSevaMembers] = useState([]);
  const [excelSevaFileName, setExcelSevaFileName] = useState('');
  const [submittingSevaMember, setSubmittingSevaMember] = useState(false);
  const [sevaMemberSearch, setSevaMemberSearch] = useState('');
  const [sevaMemberTypeFilter, setSevaMemberTypeFilter] = useState('all');

  // Seva Member Bulk Upload State
  const [showBulkSevaMemberModal, setShowBulkSevaMemberModal] = useState(false);
  const [bulkSevaMemberText, setBulkSevaMemberText] = useState('');
  const [bulkSevaMemberImportProgress, setBulkSevaMemberImportProgress] = useState(0);
  const [importingBulkSevaMember, setImportingBulkSevaMember] = useState(false);
  const [bulkSevaMemberResult, setBulkSevaMemberResult] = useState(null);

  // Report Specific State
  const [selectedMemberReport, setSelectedMemberReport] = useState(null);
  const [loadingMemberReport, setLoadingMemberReport] = useState(false);
  const [reportSearch, setReportSearch] = useState('');

  // Error notifications
  const [notification, setNotification] = useState(null);

  // Fetch initial data
  useEffect(() => {
    if (token) {
      fetchMembers();
      if (user && user.role === 'superadmin') {
        fetchEvents();
        fetchDashboardStats();
      }
      fetchSevas();
      fetchSevaTypes();
      fetchSevaMembers();
    }
  }, [token, user]);

  useEffect(() => {
    if (user) {
      if (user.role === 'seva_admin') {
        setActiveTab('seva');
      } else {
        setActiveTab('attendance');
      }
    }
  }, [user]);

  const fetchSevas = async () => {
    setLoadingSevas(true);
    try {
      const data = await apiRequest('/api/sevas');
      setSevas(Array.isArray(data) ? data : []);
    } catch (err) {
      triggerNotification(err.message, 'error');
      setSevas([]);
    } finally {
      setLoadingSevas(false);
    }
  };

  const fetchSevaTypes = async () => {
    setLoadingSevaTypes(true);
    try {
      const data = await apiRequest('/api/sevas/types');
      const list = Array.isArray(data) ? data : [];
      setSevaTypes(list);
      if (list.length > 0 && !sevaTab) {
        setSevaTab(list[0]._id);
      }
    } catch (err) {
      triggerNotification(err.message, 'error');
      setSevaTypes([]);
    } finally {
      setLoadingSevaTypes(false);
    }
  };

  const fetchSevaReports = async () => {
    setLoadingSevaReports(true);
    setLoadingSevaTypeLeaderboard(true);
    try {
      const summaryData = await apiRequest('/api/sevas/reports/summary');
      setSevaReportsData(summaryData);

      const typeLeaderboardData = await apiRequest('/api/sevas/reports/type-leaderboard');
      setSevaTypeLeaderboardData(typeLeaderboardData);
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setLoadingSevaReports(false);
      setLoadingSevaTypeLeaderboard(false);
    }
  };

  const loadSevaMemberReport = async (memberId) => {
    setLoadingSevaMemberReport(true);
    try {
      const data = await apiRequest(`/api/sevas/reports/member/${memberId}`);
      setSelectedSevaMemberReport(data);
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setLoadingSevaMemberReport(false);
    }
  };

  const fetchParticularSevaReport = async (sevaId) => {
    setLoadingParticularSeva(true);
    try {
      const data = await apiRequest(`/api/sevas/${sevaId}`);
      setParticularSevaReport(data);
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setLoadingParticularSeva(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'seva' && sevaModuleTab === 'reports' && sevaReportsSubTab === 'particular' && selectedParticularSevaId) {
      fetchParticularSevaReport(selectedParticularSevaId);
    }
  }, [activeTab, sevaModuleTab, sevaReportsSubTab, selectedParticularSevaId]);

  // Create Seva Type
  const handleCreateSevaType = async (e) => {
    e.preventDefault();
    if (!newSevaTypeName.trim()) return;
    setCreatingSevaType(true);
    try {
      const data = await apiRequest('/api/sevas/types', {
        method: 'POST',
        body: JSON.stringify({ name: newSevaTypeName.trim() })
      });
      setSevaTypes([...sevaTypes, data]);
      setNewSevaTypeName('');
      triggerNotification('સેવાનો પ્રકાર સફળતાપૂર્વક ઉમેરવામાં આવ્યો છે');
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setCreatingSevaType(false);
    }
  };

  // Delete Seva Type
  const handleDeleteSevaType = async (id) => {
    if (!window.confirm('શું તમે ખરેખર આ સેવાનો પ્રકાર કાઢી નાખવા માંગો છો?')) return;
    try {
      await apiRequest(`/api/sevas/types/${id}`, { method: 'DELETE' });
      setSevaTypes(sevaTypes.filter(t => t._id !== id));
      triggerNotification('સેવાનો પ્રકાર કાઢી નાખવામાં આવ્યો છે');
    } catch (err) {
      triggerNotification(err.message, 'error');
    }
  };

  // Create Seva
  const handleCreateSeva = async (e) => {
    e.preventDefault();
    if (!sevaDate || !sevaTypeId) {
      triggerNotification('કૃપા કરીને બધી માહિતી ભરો', 'error');
      return;
    }
    setCreatingSeva(true);
    try {
      let finalSevaTypeId = sevaTypeId;

      if (sevaTypeId === 'new_type') {
        if (!newSevaTypeNameInput.trim()) {
          triggerNotification('કૃપા કરીને સેવાનો પ્રકાર લખો', 'warning');
          setCreatingSeva(false);
          return;
        }

        const newType = await apiRequest('/api/sevas/types', {
          method: 'POST',
          body: JSON.stringify({ name: newSevaTypeNameInput.trim() })
        });

        setSevaTypes([...sevaTypes, newType]);
        finalSevaTypeId = newType._id;
        setNewSevaTypeNameInput('');
      }

      const data = await apiRequest('/api/sevas', {
        method: 'POST',
        body: JSON.stringify({
          date: sevaDate,
          sevaTypeId: finalSevaTypeId,
          leader: sevaLeader
        })
      });
      setSevas([data, ...sevas]);
      setShowSevaModal(false);
      setSevaLeader('');
      setSevaTypeId(finalSevaTypeId); // select the created seva type tab
      triggerNotification('સેવા સફળતાપૂર્વક ઉમેરવામાં આવી છે');
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setCreatingSeva(false);
    }
  };

  // Delete Seva
  const handleDeleteSeva = async (id) => {
    if (!window.confirm('શું તમે ખરેખર આ સેવા કાઢી નાખવા માંગો છો? આનાથી તેની બધી હાજરી પણ કાઢી નાખવામાં આવશે.')) return;
    try {
      await apiRequest(`/api/sevas/${id}`, { method: 'DELETE' });
      setSevas(sevas.filter(s => s._id !== id));
      if (selectedSevaId === id) {
        setSelectedSevaId(null);
        setActiveSevaData(null);
      }
      triggerNotification('સેવા કાઢી નાખવામાં આવી છે');
    } catch (err) {
      triggerNotification(err.message, 'error');
    }
  };

  // Fetch Seva Members
  const fetchSevaMembers = async () => {
    setLoadingSevaMembers(true);
    try {
      const data = await apiRequest('/api/sevas/members');
      setSevaMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      triggerNotification(err.message, 'error');
      setSevaMembers([]);
    } finally {
      setLoadingSevaMembers(false);
    }
  };

  // Add or Edit Seva Member
  const handleSaveSevaMember = async (e) => {
    e.preventDefault();
    if (!sevaMemberName.trim()) {
      triggerNotification('કૃપા કરીને નામ દાખલ કરો', 'warning');
      return;
    }

    setSubmittingSevaMember(true);
    try {
      const finalNameEn = sevaMemberEnName.trim() || transliterateGujaratiToEnglish(sevaMemberName.trim());
      const payload = {
        name: sevaMemberName.trim(),
        nameEn: finalNameEn,
        type: sevaMemberType,
        uniqueCode: sevaMemberUniqueCode.trim(),
        mobileNumber: sevaMemberMobileNumber
      };

      if (editingSevaMember) {
        await apiRequest(`/api/sevas/members/${editingSevaMember._id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        triggerNotification('સેવા સભ્યની વિગતો સફળતાપૂર્વક સુધારાઈ!');
      } else {
        await apiRequest('/api/sevas/members', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        triggerNotification('નવો સેવા સભ્ય સફળતાપૂર્વક ઉમેરાયો!');
      }

      setShowSevaMemberModal(false);
      setSevaMemberName('');
      setSevaMemberEnName('');
      setSevaMemberUniqueCode('');
      setSevaMemberMobileNumber('');
      setEditingSevaMember(null);
      fetchSevaMembers();
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setSubmittingSevaMember(false);
    }
  };

  // Delete Seva Member
  const handleDeleteSevaMember = async (id) => {
    if (!window.confirm('શું તમે ખરેખર આ સેવા સભ્યને કાઢી નાખવા માંગો છો? સભ્યની હાજરી પણ કાઢી નાખવામાં આવશે.')) return;
    try {
      await apiRequest(`/api/sevas/members/${id}`, { method: 'DELETE' });
      triggerNotification('સેવા સભ્ય સફળતાપૂર્વક કાઢી નાખવામાં આવ્યો!');
      fetchSevaMembers();
    } catch (err) {
      triggerNotification(err.message, 'error');
    }
  };

  // Bulk Import Seva Members
  const handleBulkSevaMemberImport = async () => {
    if (!bulkSevaMemberText.trim()) {
      triggerNotification('કૃપા કરીને પહેલા માહિતી ઉમેરો', 'warning');
      return;
    }

    setImportingBulkSevaMember(true);
    setBulkSevaMemberImportProgress(10);
    setBulkSevaMemberResult(null);

    const lines = bulkSevaMemberText.split('\n');
    const importList = [];

    setBulkSevaMemberImportProgress(30);

    lines.forEach((line) => {
      if (!line.trim()) return;
      const parts = line.split(',');
      if (parts.length >= 3) {
        importList.push({
          name: parts[0].trim(),
          type: parts[1].trim().toLowerCase(),
          uniqueCode: parts[2].trim()
        });
      }
    });

    if (importList.length === 0) {
      setImportingBulkSevaMember(false);
      triggerNotification('કોઈ યોગ્ય લાઇન મળી નથી. ફોર્મેટ: નામ, પ્રકાર, કોડ હોવું જરૂરી છે.', 'error');
      return;
    }

    setBulkSevaMemberImportProgress(60);

    try {
      const res = await apiRequest('/api/sevas/members/bulk', {
        method: 'POST',
        body: JSON.stringify({ members: importList })
      });

      setBulkSevaMemberImportProgress(100);
      setBulkSevaMemberResult(res);
      triggerNotification(`${res.successCount} સેવા સભ્યો સફળતાપૂર્વક ઉમેરાયા!`);
      setBulkSevaMemberText('');
      fetchSevaMembers();
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setImportingBulkSevaMember(false);
    }
  };

  // Handle Excel file selection for seva members
  const handleExcelSevaFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setExcelSevaFileName(file.name);
    setBulkSevaMemberResult(null);
    try {
      const parsed = await parseExcelMembers(file, true);
      setParsedExcelSevaMembers(parsed);
      triggerNotification(`${parsed.length} સેવા સભ્યો ફાઇલમાં જોવા મળ્યા.`, 'info');
    } catch (err) {
      triggerNotification(err.message, 'error');
      setExcelSevaFileName('');
      setParsedExcelSevaMembers([]);
    }
  };

  // Submit bulk Excel parsed list for seva members
  const handleBulkExcelSevaImport = async () => {
    if (parsedExcelSevaMembers.length === 0) {
      triggerNotification('કોઈ યોગ્ય માહિતી અપલોડ કરવા માટે નથી', 'warning');
      return;
    }

    setImportingBulkSevaMember(true);
    setBulkSevaMemberImportProgress(20);
    setBulkSevaMemberResult(null);

    try {
      setBulkSevaMemberImportProgress(50);
      const res = await apiRequest('/api/sevas/members/bulk', {
        method: 'POST',
        body: JSON.stringify({ members: parsedExcelSevaMembers })
      });

      setBulkSevaMemberImportProgress(100);
      setBulkSevaMemberResult(res);
      triggerNotification(`${res.successCount} સેવા સભ્યો સફળતાપૂર્વક ઉમેરાયા!`);
      setParsedExcelSevaMembers([]);
      setExcelSevaFileName('');
      fetchSevaMembers();
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setImportingBulkSevaMember(false);
    }
  };

  // Load a Seva for attendance marking
  const loadSevaAttendance = async (sevaId) => {
    loadedSevaIdRef.current = null;
    setSelectedSevaId(sevaId);
    setLoadingSevaAttendance(true);
    try {
      const data = await apiRequest(`/api/sevas/${sevaId}`);
      setActiveSevaData(data.seva);

      // Convert backend attendance list to a local object map
      const recordsMap = {};
      data.attendance.forEach(rec => {
        if (rec.member) {
          const memberId = typeof rec.member === 'object' ? rec.member._id : rec.member;
          recordsMap[memberId] = {
            status: rec.status,
            hours: rec.hours
          };
        }
      });

      // For members with no attendance record, default to 'absent' and 0 hours
      sevaMembers.forEach(member => {
        if (!recordsMap[member._id]) {
          recordsMap[member._id] = {
            status: 'absent',
            hours: 0
          };
        }
      });

      // Store baseline DB records before applying any local draft overlays
      dbSevaRecordsRef.current = JSON.parse(JSON.stringify(recordsMap));

      // Check if local draft exists in localStorage
      const storedDraft = localStorage.getItem(`seva_draft_${sevaId}`);
      if (storedDraft) {
        try {
          const parsedDraft = JSON.parse(storedDraft);
          Object.assign(recordsMap, parsedDraft);
          triggerNotification('અણસાચવેલ સેવા હાજરી ડ્રાફ્ટ લોડ થયો છે');
        } catch (e) {
          console.error('Error parsing seva draft', e);
        }
      }

      setSevaAttendanceRecords(recordsMap);
      loadedSevaIdRef.current = sevaId;
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setLoadingSevaAttendance(false);
    }
  };

  const handleDiscardSevaDraft = () => {
    if (!selectedSevaId) return;
    if (!window.confirm('શું તમે ખરેખર સેવા અણસાચવેલ ડ્રાફ્ટ કાઢી નાખવા માંગો છો?')) return;
    clearSevaDraft();
    localStorage.removeItem(`seva_draft_${selectedSevaId}`);
    loadSevaAttendance(selectedSevaId);
    triggerNotification('સેવા ડ્રાફ્ટ રદ કરવામાં આવ્યો છે', 'info');
  };

  // Toggle present/absent for a member in Seva
  const toggleSevaAttendanceStatus = (memberId) => {
    setSevaAttendanceRecords(prev => {
      const current = prev[memberId] || { status: 'absent', hours: 0 };
      const newStatus = current.status === 'present' ? 'absent' : 'present';
      return {
        ...prev,
        [memberId]: {
          status: newStatus,
          hours: newStatus === 'present' ? 1 : 0 // default 1 hour when marked present
        }
      };
    });
  };

  // Update hours for a member
  const handleSevaHoursChange = (memberId, hoursVal) => {
    const hours = parseFloat(hoursVal) || 0;
    setSevaAttendanceRecords(prev => ({
      ...prev,
      [memberId]: {
        ...(prev[memberId] || { status: 'present' }),
        hours: hours
      }
    }));
  };

  // Save Seva Attendance
  const handleSaveSevaAttendance = async () => {
    if (!selectedSevaId) return;
    setSavingSevaAttendance(true);
    try {
      // Format records array for backend
      const attendanceRecords = Object.keys(sevaAttendanceRecords).map(memberId => ({
        memberId,
        status: sevaAttendanceRecords[memberId].status,
        hours: sevaAttendanceRecords[memberId].hours
      }));

      await apiRequest(`/api/sevas/${selectedSevaId}/attendance`, {
        method: 'POST',
        body: JSON.stringify({ attendanceRecords })
      });

      dbSevaRecordsRef.current = JSON.parse(JSON.stringify(sevaAttendanceRecords));
      clearSevaDraft();
      localStorage.removeItem(`seva_draft_${selectedSevaId}`);
      triggerNotification('હાજરી સફળતાપૂર્વક સાચવવામાં આવી છે');
      // Refresh statistics/reports
      fetchSevaReports();
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setSavingSevaAttendance(false);
    }
  };

  useEffect(() => {
    if (members.length > 0 && displayMembers.length === 0) {
      const sorted = [...members].sort((a, b) => a.name.localeCompare(b.name, 'gu'));
      setDisplayMembers(sorted);
    }
  }, [members]);

  // Auto-hide notifications
  const triggerNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const success = await login(username, password);
    if (!success) {
      triggerNotification('લોગિન નિષ્ફળ: યુઝરનેમ અથવા પાસવર્ડ ખોટો છે', 'error');
    } else {
      triggerNotification('સુપરએડમિન લૉગિન સફળ થયું');
    }
  };

  const fetchMembers = async () => {
    setLoadingMembers(true);
    try {
      const data = await apiRequest(`/api/members?search=${encodeURIComponent(memberSearch.trim())}&type=${memberTypeFilter}`);
      setMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      triggerNotification(err.message, 'error');
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    if (token) {
      const delayDebounce = setTimeout(() => {
        fetchMembers();
      }, 300);
      return () => clearTimeout(delayDebounce);
    }
  }, [memberSearch, memberTypeFilter]);

  const fetchEvents = async () => {
    setLoadingEvents(true);
    try {
      const data = await apiRequest('/api/events');
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      triggerNotification(err.message, 'error');
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchDashboardStats = async () => {
    setLoadingStats(true);
    try {
      const data = await apiRequest('/api/reports/dashboard');
      setDashboardStats(data);
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setLoadingStats(false);
    }
  };

  // Create or Update Event
  const handleSaveEvent = async (e) => {
    e.preventDefault();
    setCreatingEvent(true);
    try {
      let parsedMinReachTime = '';
      if (eventType === 'ravi_sabha') {
        const timeParts = eventMinReachTimeText.trim().split(':');
        let hours = parseInt(timeParts[0], 10) || 10;
        const minutes = parseInt(timeParts[1], 10) || 0;

        if (eventMinReachTimePeriod === 'PM' && hours < 12) {
          hours += 12;
        } else if (eventMinReachTimePeriod === 'AM' && hours === 12) {
          hours = 0;
        }

        parsedMinReachTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      }

      const body = {
        date: eventDate,
        type: eventType,
        minReachTime: parsedMinReachTime
      };

      let savedEvent;
      if (editingEventId) {
        savedEvent = await apiRequest(`/api/events/${editingEventId}`, {
          method: 'PUT',
          body: JSON.stringify(body)
        });
        triggerNotification('સભા માહિતી સફળતાપૂર્વક અપડેટ કરી');
      } else {
        savedEvent = await apiRequest('/api/events', {
          method: 'POST',
          body: JSON.stringify(body)
        });
        triggerNotification('નવી સભા સફળતાપૂર્વક શરૂ કરવામાં આવી છે');
      }

      setShowEventModal(false);
      setEditingEventId(null);
      fetchEvents();
      fetchDashboardStats();
      loadEventAttendance(savedEvent._id);
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setCreatingEvent(false);
    }
  };

  // Delete Event Trigger
  const handleDeleteEvent = async (id, e) => {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    setEventToDelete(id);
  };

  // Custom Confirmation Delete Execution
  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    try {
      await apiRequest(`/api/events/${eventToDelete}`, { method: 'DELETE' });
      triggerNotification('સભા સફળતાપૂર્વક રદ કરવામાં આવી છે');
      if (selectedEventId === eventToDelete) {
        setSelectedEventId(null);
        setActiveEventData(null);
        setAttendanceRecords({});
      }
      fetchEvents();
      fetchDashboardStats();
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setEventToDelete(null);
    }
  };

  // Load Event and populate Attendance status
  const loadEventAttendance = async (eventId) => {
    loadedEventIdRef.current = null;
    setSelectedEventId(eventId);
    setLoadingEventAttendance(true);
    try {
      const data = await apiRequest(`/api/events/${eventId}`);
      setActiveEventData(data.event);

      // Setup initial records state
      const records = {};

      // First populate with default absent for all members
      members.forEach(member => {
        records[member._id] = {
          memberId: member._id,
          status: 'absent',
          arrivalTime: null,
          isLate: false,
          remark: ''
        };
      });

      // Override with existing saved records from DB
      data.attendance.forEach(record => {
        if (record.member) {
          records[record.member._id] = {
            memberId: record.member._id,
            status: record.status,
            arrivalTime: record.arrivalTime ? new Date(record.arrivalTime) : null,
            isLate: record.isLate,
            remark: record.remark || ''
          };
        }
      });

      // Store baseline DB records before applying any local draft overlays
      dbSabhaRecordsRef.current = JSON.parse(JSON.stringify(records));

      // Check if local draft exists in localStorage (indefinite persistence)
      const storedDraft = localStorage.getItem(`sabha_draft_${eventId}`);
      if (storedDraft) {
        try {
          const parsedDraft = JSON.parse(storedDraft);
          Object.keys(parsedDraft).forEach(mId => {
            records[mId] = {
              ...records[mId],
              ...parsedDraft[mId],
              arrivalTime: parsedDraft[mId].arrivalTime ? new Date(parsedDraft[mId].arrivalTime) : null
            };
          });
          triggerNotification('અણસાચવેલ સભા હાજરી ડ્રાફ્ટ લોડ થયો છે');
        } catch (e) {
          console.error('Error parsing sabha draft', e);
        }
      }

      // Compute static sorted list at load time (Present sorted by arrivalTime first, then Absent alphabetically)
      const sorted = [...members].sort((a, b) => {
        const recA = records[a._id] || { status: 'absent' };
        const recB = records[b._id] || { status: 'absent' };

        const isPresentA = recA.status === 'present';
        const isPresentB = recB.status === 'present';

        if (isPresentA && !isPresentB) return -1;
        if (!isPresentA && isPresentB) return 1;

        if (isPresentA && isPresentB) {
          const timeA = recA.arrivalTime ? new Date(recA.arrivalTime).getTime() : 0;
          const timeB = recB.arrivalTime ? new Date(recB.arrivalTime).getTime() : 0;
          return timeA - timeB;
        }

        return a.name.localeCompare(b.name, 'gu');
      });
      setDisplayMembers(sorted);
      setAttendanceRecords(records);
      loadedEventIdRef.current = eventId;
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setLoadingEventAttendance(false);
    }
  };

  const handleDiscardSabhaDraft = () => {
    if (!selectedEventId) return;
    if (!window.confirm('શું તમે ખરેખર સભા અણસાચવેલ ડ્રાફ્ટ કાઢી નાખવા માંગો છો?')) return;
    clearSabhaDraft();
    localStorage.removeItem(`sabha_draft_${selectedEventId}`);
    loadEventAttendance(selectedEventId);
    triggerNotification('સભા ડ્રાફ્ટ રદ કરવામાં આવ્યો છે', 'info');
  };

  // Quick switch active sabha tab (Savar Katha vs Ravi Sabha)
  useEffect(() => {
    loadedEventIdRef.current = null;
    setSelectedEventId(null);
    setActiveEventData(null);
    setAttendanceRecords({});
  }, [sabhaTab]);

  // Compute Lateness
  const checkIsLate = (arrivalTime, minReachTime) => {
    if (!minReachTime) return false;
    const [targetHours, targetMinutes] = minReachTime.split(':').map(Number);
    const arrTime = new Date(arrivalTime);

    const arrHours = arrTime.getHours();
    const arrMinutes = arrTime.getMinutes();

    if (arrHours > targetHours) return true;
    if (arrHours < targetHours) return false;
    return arrMinutes > targetMinutes;
  };

  // Ticking Present / Absent event - FAST UI ACTION
  const markAttendance = (memberId, status) => {
    setAttendanceRecords(prev => {
      const current = { ...prev[memberId] } || { memberId };
      current.status = status;

      if (status === 'present') {
        const timeNow = new Date();
        current.arrivalTime = timeNow;

        // Compute lateness for Ravi Sabha
        if (activeEventData && activeEventData.type === 'ravi_sabha') {
          current.isLate = checkIsLate(timeNow, activeEventData.minReachTime);
        } else {
          current.isLate = false;
        }
      } else {
        current.arrivalTime = null;
        current.isLate = false;
        current.remark = '';
      }

      return {
        ...prev,
        [memberId]: current
      };
    });
  };

  // Update late remark on local state
  const handleRemarkChange = (memberId, val) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        remark: val
      }
    }));
  };

  // Submit Bulk Attendance to Backend
  const handleSubmitAttendance = async () => {
    if (!selectedEventId) return;
    setSavingAttendance(true);
    setAttendanceProgress(20);

    try {
      const recordsArray = Object.values(attendanceRecords).map(rec => ({
        ...rec,
        remark: rec.remark ? transliterateEnglishToGujarati(rec.remark.toString().trim()) : ''
      }));
      setAttendanceProgress(50);

      await apiRequest('/api/attendance/bulk', {
        method: 'POST',
        body: JSON.stringify({
          eventId: selectedEventId,
          records: recordsArray
        })
      });

      dbSabhaRecordsRef.current = JSON.parse(JSON.stringify(attendanceRecords));
      clearSabhaDraft();
      localStorage.removeItem(`sabha_draft_${selectedEventId}`);
      setAttendanceProgress(100);
      setTimeout(() => {
        setSavingAttendance(false);
        setAttendanceProgress(0);
        triggerNotification('હાજરી પત્રક સફળતાપૂર્વક સાચવી લેવામાં આવ્યું છે');
        fetchDashboardStats();
        loadEventAttendance(selectedEventId); // Sorts present members to top by arrival time upon submit
      }, 500);
    } catch (err) {
      setSavingAttendance(false);
      setAttendanceProgress(0);
      triggerNotification(err.message, 'error');
    }
  };

  // Save single Member CRUD
  const handleSaveMember = async (e) => {
    e.preventDefault();
    setSubmittingMember(true);
    try {
      const finalNameEn = memberEnName.trim() || transliterateGujaratiToEnglish(memberName.trim());
      const body = {
        name: memberName.trim(),
        nameEn: finalNameEn,
        type: memberType,
        uniqueCode: memberCode,
        mobileNumber: memberMobileNumber
      };

      if (editingMember) {
        await apiRequest(`/api/members/${editingMember._id}`, {
          method: 'PUT',
          body: JSON.stringify(body)
        });
        triggerNotification('સભ્ય વિગતો સફળતાપૂર્વક સુધારી લેવામાં આવી છે');
      } else {
        await apiRequest('/api/members', {
          method: 'POST',
          body: JSON.stringify(body)
        });
        triggerNotification('નવો સભ્ય સફળતાપૂર્વક ઉમેરાઈ ગયો છે');
      }

      setShowMemberModal(false);
      setEditingMember(null);
      setMemberName('');
      setMemberEnName('');
      setMemberCode('');
      setMemberMobileNumber('');
      fetchMembers();
      fetchDashboardStats();
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setSubmittingMember(false);
    }
  };

  // Edit member dialog triggers
  const triggerEditMember = (member) => {
    setEditingMember(member);
    setMemberName(member.name);
    setMemberEnName(member.nameEn || transliterateGujaratiToEnglish(member.name));
    setMemberType(member.type);
    setMemberCode(member.uniqueCode);
    setMemberMobileNumber(member.mobileNumber || '');
    setShowMemberModal(true);
  };

  // Delete Member
  const handleDeleteMember = async (id) => {
    if (!window.confirm('શું તમે ખરેખર આ સભ્યને કાઢી નાખવા માંગો છો? આનાથી તેમની હાજરીનો રેકોર્ડ પણ નીકળી જશે.')) return;
    try {
      await apiRequest(`/api/members/${id}`, { method: 'DELETE' });
      triggerNotification('સભ્યને સફળતાપૂર્વક કાઢી નાખવામાં આવ્યો છે');
      fetchMembers();
      fetchDashboardStats();
    } catch (err) {
      triggerNotification(err.message, 'error');
    }
  };

  // Fetch Leaderboard top attendees
  const fetchTopAttendees = async (filterType = leaderboardTypeFilter) => {
    setLoadingTopAttendees(true);
    try {
      const data = await apiRequest(`/api/reports/top-attendees?type=${filterType}`);
      setTopAttendeesData(data);
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setLoadingTopAttendees(false);
    }
  };

  // Fetch Event Specific Attendance details
  const fetchParticularEventReport = async (eventId) => {
    if (!eventId) return;
    setLoadingParticularEvent(true);
    try {
      const data = await apiRequest(`/api/events/${eventId}`);
      setParticularEventReport(data);
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setLoadingParticularEvent(false);
    }
  };

  // Triggers for reports tab loading
  useEffect(() => {
    if (activeTab === 'reports' && reportsSubTab === 'leaderboard') {
      fetchTopAttendees(leaderboardTypeFilter);
    }
  }, [activeTab, reportsSubTab, leaderboardTypeFilter]);

  useEffect(() => {
    if (activeTab === 'reports' && reportsSubTab === 'particular' && selectedParticularEventId) {
      fetchParticularEventReport(selectedParticularEventId);
    }
  }, [activeTab, reportsSubTab, selectedParticularEventId]);

  // Printable actions
  const handlePrintLeaderboard = () => {
    if (!topAttendeesData) return;
    setPrintData({
      title: `રવિસભા શ્રેષ્ઠ અહેવાલ (ટોપ ૧૦ સભ્યો)${leaderboardTypeFilter !== 'all' ? ` - પ્રકાર: ${CATEGORY_LABELS[leaderboardTypeFilter] || leaderboardTypeFilter}` : ''}`,
      type: "leaderboard",
      data: topAttendeesData,
      filterType: leaderboardTypeFilter
    });
    setTimeout(() => {
      window.print();
    }, 250);
  };

  const handlePrintParticularEvent = () => {
    if (!particularEventReport) return;
    const formattedDate = new Date(particularEventReport.event.date).toLocaleDateString('gu-IN');
    const eventTitle = `${SABHA_TYPES[particularEventReport.event.type]} - તારીખ: ${formattedDate}`;

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

    const printList = members.map(m => {
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

    printList.sort((a, b) => {
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

    setPrintData({
      title: `સભા હાજરી વિગત - ${eventTitle}`,
      type: 'particular_event',
      data: printList
    });
    setTimeout(() => {
      window.print();
    }, 250);
  };

  const handlePrintSevaLeaderboard = () => {
    if (sevaTypeLeaderboardData.length === 0) return;

    // Group by Seva Type name
    const grouped = {};
    sevaTypeLeaderboardData.forEach(row => {
      if (!grouped[row.sevaTypeName]) {
        grouped[row.sevaTypeName] = [];
      }
      grouped[row.sevaTypeName].push(row);
    });

    // Take top 10 for each seva type
    const top10ByType = {};
    Object.keys(grouped).forEach(typeName => {
      top10ByType[typeName] = grouped[typeName].slice(0, 10);
    });

    setPrintData({
      title: "સેવાનો પ્રકાર વાઈઝ શ્રેષ્ઠ અહેવાલ (ટોપ ૧૦)",
      type: "seva_leaderboard",
      data: top10ByType
    });
    setTimeout(() => {
      window.print();
    }, 250);
  };

  const handlePrintParticularSeva = () => {
    if (!particularSevaReport) return;
    const formattedDate = new Date(particularSevaReport.seva.date).toLocaleDateString('gu-IN');
    const sevaTitle = `${particularSevaReport.seva.sevaType ? particularSevaReport.seva.sevaType.name : 'સેવા'} - તારીખ: ${formattedDate}`;

    const recordsMap = {};
    particularSevaReport.attendance.forEach(rec => {
      if (rec.member) {
        recordsMap[rec.member._id] = {
          status: rec.status,
          hours: rec.hours
        };
      }
    });

    const printList = sevaMembers.map(m => {
      const att = recordsMap[m._id] || { status: 'absent', hours: 0 };
      return {
        name: m.name,
        uniqueCode: m.uniqueCode,
        type: m.type,
        status: att.status,
        hours: att.hours
      };
    });

    printList.sort((a, b) => {
      const presentA = a.status === 'present';
      const presentB = b.status === 'present';
      if (presentA && !presentB) return -1;
      if (!presentA && presentB) return 1;
      if (presentA && presentB) {
        return b.hours - a.hours;
      }
      return a.name.localeCompare(b.name, 'gu');
    });

    setPrintData({
      title: `સેવા હાજરી વિગત - ${sevaTitle}`,
      type: 'particular_seva',
      data: printList
    });
    setTimeout(() => {
      window.print();
    }, 250);
  };

  // Parse and upload bulk copy paste text
  const handleBulkImport = async () => {
    if (!bulkText.trim()) {
      triggerNotification('કૃપા કરીને પહેલા માહિતી ઉમેરો', 'warning');
      return;
    }

    setImportingBulk(true);
    setBulkImportProgress(10);
    setBulkResult(null);

    // Parsing logic: Split by lines, then commas
    const lines = bulkText.split('\n');
    const importList = [];

    setBulkImportProgress(30);

    lines.forEach((line) => {
      if (!line.trim()) return;
      const parts = line.split(',');
      if (parts.length >= 3) {
        importList.push({
          name: parts[0].trim(),
          type: parts[1].trim().toLowerCase(),
          uniqueCode: parts[2].trim()
        });
      }
    });

    if (importList.length === 0) {
      setImportingBulk(false);
      triggerNotification('કોઈ યોગ્ય લાઇન મળી નથી. ફોર્મેટ: નામ, પ્રકાર, કોડ હોવું જરૂરી છે.', 'error');
      return;
    }

    setBulkImportProgress(60);

    try {
      const res = await apiRequest('/api/members/bulk', {
        method: 'POST',
        body: JSON.stringify({ members: importList })
      });

      setBulkImportProgress(100);
      setBulkResult(res);
      triggerNotification(`${res.successCount} સભ્યો સફળતાપૂર્વક ઉમેરાયા!`);
      setBulkText('');
      fetchMembers();
      fetchDashboardStats();
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setImportingBulk(false);
    }
  };

  // Handle Excel file selection for normal members
  const handleExcelFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setExcelFileName(file.name);
    setBulkResult(null);
    try {
      const parsed = await parseExcelMembers(file, false);
      setParsedExcelMembers(parsed);
      triggerNotification(`${parsed.length} સભ્યો ફાઇલમાં જોવા મળ્યા.`, 'info');
    } catch (err) {
      triggerNotification(err.message, 'error');
      setExcelFileName('');
      setParsedExcelMembers([]);
    }
  };

  // Submit bulk Excel parsed list for normal members
  const handleBulkExcelImport = async () => {
    if (parsedExcelMembers.length === 0) {
      triggerNotification('કોઈ યોગ્ય માહિતી અપલોડ કરવા માટે નથી', 'warning');
      return;
    }

    setImportingBulk(true);
    setBulkImportProgress(20);
    setBulkResult(null);

    try {
      setBulkImportProgress(50);
      const res = await apiRequest('/api/members/bulk', {
        method: 'POST',
        body: JSON.stringify({ members: parsedExcelMembers })
      });

      setBulkImportProgress(100);
      setBulkResult(res);
      triggerNotification(`${res.successCount} સભ્યો સફળતાપૂર્વક ઉમેરાયા!`);
      setParsedExcelMembers([]);
      setExcelFileName('');
      fetchMembers();
      fetchDashboardStats();
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setImportingBulk(false);
    }
  };

  // Fetch individual report
  const loadMemberReport = async (memberId) => {
    setLoadingMemberReport(true);
    try {
      const data = await apiRequest(`/api/reports/member/${memberId}`);
      setSelectedMemberReport(data);
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setLoadingMemberReport(false);
    }
  };

  if (!token) {
    // LOGIN SCREEN
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div className="glass-panel animate-fade-in" style={{ padding: '40px 28px', maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <span className="brand-mark" style={{ width: 60, height: 60, borderRadius: 18, marginBottom: 20 }}>
            <Users size={30} />
          </span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 8, letterSpacing: '-0.025em' }}>સભા વ્યવસ્થાપન</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: 28, lineHeight: 1.6 }}>સવારની કથા અને રવિસભા હાજરી સોફ્ટવેર (સુપરએડમિન પ્રવેશ)</p>

          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18, textAlign: 'left' }}>
            <div>
              <label htmlFor="login-username" className="form-label">વપરાશકર્તા નામ</label>
              <input
                id="login-username"
                type="text"
                className="glass-input"
                placeholder="admin"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="login-password" className="form-label">પાસવર્ડ</label>
              <input
                id="login-password"
                type="password"
                className="glass-input"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {authError && (
              <p role="alert" style={{ color: 'var(--color-danger)', fontSize: '0.85rem', textAlign: 'center', margin: '4px 0' }}>{authError}</p>
            )}

            <button type="submit" className="btn-primary" disabled={authLoading} style={{ marginTop: 8 }}>
              {authLoading ? <SpinnerLoader size={20} /> : 'લોગિન કરો'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Role-aware primary navigation
  // Both superadmin and seva_admin get clean primary navigation items (Attendance, Members, Reports)
  const isSevaUser = user?.role === 'seva_admin';

  const visibleNavItems = [
    { key: 'attendance', label: 'હાજરી', icon: UserCheck },
    { key: 'members', label: 'સભ્યો', icon: Users },
    { key: 'reports', label: 'રીપોર્ટ્સ', icon: TrendingUp }
  ];

  const currentTabKey = isSevaUser ? sevaModuleTab : activeTab;

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
      {/* Header Panel */}
      {!(activeTab === 'attendance' && selectedEventId) && (
        <header className="glass-panel app-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span className="brand-mark" aria-hidden="true">
                <Users size={22} />
              </span>
              <div>
                <h1 className="app-title">પાદરા જ્ઞાન સત્સંગ</h1>
              </div>
            </div>

            <button className="icon-btn" onClick={logout} title="લોગઆઉટ">
              <LogOut size={20} color="#ef4444" />
            </button>
          </div>

          {/* Desktop primary navigation */}
          {visibleNavItems.length > 1 && (
            <nav className="main-nav" aria-label="મુખ્ય નેવિગેશન">
              {visibleNavItems.map(item => (
                <button
                  key={item.key}
                  className={`main-nav-item ${currentTabKey === item.key ? 'active' : ''}`}
                  onClick={() => handleTabClick(item.key)}
                  aria-current={currentTabKey === item.key ? 'page' : undefined}
                >
                  <item.icon size={16} /> {item.label}
                </button>
              ))}
            </nav>
          )}
        </header>
      )}

      {/* --- PANEL 1: ATTENDANCE --- */}
      {activeTab === 'attendance' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Double Tabs for Savar ni Katha vs Ravi Sabha */}
          {!selectedEventId && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div className="segmented-control" style={{ maxWidth: 360, flex: 1 }}>
                <button
                  className={`segmented-button ${sabhaTab === 'savar_ni_katha' ? 'active' : ''}`}
                  onClick={() => setSabhaTab('savar_ni_katha')}
                >
                  સવારની કથા
                </button>
                <button
                  className={`segmented-button ${sabhaTab === 'ravi_sabha' ? 'active' : ''}`}
                  onClick={() => setSabhaTab('ravi_sabha')}
                >
                  રવિસભા
                </button>
              </div>

              <button className="btn-primary" onClick={() => {
                setEditingEventId(null);
                setEventType(sabhaTab);
                setEventMinReachTimeText('10:00');
                setEventMinReachTimePeriod('AM');
                setShowEventModal(true);
              }}>
                <Plus size={18} /> નવી સભા
              </button>
            </div>
          )}

          {!selectedEventId ? (
            <div className="glass-panel animate-fade-in" style={{ padding: 24, minHeight: '600px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>સભા ઈતિહાસ ({SABHA_TYPES[sabhaTab]})</h3>
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
              ) : events.filter(e => e.type === sabhaTab).length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <Calendar size={28} />
                  </div>
                  <p className="empty-state-title">કોઈ સભા મળી નથી</p>
                  <p className="empty-state-desc">ઉપરના બટનથી નવી સભા આયોજિત કરો.</p>
                </div>
              ) : (() => {
                const filteredEvents = events
                  .filter(e => e.type === sabhaTab)
                  .filter(e => {
                    const formattedDate = new Date(e.date).toLocaleDateString('gu-IN', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    });
                    return !eventSearch.trim() || formattedDate.toLowerCase().includes(eventSearch.trim().toLowerCase());
                  });

                if (filteredEvents.length === 0) {
                  return (
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <Search size={28} />
                      </div>
                      <p className="empty-state-title">કોઈ સભા મળી નથી</p>
                    </div>
                  );
                }

                return (
                  <div className="grid-3">
                    {filteredEvents.map(event => {
                      const formattedDate = new Date(event.date).toLocaleDateString('gu-IN', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                      });

                      return (
                        <div
                          key={event._id}
                          className="glass-card glass-panel-hover"
                          onClick={() => loadEventAttendance(event._id)}
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
                                  setEditingEventId(event._id);
                                  setEventDate(new Date(event.date).toISOString().split('T')[0]);
                                  setEventType(event.type);
                                  const timeStr = event.minReachTime || '10:00';
                                  const [hStr, mStr] = timeStr.split(':');
                                  let hours = parseInt(hStr, 10);
                                  const period = hours >= 12 ? 'PM' : 'AM';
                                  hours = hours % 12;
                                  hours = hours ? hours : 12;
                                  setEventMinReachTimeText(`${String(hours).padStart(2, '0')}:${mStr}`);
                                  setEventMinReachTimePeriod(period);
                                  setShowEventModal(true);
                                }}
                                title="સુધારો"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                className="icon-btn icon-btn-danger"
                                onClick={(e) => handleDeleteEvent(event._id, e)}
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
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    if (hasSabhaDraft) {
                      triggerNotification('ડ્રાફ્ટ સાચવેલ છે', 'success');
                    }
                    setSelectedEventId(null);
                  }}
                  style={{ width: 40, height: 40, borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="પાછા જાવ"
                >
                  <ArrowLeft size={20} />
                </button>

                <button
                  className="btn-primary btn-sm"
                  onClick={handleSubmitAttendance}
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
                          {Object.values(attendanceRecords).filter(r => r.status === 'present' && !r.isLate).length}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>OnTime</div>
                      </div>
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-warning)', lineHeight: 1.2 }}>
                          {Object.values(attendanceRecords).filter(r => r.status === 'present' && r.isLate).length}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Late</div>
                      </div>
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-danger)', lineHeight: 1.2 }}>
                          {Object.values(attendanceRecords).filter(r => r.status === 'absent').length}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Absent</div>
                      </div>
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-text-secondary)', lineHeight: 1.2 }}>
                          {Object.values(attendanceRecords).filter(r => r.status === 'excused').length}
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
                          onClick={handleSubmitAttendance}
                          disabled={savingAttendance}
                        >
                          {savingAttendance ? <SpinnerLoader size={14} /> : <UserCheck size={14} />} હવે સબમિટ કરો
                        </button>
                        <button
                          className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          onClick={handleDiscardSabhaDraft}
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
                  ) : (() => {
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

                    if (filteredMembers.length === 0) {
                      return (
                        <div className="empty-state" style={{ padding: '36px 20px' }}>
                          <div className="empty-state-icon" style={{ width: 48, height: 48 }}>
                            <Search size={22} />
                          </div>
                          <p className="empty-state-title" style={{ fontSize: '0.9rem' }}>સર્ચ મુજબ કોઈ સભ્ય મળ્યો નથી</p>
                          <button className="btn-ghost btn-sm" onClick={() => setAttendanceSearch('')}>સર્ચ સાફ કરો</button>
                        </div>
                      );
                    }

                    return (
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

                                {/* Present / Late / Absent / Excused Buttons */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                                  <button
                                    onClick={() => {
                                      markAttendance(member._id, 'present');
                                    }}
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
                    );
                  })()}


                </>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <Calendar size={28} />
                  </div>
                  <p className="empty-state-title">કોઈ સભા પસંદ કરેલી નથી</p>
                  <p className="empty-state-desc">સભા ઈતિહાસમાંથી સભા પસંદ કરો અથવા નવી સભા આયોજિત કરો.</p>
                  <button className="btn-primary" onClick={() => {
                    setEditingEventId(null);
                    setEventType(sabhaTab);
                    setEventMinReachTimeText('10:00');
                    setEventMinReachTimePeriod('AM');
                    setShowEventModal(true);
                  }}>
                    <Plus size={16} /> નવી સભા આયોજિત કરો
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- PANEL 2: MEMBER MANAGEMENT --- */}
      {activeTab === 'members' && (
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
              <button className="btn-secondary" onClick={() => {
                setBulkResult(null);
                setBulkText('');
                setShowBulkModal(true);
              }}>
                <FileSpreadsheet size={16} /> સભ્ય બલ્ક
              </button>

              <button className="btn-primary" onClick={() => {
                setEditingMember(null);
                setMemberName('');
                setMemberEnName('');
                setMemberCode('');
                setMemberType('yuva');
                setShowMemberModal(true);
              }}>
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
          ) : members.length === 0 ? (
            <div className="glass-panel empty-state">
              <div className="empty-state-icon">
                <Users size={28} />
              </div>
              <p className="empty-state-title">કોઈ સભ્ય મળ્યો નથી</p>
              <p className="empty-state-desc">સર્ચ/ફિલ્ટર બદલો અથવા નવો સભ્ય ઉમેરો.</p>
              <button className="btn-primary" onClick={() => {
                setEditingMember(null);
                setMemberName('');
                setMemberEnName('');
                setMemberCode('');
                setMemberType('yuva');
                setShowMemberModal(true);
              }}>
                <UserPlus size={16} /> સભ્ય ઉમેરો
              </button>
            </div>
          ) : (
            <div className="grid-3">
              {[...members].sort((a, b) => a.name.localeCompare(b.name, 'gu')).map(member => (
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
                        onClick={() => triggerEditMember(member)}
                        title="સુધારો"
                        aria-label={`${member.name} સુધારો`}
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        className="icon-btn icon-btn-danger"
                        onClick={() => handleDeleteMember(member._id)}
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
      )}

      {/* --- PANEL 3: REPORTS & ANALYTICS --- */}
      {activeTab === 'reports' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Main stats overview */}
          {dashboardStats ? (
            <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
              <div className="glass-panel" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
                <CircularProgress value={dashboardStats.overallAttendanceRate} size={80} label="કુલ હાજરી" />
                <div>
                  <h4 style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>કુલ નોંધાયેલ સભ્યો</h4>
                  <p style={{ fontSize: '2rem', fontWeight: 800, marginTop: 4 }}>{dashboardStats.totalMembers}</p>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
                <CircularProgress value={dashboardStats.savarKathaRate} size={80} label="સવારની કથા" />
                <div>
                  <h4 style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>સવારની કથા રેટ</h4>
                  <p style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: 4, color: 'var(--color-secondary)' }}>
                    હાજર: {Math.round(dashboardStats.savarKathaRate)}%
                  </p>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
                <CircularProgress value={dashboardStats.raviSabhaRate} size={80} label="રવિસભા" />
                <div>
                  <h4 style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>રવિસભા રેટ</h4>
                  {dashboardStats.raviSabhaLateRate > 0 && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-warning)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertTriangle size={12} /> મોડા આવનાર: {dashboardStats.raviSabhaLateRate}%
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          )}

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
            <div className="reports-main-grid">
              {/* Search list of members */}
              <div className="glass-panel" id="sabha-member-report-search" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>સભ્ય પ્રોગ્રેસ રીપોર્ટ</h3>
                <div className="search-field">
                  <Search className="search-icon" size={16} />
                  <input
                    type="text"
                    className="glass-input"
                    style={{ fontSize: '0.9rem' }}
                    placeholder="સભ્ય શોધો..."
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '350px', overflowY: 'auto', paddingRight: 4 }}>
                  {sortMembersBySearchRank(
                    members.filter(m => {
                      if (!reportSearch.trim()) return true;
                      const q = reportSearch.toLowerCase();
                      return (
                        m.name.toLowerCase().includes(q) ||
                        (m.nameEn && m.nameEn.toLowerCase().includes(q)) ||
                        (m.uniqueCode && m.uniqueCode.toLowerCase().includes(q))
                      );
                    }),
                    reportSearch
                  )
                    .map(member => {
                      const isSelected = selectedMemberReport && selectedMemberReport.member._id === member._id;
                      return (
                        <div
                          key={member._id}
                          onClick={() => {
                            loadMemberReport(member._id);
                            if (window.innerWidth < 768) {
                              setTimeout(() => {
                                document.getElementById('sabha-member-report-detail')?.scrollIntoView({ behavior: 'smooth' });
                              }, 150);
                            }
                          }}
                          className="glass-card"
                          style={{
                            cursor: 'pointer',
                            background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255,255,255,0.01)',
                            borderLeft: isSelected ? '4px solid var(--color-primary)' : '1px solid var(--glass-border)',
                            padding: 10
                          }}
                        >
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                            {member.name}
                            {member.nameEn && (
                              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginLeft: 6, fontWeight: 400 }}>
                                ({member.nameEn})
                              </span>
                            )}
                          </h4>
                          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                            કોડ: {member.uniqueCode} | {CATEGORY_TAGS[member.type]}
                          </p>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Detailed profile visualization */}
              <div className="glass-panel" id="sabha-member-report-detail" style={{ padding: 24 }}>
                {loadingMemberReport ? (
                  <SkeletonText rows={6} />
                ) : selectedMemberReport ? (
                  <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <button
                      className="btn-secondary btn-sm mobile-only"
                      style={{ alignSelf: 'flex-start' }}
                      onClick={() => document.getElementById('sabha-member-report-search')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                      ← સભ્ય યાદી જુઓ
                    </button>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: 16, flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
                      <div style={{ minWidth: 200 }}>
                        <span className="badge badge-primary">
                          {CATEGORY_LABELS[selectedMemberReport.member.type]}
                        </span>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 6, letterSpacing: '-0.01em', wordBreak: 'break-word' }}>{selectedMemberReport.member.name}</h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: 2, fontFamily: 'monospace' }}>
                          યુનિક આઈડી કોડ: {selectedMemberReport.member.uniqueCode}
                        </p>
                      </div>

                      <CircularProgress value={selectedMemberReport.stats.attendanceRate} size={90} label="હાજરી દર" />
                    </div>

                    {/* Summary Grid stats */}
                    <div className="stats-cards-grid" style={{ textAlign: 'center' }}>
                      <div className="glass-card">
                        <h5 style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>હાજર સભા</h5>
                        <p style={{ fontSize: '1.3rem', fontWeight: 700, marginTop: 4, color: 'var(--color-success)' }}>
                          {selectedMemberReport.stats.present} / {selectedMemberReport.stats.totalEvents}
                        </p>
                      </div>
                      <div className="glass-card">
                        <h5 style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>ગેરહાજર સભા</h5>
                        <p style={{ fontSize: '1.3rem', fontWeight: 700, marginTop: 4, color: 'var(--color-danger)' }}>
                          {selectedMemberReport.stats.absent}
                        </p>
                      </div>
                      <div className="glass-card">
                        <h5 style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>મોડા આવ્યા</h5>
                        <p style={{ fontSize: '1.3rem', fontWeight: 700, marginTop: 4, color: 'var(--color-warning)' }}>
                          {selectedMemberReport.stats.late}
                        </p>
                      </div>
                    </div>

                    {/* Attendance Calendar Heatmap Grid */}
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12, color: 'var(--color-text-secondary)' }}>હાજરી કેલેન્ડર ફ્લો</h3>
                      {selectedMemberReport.history.length === 0 ? (
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>આ સભ્યની કોઈ સભાની હાજરી નોંધાયેલી નથી.</p>
                      ) : (
                        <>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                            {selectedMemberReport.history.map((log) => {
                              const dateStr = new Date(log.date).toLocaleDateString('gu-IN', { day: 'numeric', month: 'short' });
                              let color = 'var(--color-danger)';
                              let title = `${dateStr}: ગેરહાજર`;

                              if (log.status === 'present') {
                                if (log.isLate) {
                                  color = 'var(--color-warning)';
                                  title = `${dateStr}: હાજર (મોડા પડ્યા)`;
                                } else {
                                  color = 'var(--color-success)';
                                  title = `${dateStr}: હાજર`;
                                }
                              }

                              return (
                                <div
                                  key={log._id}
                                  style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 6,
                                    background: color,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    color: '#fff',
                                    cursor: 'pointer'
                                  }}
                                  title={title}
                                >
                                  {log.type === 'savar_ni_katha' ? 'સ' : 'ર'}
                                </div>
                              );
                            })}
                          </div>
                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--color-success)' }} /> હાજર
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--color-warning)' }} /> મોડા પડ્યા
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--color-danger)' }} /> ગેરહાજર
                            </span>
                            <span>(સ: સવારની કથા, ર: રવિસભા)</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Late Arrival Remarks Log */}
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 10, color: 'var(--color-text-secondary)' }}>મોડા આવવાના રીમાર્કસ (નોંધ)</h3>
                      {selectedMemberReport.remarks.length === 0 ? (
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>આ સભ્ય સભામાં ક્યારેય મોડા પડ્યા નથી.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '180px', overflowY: 'auto' }}>
                          {selectedMemberReport.remarks.map((rem, idx) => (
                            <div key={idx} className="glass-card" style={{ padding: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>
                                {new Date(rem.date).toLocaleDateString('gu-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </span>
                              <span style={{ fontSize: '0.85rem', color: 'var(--color-warning)', fontStyle: 'italic', wordBreak: 'break-word' }}>
                                &ldquo;{rem.remark}&rdquo;
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <TrendingUp size={28} />
                    </div>
                    <p className="empty-state-title">કોઈ સભ્ય પસંદ કરેલ નથી</p>
                    <p className="empty-state-desc" style={{ marginBottom: 0 }}>ડાબી બાજુની યાદીમાંથી સભ્ય પસંદ કરવાથી તેમનો પ્રોગ્રેસ રિપોર્ટ અહીં દેખાશે.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sub Tab 2: Leaderboard */}
          {reportsSubTab === 'leaderboard' && (
            <div className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="panel-header" style={{ flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h3 className="panel-title">રવિસભા શ્રેષ્ઠ અહેવાલ (ટોપ ૧૦)</h3>
                  <p className="panel-subtitle">રવિસભામાં સમયસર અને મોડા પહોંચનાર સભ્યોનું સરેરાશ સમય પત્રક</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                      સભા સભ્ય પ્રકાર:
                    </label>
                    <select
                      className="glass-input"
                      style={{ padding: '6px 12px', minWidth: 140 }}
                      value={leaderboardTypeFilter}
                      onChange={(e) => setLeaderboardTypeFilter(e.target.value)}
                    >
                      {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    className="btn-primary"
                    onClick={handlePrintLeaderboard}
                    disabled={loadingTopAttendees || !topAttendeesData}
                  >
                    <Printer size={16} /> પ્રિન્ટ / PDF ડાઉનલોડ
                  </button>
                </div>
              </div>

              {loadingTopAttendees ? (
                <SkeletonText rows={8} />
              ) : topAttendeesData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {/* Table 1: Early / On-Time AVG Time Top 10 */}
                  <div className="glass-card" style={{ overflowX: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid var(--glass-border)', paddingBottom: 8 }}>
                      <div>
                        <h4 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-primary)', margin: 0 }}>
                          ૧. રવિસભા: સમયસર / વહેલા પહોંચનાર શ્રેષ્ઠ ૧૦ (વહેલા સરેરાશ સમય મુજબ)
                        </h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: 0, marginTop: 2 }}>
                          રવિસભામાં સૌથી વહેલા સરેરાશ પહોંચવાનો સમય ધરાવતા સભ્યો
                        </p>
                      </div>
                      <span className="badge badge-primary">
                        {topAttendeesData.raviTopGroups ? `${topAttendeesData.raviTopGroups.length} રેન્ક` : '૦'}
                      </span>
                    </div>

                    {(!topAttendeesData.raviTopGroups || topAttendeesData.raviTopGroups.length === 0) ? (
                      <p style={{ padding: '16px 8px', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                        આ કેટેગરીમાં રવિસભામાં વહેલા/સમયસર પહોંચવાનો સમય નોંધાયેલ હોય તેવા કોઈ સભ્યો મળ્યા નથી.
                      </p>
                    ) : (
                      <table className="mini-table">
                        <thead>
                          <tr>
                            <th style={{ textAlign: 'center', width: 90 }}>ક્રમ (સંખ્યા)</th>
                            <th style={{ textAlign: 'left' }}>સભ્ય / સભ્યોનું નામ</th>
                            <th style={{ textAlign: 'center', width: 140 }}>સરેરાશ સમય (AVG Time)</th>
                            <th style={{ textAlign: 'right', width: 120 }}>સભા હાજરી</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topAttendeesData.raviTopGroups.map((group) => (
                            <tr key={group.rank}>
                              <td style={{ textAlign: 'center' }}>
                                <span
                                  className="badge"
                                  style={{
                                    fontWeight: 700,
                                    fontSize: '0.88rem',
                                    padding: '4px 10px',
                                    background: group.rank <= 3 ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.05)',
                                    color: group.rank <= 3 ? 'var(--color-primary)' : 'inherit',
                                    border: group.rank <= 3 ? '1px solid var(--color-primary)' : '1px solid var(--glass-border)'
                                  }}
                                >
                                  {group.rankLabel}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  {group.members.map((m) => (
                                    <div key={m._id} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                      <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{m.name}</span>
                                      {m.nameEn && (
                                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                          ({m.nameEn})
                                        </span>
                                      )}
                                      <span className="badge badge-secondary" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>
                                        {CATEGORY_TAGS[m.type] || m.type}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <span
                                  className="badge badge-success"
                                  style={{ fontWeight: 700, fontSize: '0.9rem', padding: '4px 10px' }}
                                >
                                  {group.avgTime}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                {group.members.map(m => m.count).join(', ')} સભા
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Table 2: Late AVG Time Top 10 */}
                  <div className="glass-card" style={{ overflowX: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid var(--glass-border)', paddingBottom: 8 }}>
                      <div>
                        <h4 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-warning)', margin: 0 }}>
                          ૨. રવિસભા: મોડા પડનાર ૧૦ સભ્યો (મોડા સરેરાશ સમય મુજબ)
                        </h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: 0, marginTop: 2 }}>
                          રવિસભામાં સૌથી મોડા સરેરાશ પહોંચવાનો સમય ધરાવતા સભ્યો
                        </p>
                      </div>
                      <span className="badge badge-warning">
                        {topAttendeesData.raviLateGroups ? `${topAttendeesData.raviLateGroups.length} રેન્ક` : '૦'}
                      </span>
                    </div>

                    {(!topAttendeesData.raviLateGroups || topAttendeesData.raviLateGroups.length === 0) ? (
                      <p style={{ padding: '16px 8px', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                        આ કેટેગરીમાં રવિસભામાં મોડા પડ્યા હોય તેવા કોઈ સભ્યો મળ્યા નથી.
                      </p>
                    ) : (
                      <table className="mini-table">
                        <thead>
                          <tr>
                            <th style={{ textAlign: 'center', width: 90 }}>ક્રમ (સંખ્યા)</th>
                            <th style={{ textAlign: 'left' }}>સભ્ય / સભ્યોનું નામ</th>
                            <th style={{ textAlign: 'center', width: 140 }}>સરેરાશ સમય (AVG Time)</th>
                            <th style={{ textAlign: 'right', width: 120 }}>મોડા પડ્યા</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topAttendeesData.raviLateGroups.map((group) => (
                            <tr key={group.rank}>
                              <td style={{ textAlign: 'center' }}>
                                <span
                                  className="badge"
                                  style={{
                                    fontWeight: 700,
                                    fontSize: '0.88rem',
                                    padding: '4px 10px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    color: 'var(--color-danger)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)'
                                  }}
                                >
                                  {group.rankLabel}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  {group.members.map((m) => (
                                    <div key={m._id} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                      <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{m.name}</span>
                                      {m.nameEn && (
                                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                          ({m.nameEn})
                                        </span>
                                      )}
                                      <span className="badge badge-secondary" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>
                                        {CATEGORY_TAGS[m.type] || m.type}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <span
                                  className="badge badge-danger"
                                  style={{ fontWeight: 700, fontSize: '0.9rem', padding: '4px 10px' }}
                                >
                                  {group.avgTime}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-danger)' }}>
                                {group.members.map(m => m.count).join(', ')} વખત
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '36px 20px' }}>
                  <div className="empty-state-icon" style={{ width: 48, height: 48 }}>
                    <AlertTriangle size={22} />
                  </div>
                  <p className="empty-state-title" style={{ fontSize: '0.9rem' }}>રેકોર્ડ મેળવવામાં ભૂલ થઈ છે</p>
                  <button className="btn-secondary btn-sm" onClick={fetchTopAttendees}>ફરી પ્રયત્ન કરો</button>
                </div>
              )}
            </div>
          )}

          {/* Sub Tab 3: Particular Sabha Report */}
          {reportsSubTab === 'particular' && (
            <div className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="panel-header">
                <div>
                  <h3 className="panel-title">વિશિષ્ટ સભા વિગતવાર રિપોર્ટ</h3>
                  <p className="panel-subtitle">કોઈ ચોક્કસ સભા તારીખનો સંપૂર્ણ રિપોર્ટ મેળવો</p>
                </div>
                {particularEventReport && (
                  <button
                    className="btn-primary"
                    onClick={handlePrintParticularEvent}
                  >
                    પ્રિન્ટ / PDF ડાઉનલોડ
                  </button>
                )}
              </div>

              <div>
                <label className="form-label">રિપોર્ટ માટે સભા પસંદ કરો:</label>
                <select
                  className="glass-input"
                  value={selectedParticularEventId}
                  onChange={(e) => setSelectedParticularEventId(e.target.value)}
                >
                  <option value="">-- સભા પસંદ કરો (તારીખ અને પ્રકાર) --</option>
                  {events.map(event => (
                    <option key={event._id} value={event._id}>
                      {new Date(event.date).toLocaleDateString('gu-IN', { year: 'numeric', month: 'long', day: 'numeric' })} - {SABHA_TYPES[event.type]} {event.minReachTime ? `(${formatTime12h(event.minReachTime)})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {loadingParticularEvent ? (
                <SkeletonText rows={6} />
              ) : particularEventReport ? (() => {
                // Compile records list
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

                // Prepare a combined list
                const combinedList = members.map(m => {
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

                // Sort: Present first (sorted by arrival time), then Absent alphabetically
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

                return (
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
                                <td>{CATEGORY_TAGS[m.type]}</td>
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
                );
              })() : (
                <div className="empty-state" style={{ padding: '36px 20px' }}>
                  <div className="empty-state-icon" style={{ width: 48, height: 48 }}>
                    <Calendar size={22} />
                  </div>
                  <p className="empty-state-title" style={{ fontSize: '0.9rem' }}>સભા પસંદ કરો</p>
                  <p className="empty-state-desc" style={{ marginBottom: 0 }}>ઉપરના ડ્રોપડાઉનમાંથી સભા પસંદ કરવાથી સંપૂર્ણ રિપોર્ટ અહીં દેખાશે.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- PANEL 4: SEVA MANAGEMENT --- */}
      {activeTab === 'seva' && (
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
                        onClick={() => {
                          setSevaDate(new Date().toISOString().split('T')[0]);
                          setSevaTypeId('');
                          setSevaLeader('');
                          setShowSevaModal(true);
                        }}
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
                              onClick={() => loadSevaAttendance(seva._id)}
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
                                      handleDeleteSeva(seva._id);
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
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        setSelectedSevaId(null);
                      }}
                      style={{ width: 40, height: 40, borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="પાછા જાવ"
                    >
                      <ArrowLeft size={20} />
                    </button>

                    <button
                      className="btn-primary btn-sm"
                      onClick={handleSaveSevaAttendance}
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
                              {Object.values(sevaAttendanceRecords).filter(r => r.status === 'present').length}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Present</div>
                          </div>
                          <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-danger)', lineHeight: 1.2 }}>
                              {Object.values(sevaAttendanceRecords).filter(r => r.status === 'absent').length}
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
                              onClick={handleSaveSevaAttendance}
                              disabled={savingSevaAttendance}
                            >
                              {savingSevaAttendance ? <SpinnerLoader size={14} /> : <UserCheck size={14} />} હવે સબમિટ કરો
                            </button>
                            <button
                              className="btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                              onClick={handleDiscardSevaDraft}
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

                      {/* Attendance Cards Grid — same experience as Sabha attendance */}
                      {sevaMembers.length === 0 ? (
                        <div className="empty-state" style={{ padding: '48px 24px', background: 'rgba(255,255,255,0.4)', borderRadius: 12, border: '1px dashed var(--glass-border-strong)' }}>
                          <div className="empty-state-icon">
                            <Users size={28} />
                          </div>
                          <p className="empty-state-title">કોઈ સેવા સભ્યો નોંધાયેલા નથી</p>
                          <p className="empty-state-desc" style={{ marginBottom: 0 }}>હાજરી પૂરવા માટે પહેલા "સભ્યો" વિભાગમાંથી સભ્યો ઉમેરો.</p>
                        </div>
                      ) : (() => {
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

                        if (filteredSevaMembers.length === 0) {
                          return (
                            <div className="empty-state" style={{ padding: '36px 20px' }}>
                              <div className="empty-state-icon" style={{ width: 48, height: 48 }}>
                                <Search size={22} />
                              </div>
                              <p className="empty-state-title" style={{ fontSize: '0.9rem' }}>સર્ચ મુજબ કોઈ સભ્ય મળ્યો નથી</p>
                              <button className="btn-ghost btn-sm" onClick={() => setSevaAttendanceSearch('')}>સર્ચ સાફ કરો</button>
                            </div>
                          );
                        }

                        return (
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
                                        <span className="badge badge-primary" style={{ padding: '2px 6px', fontSize: '0.7rem' }}>{SEVA_CATEGORY_TAGS[m.type] || m.type}</span>
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
                        );
                      })()}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                      <SpinnerLoader size={30} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Module 2: Seva Member Management */}
          {sevaModuleTab === 'members' && (
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
                    onClick={() => {
                      setBulkSevaMemberText('');
                      setBulkSevaMemberResult(null);
                      setShowBulkSevaMemberModal(true);
                    }}
                  >
                    <FileSpreadsheet size={16} /> સભ્યો બલ્ક અપલોડ
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setEditingSevaMember(null);
                      setSevaMemberName('');
                      setSevaMemberEnName('');
                      setSevaMemberUniqueCode('');
                      setSevaMemberType('yuvti');
                      setShowSevaMemberModal(true);
                    }}
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
              ) : (
                (() => {
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

                  if (filtered.length === 0) {
                    return (
                      <div className="glass-panel empty-state">
                        <div className="empty-state-icon">
                          <Search size={28} />
                        </div>
                        <p className="empty-state-title">કોઈ સભ્ય મળ્યો નથી</p>
                      </div>
                    );
                  }

                  return (
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
                                onClick={() => {
                                  setEditingSevaMember(m);
                                  setSevaMemberName(m.name);
                                  setSevaMemberEnName(m.nameEn || transliterateGujaratiToEnglish(m.name));
                                  setSevaMemberType(m.type);
                                  setSevaMemberUniqueCode(m.uniqueCode);
                                  setSevaMemberMobileNumber(m.mobileNumber || '');
                                  setShowSevaMemberModal(true);
                                }}
                              >
                                <Edit size={15} />
                              </button>
                              <button
                                className="icon-btn icon-btn-danger"
                                title="કાઢી નાખો"
                                aria-label={`${m.name} કાઢી નાખો`}
                                onClick={() => handleDeleteSevaMember(m._id)}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()
              )}
            </div>
          )}

          {/* Module 3: Seva Reports */}
          {sevaModuleTab === 'reports' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Seva stats cards */}
              <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                <div className="glass-panel" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
                  <CircularProgress
                    value={sevaMembers.length > 0 ? (sevaReportsData.filter(row => row.sevaCount > 0).length / sevaMembers.length) * 100 : 0}
                    size={80}
                    label="હાજરી દર"
                  />
                  <div>
                    <h4 style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>કુલ કલાકો લોગ થયા</h4>
                    <p style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: 4 }}>
                      {sevaReportsData.reduce((acc, row) => acc + (row.totalHours || 0), 0)} કલાક
                    </p>
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: 16, borderRadius: '50%', display: 'inline-flex' }}>
                    <Heart size={28} color="var(--color-primary)" />
                  </div>
                  <div>
                    <h4 style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>કુલ આયોજિત સેવાઓ</h4>
                    <p style={{ fontSize: '2rem', fontWeight: 800, marginTop: 4 }}>{sevas.length}</p>
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: 16, borderRadius: '50%', display: 'inline-flex' }}>
                    <Users size={28} color="var(--color-success)" />
                  </div>
                  <div>
                    <h4 style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>સેવાના પ્રકારો</h4>
                    <p style={{ fontSize: '2rem', fontWeight: 800, marginTop: 4 }}>{sevaTypes.length}</p>
                  </div>
                </div>
              </div>

              {/* Sub Navigation for Seva Reports */}
              <div className="segmented-control" style={{ justifySelf: 'stretch' }}>
                <button
                  className={`segmented-button ${sevaReportsSubTab === 'profile' ? 'active' : ''}`}
                  onClick={() => setSevaReportsSubTab('profile')}
                >
                  સભ્યો પ્રોગ્રેસ
                </button>
                <button
                  className={`segmented-button ${sevaReportsSubTab === 'leaderboard' ? 'active' : ''}`}
                  onClick={() => {
                    setSevaReportsSubTab('leaderboard');
                    fetchSevaReports();
                  }}
                >
                  શ્રેષ્ઠ સેવકો (ટોપ ૧૦)
                </button>
                <button
                  className={`segmented-button ${sevaReportsSubTab === 'particular' ? 'active' : ''}`}
                  onClick={() => setSevaReportsSubTab('particular')}
                >
                  સેવા વાર વિગત
                </button>
              </div>

              {/* Seva Sub Tab 1: Member Seva Progress */}
              {sevaReportsSubTab === 'profile' && (
                <div className="reports-main-grid">
                  {/* Left list of members */}
                  <div className="glass-panel" id="seva-member-report-search" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>સભ્ય સેવા અહેવાલ</h3>
                    <div className="search-field">
                      <Search className="search-icon" size={16} />
                      <input
                        type="text"
                        className="glass-input"
                        style={{ fontSize: '0.9rem' }}
                        placeholder="સભ્ય શોધો..."
                        value={sevaMemberReportSearch}
                        onChange={(e) => setSevaMemberReportSearch(e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '350px', overflowY: 'auto', paddingRight: 4 }}>
                      {sortMembersBySearchRank(
                        sevaMembers.filter(m => {
                          if (!sevaMemberReportSearch.trim()) return true;
                          const q = sevaMemberReportSearch.toLowerCase();
                          return (
                            m.name.toLowerCase().includes(q) ||
                            (m.nameEn && m.nameEn.toLowerCase().includes(q)) ||
                            (m.uniqueCode && m.uniqueCode.toLowerCase().includes(q))
                          );
                        }),
                        sevaMemberReportSearch
                      )
                        .map(member => {
                          const isSelected = selectedSevaMemberReport && selectedSevaMemberReport.member._id === member._id;
                          return (
                            <div
                              key={member._id}
                              onClick={() => {
                                loadSevaMemberReport(member._id);
                                if (window.innerWidth < 768) {
                                  setTimeout(() => {
                                    document.getElementById('seva-member-report-detail')?.scrollIntoView({ behavior: 'smooth' });
                                  }, 150);
                                }
                              }}
                              className="glass-card"
                              style={{
                                cursor: 'pointer',
                                background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255,255,255,0.01)',
                                borderLeft: isSelected ? '4px solid var(--color-primary)' : '1px solid var(--glass-border)',
                                padding: 10
                              }}
                            >
                              <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                                {member.name}
                                {member.nameEn && (
                                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginLeft: 6, fontWeight: 400 }}>
                                    ({member.nameEn})
                                  </span>
                                )}
                              </h4>
                              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                                કોડ: {member.uniqueCode} | {SEVA_CATEGORY_TAGS[member.type]}
                              </p>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Right member progress display */}
                  <div className="glass-panel" id="seva-member-report-detail" style={{ padding: 24 }}>
                    {loadingSevaMemberReport ? (
                      <SkeletonText rows={6} />
                    ) : selectedSevaMemberReport ? (
                      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <button
                          className="btn-secondary btn-sm mobile-only"
                          style={{ alignSelf: 'flex-start' }}
                          onClick={() => document.getElementById('seva-member-report-search')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                          ← સભ્ય યાદી જુઓ
                        </button>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: 16, flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
                          <div style={{ minWidth: 200 }}>
                            <span className="badge badge-primary">
                              {SEVA_CATEGORY_LABELS[selectedSevaMemberReport.member.type]}
                            </span>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 6, letterSpacing: '-0.01em', wordBreak: 'break-word' }}>{selectedSevaMemberReport.member.name}</h2>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: 2, fontFamily: 'monospace' }}>
                              યુનિક આઈડી કોડ: {selectedSevaMemberReport.member.uniqueCode}
                            </p>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>કુલ સેવા કલાકો</p>
                            <p style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-success)', marginTop: 2 }}>
                              {selectedSevaMemberReport.stats.totalHours}
                            </p>
                          </div>
                        </div>

                        {/* Summary Grid stats */}
                        <div className="stats-cards-grid" style={{ textAlign: 'center' }}>
                          <div className="glass-card">
                            <h5 style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>હાજર સેવાઓ</h5>
                            <p style={{ fontSize: '1.3rem', fontWeight: 700, marginTop: 4, color: 'var(--color-success)' }}>
                              {selectedSevaMemberReport.stats.present} / {selectedSevaMemberReport.stats.totalSevas}
                            </p>
                          </div>
                          <div className="glass-card">
                            <h5 style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>ગેરહાજર સભાઓ</h5>
                            <p style={{ fontSize: '1.3rem', fontWeight: 700, marginTop: 4, color: 'var(--color-danger)' }}>
                              {selectedSevaMemberReport.stats.absent}
                            </p>
                          </div>
                          <div className="glass-card">
                            <h5 style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>કુલ કલાક</h5>
                            <p style={{ fontSize: '1.3rem', fontWeight: 700, marginTop: 4, color: 'var(--color-info)' }}>
                              {selectedSevaMemberReport.stats.totalHours}
                            </p>
                          </div>
                        </div>

                        {/* History Log */}
                        <div>
                          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12, color: 'var(--color-text-secondary)' }}>સેવા કેલેન્ડર ઇતિહાસ</h3>
                          {selectedSevaMemberReport.history.length === 0 ? (
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>આ સભ્યનો કોઈ સેવાનો ઇતિહાસ નોંધાયેલ નથી.</p>
                          ) : (
                            <div className="table-wrap" style={{ maxHeight: '260px', overflowY: 'auto', width: '100%', maxWidth: '100%' }}>
                              <table style={{ width: '100%', minWidth: '440px' }}>
                                <thead>
                                  <tr>
                                    <th>તારીખ</th>
                                    <th>સેવા પ્રકાર</th>
                                    <th style={{ textAlign: 'center' }}>સ્થિતિ</th>
                                    <th style={{ textAlign: 'right' }}>લોગ કરેલ કલાક</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {selectedSevaMemberReport.history.map((log, idx) => (
                                    <tr key={idx}>
                                      <td>{new Date(log.date).toLocaleDateString('gu-IN')}</td>
                                      <td style={{ fontWeight: 600 }}>{log.sevaType}</td>
                                      <td style={{ textAlign: 'center' }}>
                                        <span className={`badge ${log.status === 'present' ? 'badge-success' : 'badge-danger'}`}>
                                          {log.status === 'present' ? 'હાજર' : 'ગેરહાજર'}
                                        </span>
                                      </td>
                                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                                        {log.status === 'present' ? `${log.hours} કલાક` : '-'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="empty-state">
                        <div className="empty-state-icon">
                          <TrendingUp size={28} />
                        </div>
                        <p className="empty-state-title">કોઈ સભ્ય પસંદ કરેલ નથી</p>
                        <p className="empty-state-desc" style={{ marginBottom: 0 }}>ડાબી બાજુની યાદીમાંથી સભ્ય પસંદ કરવાથી તેમનો સેવા અહેવાલ અહીં દેખાશે.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Seva Sub Tab 2: Leaderboard */}
              {sevaReportsSubTab === 'leaderboard' && (() => {
                // Group by Seva Type name
                const grouped = {};
                sevaTypeLeaderboardData.forEach(row => {
                  if (!grouped[row.sevaTypeName]) {
                    grouped[row.sevaTypeName] = [];
                  }
                  grouped[row.sevaTypeName].push(row);
                });

                const typeNames = Object.keys(grouped);

                return (
                  <div className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div className="panel-header">
                      <div>
                        <h3 className="panel-title">સેવા પ્રકાર વાઈઝ શ્રેષ્ઠ અહેવાલ (ટોપ ૧૦)</h3>
                        <p className="panel-subtitle">સેવા પ્રકાર મુજબ શ્રેષ્ઠ સેવા આપનાર ૧૦ સભ્યો</p>
                      </div>
                      <button
                        className="btn-primary"
                        onClick={handlePrintSevaLeaderboard}
                        disabled={sevaTypeLeaderboardData.length === 0}
                      >
                        પ્રિન્ટ / PDF ડાઉનલોડ
                      </button>
                    </div>

                    {loadingSevaTypeLeaderboard ? (
                      <SkeletonText rows={8} />
                    ) : typeNames.length === 0 ? (
                      <div className="empty-state" style={{ padding: '36px 20px' }}>
                        <div className="empty-state-icon" style={{ width: 48, height: 48 }}>
                          <Heart size={22} />
                        </div>
                        <p className="empty-state-title" style={{ fontSize: '0.9rem' }}>કોઈ સેવા રેકોર્ડ ઉપલબ્ધ નથી</p>
                        <p className="empty-state-desc" style={{ marginBottom: 0 }}>સેવા હાજરી સાચવ્યા બાદ અહીં અહેવાલ દેખાશે.</p>
                      </div>
                    ) : (
                      <div className="grid-2" style={{ gap: 24 }}>
                        {typeNames.map((typeName, index) => {
                          const list = grouped[typeName].slice(0, 10);
                          const headerColor = index % 2 === 0 ? 'var(--color-primary)' : 'var(--color-secondary)';
                          return (
                            <div key={typeName} className="glass-card" style={{ overflowX: 'auto', padding: 16 }}>
                              <h4 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 12, color: headerColor, borderBottom: '1px solid var(--glass-border)', paddingBottom: 8 }}>
                                {typeName}: શ્રેષ્ઠ ૧૦ સેવાકર્તા
                              </h4>
                              <table className="mini-table">
                                <thead>
                                  <tr>
                                    <th style={{ textAlign: 'left', width: '10%' }}>ક્રમ</th>
                                    <th style={{ textAlign: 'left', width: '35%' }}>નામ</th>
                                    <th style={{ textAlign: 'left', width: '15%' }}>કોડ</th>
                                    <th style={{ textAlign: 'center', width: '20%' }}>કુલ સેવા</th>
                                    <th style={{ textAlign: 'right', width: '20%' }}>કુલ કલાક</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {list.map((item, idx) => (
                                    <tr key={idx}>
                                      <td>{idx + 1}</td>
                                      <td style={{ fontWeight: 600 }}>{item.name}</td>
                                      <td style={{ fontFamily: 'monospace' }}>{item.uniqueCode}</td>
                                      <td style={{ textAlign: 'center' }}>{item.sevaCount} વખત</td>
                                      <td style={{ textAlign: 'right', color: 'var(--color-success)', fontWeight: 700 }}>{item.totalHours} કલાક</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Seva Sub Tab 3: Particular Seva Report */}
              {sevaReportsSubTab === 'particular' && (
                <div className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="panel-header">
                    <div>
                      <h3 className="panel-title">વિશિષ્ટ સેવા વિગતવાર રિપોર્ટ</h3>
                      <p className="panel-subtitle">ચોક્કસ સેવા તારીખનો સંપૂર્ણ અહેવાલ મેળવો</p>
                    </div>
                    {particularSevaReport && (
                      <button
                        className="btn-primary"
                        onClick={handlePrintParticularSeva}
                      >
                        પ્રિન્ટ / PDF ડાઉનલોડ
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="form-label">અહેવાલ માટે સેવા પસંદ કરો:</label>
                    <select
                      className="glass-input"
                      value={selectedParticularSevaId}
                      onChange={(e) => setSelectedParticularSevaId(e.target.value)}
                    >
                      <option value="">-- સેવા પસંદ કરો (તારીખ અને પ્રકાર) --</option>
                      {sevas.map(seva => (
                        <option key={seva._id} value={seva._id}>
                          {new Date(seva.date).toLocaleDateString('gu-IN', { year: 'numeric', month: 'long', day: 'numeric' })} - {seva.sevaType ? seva.sevaType.name : 'અજ્ઞાત'} {seva.leader ? `(${seva.leader})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {loadingParticularSeva ? (
                    <SkeletonText rows={6} />
                  ) : particularSevaReport ? (() => {
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
                        _id: m._id,
                        name: m.name,
                        uniqueCode: m.uniqueCode,
                        type: m.type,
                        status: att.status,
                        hours: att.hours
                      };
                    });

                    combinedList.sort((a, b) => {
                      const presentA = a.status === 'present';
                      const presentB = b.status === 'present';
                      if (presentA && !presentB) return -1;
                      if (!presentA && presentB) return 1;
                      if (presentA && presentB) {
                        return b.hours - a.hours;
                      }
                      return a.name.localeCompare(b.name, 'gu');
                    });

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <span className="badge badge-success">હાજર સભ્યો: {combinedList.filter(m => m.status === 'present').length}</span>
                          <span className="badge badge-danger">ગેરહાજર સભ્યો: {combinedList.filter(m => m.status === 'absent').length}</span>
                          <span className="badge badge-info">કુલ લોગ થયેલ કલાક: {combinedList.reduce((sum, item) => sum + item.hours, 0)} કલાક</span>
                        </div>

                        <div className="table-wrap" style={{ maxHeight: '440px', overflowY: 'auto', width: '100%', maxWidth: '100%' }}>
                          <table style={{ width: '100%', minWidth: '480px' }}>
                            <thead>
                              <tr>
                                <th>ક્રમ</th>
                                <th>નામ</th>
                                <th>કોડ</th>
                                <th>પ્રકાર</th>
                                <th style={{ textAlign: 'center' }}>સ્થિતિ</th>
                                <th style={{ textAlign: 'right' }}>લોગ કરેલ સેવા કલાક</th>
                              </tr>
                            </thead>
                            <tbody>
                              {combinedList.map((m, idx) => {
                                const isPresent = m.status === 'present';
                                return (
                                  <tr key={m._id}>
                                    <td style={{ color: 'var(--color-text-secondary)' }}>{idx + 1}</td>
                                    <td style={{ fontWeight: 600 }}>{m.name}</td>
                                    <td style={{ fontFamily: 'monospace' }}>{m.uniqueCode}</td>
                                    <td>{SEVA_CATEGORY_TAGS[m.type] || m.type}</td>
                                    <td style={{ textAlign: 'center' }}>
                                      <span className={`badge ${isPresent ? 'badge-success' : 'badge-danger'}`}>
                                        {isPresent ? 'હાજર' : 'ગેરહાજર'}
                                      </span>
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: 700 }}>
                                      {isPresent ? `${m.hours} કલાક` : '-'}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })() : (
                    <div className="empty-state" style={{ padding: '36px 20px' }}>
                      <div className="empty-state-icon" style={{ width: 48, height: 48 }}>
                        <Heart size={22} />
                      </div>
                      <p className="empty-state-title" style={{ fontSize: '0.9rem' }}>અહેવાલ માટે સેવા પસંદ કરો</p>
                      <p className="empty-state-desc" style={{ marginBottom: 0 }}>ઉપરના ડ્રોપડાઉનમાંથી સેવા પસંદ કરવાથી સંપૂર્ણ અહેવાલ અહીં દેખાશે.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )
      }

      {/* --- MODAL FOR ADD/EDIT SEVA MEMBER --- */}
      {
        showSevaMemberModal && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-panel" style={{ maxWidth: 450 }}>
              <div className="modal-header">
                <h3 className="modal-title">
                  {editingSevaMember ? 'સેવા સભ્ય વિગતો સુધારો' : 'નવો સેવા સભ્ય ઉમેરો'}
                </h3>
                <button
                  className="icon-btn"
                  onClick={() => setShowSevaMemberModal(false)}
                  aria-label="બંધ કરો"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveSevaMember} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="form-label">નામ (ગુજરાતી)</label>
                  <input
                    type="text"
                    className="glass-input"
                    placeholder="નામ લખો, ઉદા. મોનિકા પટેલ"
                    value={sevaMemberName}
                    onChange={(e) => {
                      setSevaMemberName(e.target.value);
                      if (!editingSevaMember || !sevaMemberEnName) {
                        setSevaMemberEnName(transliterateGujaratiToEnglish(e.target.value));
                      }
                    }}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">અંગ્રેજી નામ (English Name - સર્ચ માટે)</label>
                  <input
                    type="text"
                    className="glass-input"
                    placeholder="Auto English name, e.g. Monika Patel"
                    value={sevaMemberEnName}
                    onChange={(e) => setSevaMemberEnName(e.target.value)}
                  />
                  <span className="form-hint" style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    આ નામ ફક્ત અંગ્રેજીમાં સર્ચ કરવા માટે છે, રિપોર્ટ્સમાં ગુજરાતી નામ જ રહેશે.
                  </span>
                </div>

                <div>
                  <label className="form-label">પ્રકાર (Gender Category)</label>
                  <select
                    className="glass-input"
                    value={sevaMemberType}
                    onChange={(e) => setSevaMemberType(e.target.value)}
                    required
                  >
                    <option value="bal">બાળ (૧૪ થી નીચે)</option>
                    <option value="kisori">કિશોરી (૧૪-૧૭)</option>
                    <option value="yuvti">યુવતી (૧૮-૫૦)</option>
                    <option value="prutha">પ્રૌઢા</option>
                    <option value="vadil">વડીલ (૫૦+)</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">યુનિક આઈડી કોડ (Unique ID Code) (વૈકલ્પિક)</label>
                  <input
                    type="text"
                    className="glass-input"
                    placeholder="SEVA001"
                    value={sevaMemberUniqueCode}
                    onChange={(e) => setSevaMemberUniqueCode(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label">મોબાઈલ નંબર (Mobile Number) (વૈકલ્પિક)</label>
                  <input
                    type="text"
                    className="glass-input"
                    placeholder="મોબાઈલ નંબર લખો"
                    value={sevaMemberMobileNumber}
                    onChange={(e) => setSevaMemberMobileNumber(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowSevaMemberModal(false)}>રદ કરો</button>
                  <button type="submit" className="btn-primary" disabled={submittingSevaMember}>
                    {submittingSevaMember ? <SpinnerLoader size={20} /> : 'સાચવો'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* --- MODAL FOR BULK IMPORT SEVA MEMBERS --- */}
      {
        showBulkSevaMemberModal && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-panel" style={{ maxWidth: 650, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="modal-header" style={{ marginBottom: 16 }}>
                <h3 className="modal-title">એકસાથે સેવા સભ્યો ઉમેરો (બલ્ક અપલોડ)</h3>
                <button
                  className="icon-btn"
                  onClick={() => setShowBulkSevaMemberModal(false)}
                  aria-label="બંધ કરો"
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 16 }}>
                <button
                  type="button"
                  className={`tab-btn ${bulkSevaImportTab === 'excel' ? 'active' : ''}`}
                  onClick={() => setBulkSevaImportTab('excel')}
                  style={{
                    padding: '10px 16px',
                    border: 'none',
                    background: 'transparent',
                    borderBottom: bulkSevaImportTab === 'excel' ? '2px solid var(--color-primary)' : 'none',
                    color: bulkSevaImportTab === 'excel' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    fontWeight: bulkSevaImportTab === 'excel' ? 600 : 400,
                    cursor: 'pointer'
                  }}
                >
                  Excel ફાઇલ અપલોડ
                </button>
                <button
                  type="button"
                  className={`tab-btn ${bulkSevaImportTab === 'text' ? 'active' : ''}`}
                  onClick={() => setBulkSevaImportTab('text')}
                  style={{
                    padding: '10px 16px',
                    border: 'none',
                    background: 'transparent',
                    borderBottom: bulkSevaImportTab === 'text' ? '2px solid var(--color-primary)' : 'none',
                    color: bulkSevaImportTab === 'text' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    fontWeight: bulkSevaImportTab === 'text' ? 600 : 400,
                    cursor: 'pointer'
                  }}
                >
                  કોપી-પેસ્ટ લખાણ
                </button>
              </div>

              {bulkSevaImportTab === 'excel' && (
                <div style={{ background: 'var(--tint-info)', borderLeft: '3px solid var(--color-info)', padding: '12px 14px', borderRadius: 'var(--radius-sm)' }}>
                  <p style={{ fontSize: '0.8rem', lineHeight: '1.6', color: 'var(--color-text-secondary)' }}>
                    <strong>એક્સેલ શીટ ફોર્મેટ સૂચના:</strong> એક્સેલમાં આ કોલમ હોવી જરૂરી છે: <br />
                    - <code>FullNameGuj</code> (નામ માટે) <br />
                    - <code>Age</code> (ઉંમર માટે) <br />
                    - <code>mobile no 1</code> (મોબાઈલ નંબર - વૈકલ્પિક) <br />
                    - <code>SMK</code> (યુનિક કોડ - વૈકલ્પિક)
                  </p>
                </div>
              )}

              {bulkSevaImportTab === 'text' && (
                <div style={{ background: 'var(--tint-info)', borderLeft: '3px solid var(--color-info)', padding: '12px 14px', borderRadius: 'var(--radius-sm)' }}>
                  <p style={{ fontSize: '0.8rem', lineHeight: '1.6', color: 'var(--color-text-secondary)' }}>
                    <strong>નિયમો અને ફોર્મેટ:</strong><br />
                    ૧. દરેક લાઈનમાં એક સભ્યની માહિતી હોવી જોઈએ.<br />
                    ૨. માહિતીનો ક્રમ: <strong>નામ, પ્રકાર, યુનિક કોડ</strong> (અલ્પવિરામ <code>,</code> થી અલગ કરેલ).<br />
                    ૩. પ્રકાર (Category) માટે આ શબ્દો વાપરો: <code>kisori</code> (કિશોરી), <code>yuvti</code> (યુવતી), <code>prutha</code> (પ્રૌઢા), <code>vadil</code> (વડીલ).<br />
                    <strong>ઉદાહરણ:</strong><br />
                    <code>પૂર્વી શાહ, yuvti, SM001</code><br />
                    <code>જાનકી દેસાઈ, kisori, SM002</code>
                  </p>
                </div>
              )}

              {bulkSevaImportTab === 'excel' && (
                <div>
                  <div
                    style={{
                      border: '2px dashed rgba(255,255,255,0.15)',
                      borderRadius: 'var(--radius-md)',
                      padding: '30px 20px',
                      textAlign: 'center',
                      background: 'rgba(255,255,255,0.01)',
                      cursor: 'pointer',
                      marginBottom: 16,
                      position: 'relative'
                    }}
                    onClick={() => document.getElementById('excel-seva-file-input').click()}
                  >
                    <input
                      id="excel-seva-file-input"
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={handleExcelSevaFileChange}
                      style={{ display: 'none' }}
                      disabled={importingBulkSevaMember}
                    />
                    <FileSpreadsheet size={32} style={{ color: 'var(--color-primary)', marginBottom: 8, opacity: 0.8 }} />
                    {excelSevaFileName ? (
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-success)' }}>{excelSevaFileName}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4 }}>ક્લિક કરી નવી ફાઈલ પસંદ કરો</p>
                      </div>
                    ) : (
                      <div>
                        <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>એક્સેલ ફાઇલ પસંદ કરવા અહીં ક્લિક કરો</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4 }}>સપોર્ટેડ ફોર્મેટ: .xlsx, .xls</p>
                      </div>
                    )}
                  </div>

                  {parsedExcelSevaMembers.length > 0 && (
                    <div style={{ maxHeight: '150px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 'var(--radius-sm)', marginBottom: 16 }}>
                      <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                        અપલોડ માટે તૈયાર સેવા સભ્યોની લિસ્ટ ({parsedExcelSevaMembers.length}):
                      </p>
                      {parsedExcelSevaMembers.slice(0, 5).map((m, idx) => (
                        <div key={idx} style={{ fontSize: '0.75rem', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                          <span>{idx + 1}. {m.name} ({SEVA_CATEGORY_TAGS[m.type] || m.type})</span>
                          <span style={{ color: 'var(--color-text-muted)' }}>{m.uniqueCode || 'ઓટો કોડ'} | {m.mobileNumber || 'મોબાઈલ નથી'}</span>
                        </div>
                      ))}
                      {parsedExcelSevaMembers.length > 5 && (
                        <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 4 }}>
                          ...અને બીજા {parsedExcelSevaMembers.length - 5} સેવા સભ્યો
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {bulkSevaImportTab === 'text' && (
                <textarea
                  className="glass-input"
                  rows={8}
                  placeholder="અહીં સભ્યોની વિગતો પેસ્ટ કરો..."
                  value={bulkSevaMemberText}
                  onChange={(e) => setBulkSevaMemberText(e.target.value)}
                  style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                />
              )}

              {importingBulkSevaMember && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span>અપલોડ થઈ રહ્યું છે...</span>
                    <span>{bulkSevaMemberImportProgress}%</span>
                  </div>
                  <DeterminateProgress value={bulkSevaMemberImportProgress} />
                </div>
              )}

              {bulkSevaMemberResult && (
                <div className="glass-card" style={{ padding: 12, fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: 6, background: 'rgba(255,255,255,0.02)' }}>
                  <p style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                    સફળતાપૂર્વક ઉમેરાયા: {bulkSevaMemberResult.successCount} સભ્યો
                  </p>
                  {bulkSevaMemberResult.errorsCount > 0 && (
                    <div>
                      <p style={{ color: 'var(--color-danger)', fontWeight: 600 }}>ભૂલો ({bulkSevaMemberResult.errorsCount}):</p>
                      <ul style={{ paddingLeft: 16, color: 'var(--color-danger)', fontSize: '0.8rem', maxHeight: '100px', overflowY: 'auto' }}>
                        {bulkSevaMemberResult.errors.map((err, idx) => (
                          <li key={idx}>લાઈન {err.line}: {err.msg}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  className="btn-secondary"
                  onClick={() => setShowBulkSevaMemberModal(false)}
                  disabled={importingBulkSevaMember}
                >
                  બંધ કરો
                </button>
                <button
                  className="btn-primary"
                  onClick={bulkSevaImportTab === 'excel' ? handleBulkExcelSevaImport : handleBulkSevaMemberImport}
                  disabled={importingBulkSevaMember || (bulkSevaImportTab === 'excel' ? parsedExcelSevaMembers.length === 0 : !bulkSevaMemberText.trim())}
                >
                  {importingBulkSevaMember ? <SpinnerLoader size={20} /> : 'અપલોડ શરૂ કરો'}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* --- MODAL 1: ADD/EDIT MEMBER --- */}
      {
        showMemberModal && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-panel" style={{ maxWidth: 450 }}>
              <div className="modal-header">
                <h3 className="modal-title">
                  {editingMember ? 'સભ્ય વિગતો સુધારો' : 'નવો સભ્ય ઉમેરો'}
                </h3>
                <button
                  className="icon-btn"
                  onClick={() => setShowMemberModal(false)}
                  aria-label="બંધ કરો"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveMember} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="form-label">નામ (ગુજરાતી)</label>
                  <input
                    type="text"
                    className="glass-input"
                    placeholder="નામ લખો, ઉદા. યશ ગાંધી"
                    value={memberName}
                    onChange={(e) => {
                      setMemberName(e.target.value);
                      if (!editingMember || !memberEnName) {
                        setMemberEnName(transliterateGujaratiToEnglish(e.target.value));
                      }
                    }}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">અંગ્રેજી નામ (English Name - સર્ચ માટે)</label>
                  <input
                    type="text"
                    className="glass-input"
                    placeholder="Auto English name, e.g. Yash Gandhi"
                    value={memberEnName}
                    onChange={(e) => setMemberEnName(e.target.value)}
                  />
                  <span className="form-hint" style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    આ નામ ફક્ત અંગ્રેજીમાં સર્ચ કરવા માટે છે, રિપોર્ટ્સમાં ગુજરાતી નામ જ રહેશે.
                  </span>
                </div>

                <div>
                  <label className="form-label">સભા સભ્ય પ્રકાર</label>
                  <select
                    className="glass-input"
                    value={memberType}
                    onChange={(e) => setMemberType(e.target.value)}
                  >
                    <option value="bal">બાળ (૧૪ થી નીચે)</option>
                    <option value="kishor">કિશોર (૧૪-૧૭)</option>
                    <option value="yuva">યુવા (૧૮-૫૦)</option>
                    <option value="proudh">પ્રૌઢ</option>
                    <option value="vadil">વડીલ (૫૦+)</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">યુનિક આઈડી કોડ (Unique Code) (વૈકલ્પિક)</label>
                  <input
                    type="text"
                    className="glass-input"
                    placeholder="ઉદા. YG01"
                    value={memberCode}
                    onChange={(e) => setMemberCode(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label">મોબાઈલ નંબર (Mobile Number) (વૈકલ્પિક)</label>
                  <input
                    type="text"
                    className="glass-input"
                    placeholder="મોબાઈલ નંબર લખો"
                    value={memberMobileNumber}
                    onChange={(e) => setMemberMobileNumber(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowMemberModal(false)}>રદ કરો</button>
                  <button type="submit" className="btn-primary" disabled={submittingMember}>
                    {submittingMember ? <SpinnerLoader size={16} /> : 'સાચવો'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* --- MODAL 2: BULK UPLOAD MEMBERS --- */}
      {
        showBulkModal && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-panel" style={{ maxWidth: 550 }}>
              <div className="modal-header" style={{ marginBottom: 16 }}>
                <h3 className="modal-title">
                  એકસાથે સભ્યો ઉમેરો (બલ્ક અપલોડ)
                </h3>
                <button
                  className="icon-btn"
                  onClick={() => setShowBulkModal(false)}
                  aria-label="બંધ કરો"
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 16 }}>
                <button
                  type="button"
                  className={`tab-btn ${bulkImportTab === 'excel' ? 'active' : ''}`}
                  onClick={() => setBulkImportTab('excel')}
                  style={{
                    padding: '10px 16px',
                    border: 'none',
                    background: 'transparent',
                    borderBottom: bulkImportTab === 'excel' ? '2px solid var(--color-primary)' : 'none',
                    color: bulkImportTab === 'excel' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    fontWeight: bulkImportTab === 'excel' ? 600 : 400,
                    cursor: 'pointer'
                  }}
                >
                  Excel ફાઇલ અપલોડ
                </button>
                <button
                  type="button"
                  className={`tab-btn ${bulkImportTab === 'text' ? 'active' : ''}`}
                  onClick={() => setBulkImportTab('text')}
                  style={{
                    padding: '10px 16px',
                    border: 'none',
                    background: 'transparent',
                    borderBottom: bulkImportTab === 'text' ? '2px solid var(--color-primary)' : 'none',
                    color: bulkImportTab === 'text' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    fontWeight: bulkImportTab === 'text' ? 600 : 400,
                    cursor: 'pointer'
                  }}
                >
                  કોપી-પેસ્ટ લખાણ
                </button>
              </div>

              {bulkImportTab === 'excel' && (
                <div style={{ background: 'var(--tint-info)', borderLeft: '3px solid var(--color-info)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', marginBottom: 14 }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                    <strong>એક્સેલ શીટ ફોર્મેટ સૂચના:</strong> એક્સેલમાં આ કોલમ હોવી જરૂરી છે: <br />
                    - <code>FullNameGuj</code> (નામ માટે) <br />
                    - <code>Age</code> (ઉંમર માટે) <br />
                    - <code>mobile no 1</code> (મોબાઈલ નંબર - વૈકલ્પિક) <br />
                    - <code>SMK</code> (યુનિક કોડ - વૈકલ્પિક)
                  </p>
                </div>
              )}

              {bulkImportTab === 'text' && (
                <div style={{ background: 'var(--tint-info)', borderLeft: '3px solid var(--color-info)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', marginBottom: 14 }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                    <strong>ફોર્મેટ સૂચના:</strong> નીચેના બોક્સમાં દરેક લાઈનમાં એક સભ્યની વિગત આ ક્રમમાં લખો: <br />
                    <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4, display: 'inline-block', margin: '4px 0', fontFamily: 'monospace' }}>નામ, પ્રકાર, યુનિક કોડ</code> <br />
                    પ્રકારમાં માત્ર <strong>kishor, yuva, proudh, vadil</strong> માંથી જ લખવું. <br />
                    <em>ઉદાહરણ:</em> <br />
                    <code style={{ color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                      યશ ગાંધી, yuva, YG01 <br />
                      અમિત પટેલ, kishor, KP02
                    </code>
                  </p>
                </div>
              )}

              {importingBulk && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span>અપલોડ થઈ રહ્યું છે...</span>
                    <span>{bulkImportProgress}%</span>
                  </div>
                  <DeterminateProgress value={bulkImportProgress} />
                </div>
              )}

              {bulkResult && (
                <div
                  className="glass-card"
                  style={{
                    padding: 12,
                    marginBottom: 12,
                    background: 'rgba(16,185,129,0.05)',
                    border: '1px solid rgba(16,185,129,0.2)',
                    fontSize: '0.85rem'
                  }}
                >
                  <p style={{ color: 'var(--color-success)', fontWeight: 600 }}>અપલોડ રિપોર્ટ:</p>
                  <p style={{ marginTop: 2 }}>સફળતાપૂર્વક ઉમેરાયેલ સભ્યો: {bulkResult.successCount}</p>
                  {bulkResult.errorsCount > 0 && (
                    <div style={{ marginTop: 8, color: 'var(--color-danger)' }}>
                      <p style={{ fontWeight: 600 }}>ભૂલોવાળી લાઇનો ({bulkResult.errorsCount}):</p>
                      <div style={{ maxHeight: 80, overflowY: 'auto', marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {bulkResult.errors.map((e, idx) => (
                          <p key={idx} style={{ fontSize: '0.75rem' }}>લાઈન {e.line}: {e.msg}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {bulkImportTab === 'excel' && (
                <div>
                  <div
                    style={{
                      border: '2px dashed rgba(255,255,255,0.15)',
                      borderRadius: 'var(--radius-md)',
                      padding: '30px 20px',
                      textAlign: 'center',
                      background: 'rgba(255,255,255,0.01)',
                      cursor: 'pointer',
                      marginBottom: 16,
                      position: 'relative'
                    }}
                    onClick={() => document.getElementById('excel-file-input').click()}
                  >
                    <input
                      id="excel-file-input"
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={handleExcelFileChange}
                      style={{ display: 'none' }}
                      disabled={importingBulk}
                    />
                    <FileSpreadsheet size={32} style={{ color: 'var(--color-primary)', marginBottom: 8, opacity: 0.8 }} />
                    {excelFileName ? (
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-success)' }}>{excelFileName}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4 }}>ક્લિક કરી નવી ફાઈલ પસંદ કરો</p>
                      </div>
                    ) : (
                      <div>
                        <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>એક્સેલ ફાઇલ પસંદ કરવા અહીં ક્લિક કરો</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4 }}>સપોર્ટેડ ફોર્મેટ: .xlsx, .xls</p>
                      </div>
                    )}
                  </div>

                  {parsedExcelMembers.length > 0 && (
                    <div style={{ maxHeight: '150px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 'var(--radius-sm)', marginBottom: 16 }}>
                      <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                        અપલોડ માટે તૈયાર સભ્યોની લિસ્ટ ({parsedExcelMembers.length}):
                      </p>
                      {parsedExcelMembers.slice(0, 5).map((m, idx) => (
                        <div key={idx} style={{ fontSize: '0.75rem', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                          <span>{idx + 1}. {m.name} ({CATEGORY_TAGS[m.type] || m.type})</span>
                          <span style={{ color: 'var(--color-text-muted)' }}>{m.uniqueCode || 'ઓટો કોડ'} | {m.mobileNumber || 'મોબાઈલ નથી'}</span>
                        </div>
                      ))}
                      {parsedExcelMembers.length > 5 && (
                        <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 4 }}>
                          ...અને બીજા {parsedExcelMembers.length - 5} સભ્યો
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {bulkImportTab === 'text' && (
                <textarea
                  rows={8}
                  className="glass-input"
                  placeholder="નામ, પ્રકાર, કોડ..."
                  style={{ fontFamily: 'monospace', fontSize: '0.85rem', resize: 'vertical', marginBottom: 16 }}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  disabled={importingBulk}
                />
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowBulkModal(false)} disabled={importingBulk}>રદ કરો</button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={bulkImportTab === 'excel' ? handleBulkExcelImport : handleBulkImport}
                  disabled={importingBulk || (bulkImportTab === 'excel' ? parsedExcelMembers.length === 0 : !bulkText.trim())}
                >
                  {importingBulk ? <SpinnerLoader size={16} /> : 'સબમિટ કરો'}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* --- MODAL 3: CREATE/EDIT EVENT --- */}
      {
        showEventModal && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-panel" style={{ maxWidth: 450 }}>
              <div className="modal-header">
                <h3 className="modal-title">
                  {editingEventId ? 'સભા વિગતો સુધારો' : 'નવી સભા આયોજિત કરો'}
                </h3>
                <button
                  className="icon-btn"
                  onClick={() => setShowEventModal(false)}
                  aria-label="બંધ કરો"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveEvent} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                  <label className="form-label">સભા પ્રકાર (Type)</label>
                  <select
                    className="glass-input"
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                  >
                    <option value="savar_ni_katha">સવારની કથા</option>
                    <option value="ravi_sabha">રવિસભા</option>
                  </select>
                </div>

                {eventType === 'ravi_sabha' && (
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
                )}

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowEventModal(false)}>રદ કરો</button>
                  <button type="submit" className="btn-primary" disabled={creatingEvent}>
                    {creatingEvent ? <SpinnerLoader size={16} /> : 'સાચવો'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* --- MODAL 4: CONFIRM EVENT DELETE --- */}
      {
        eventToDelete && (
          <div className="modal-overlay modal-overlay-top" role="alertdialog" aria-modal="true">
            <div className="modal-panel" style={{ maxWidth: 400, textAlign: 'center' }}>
              <div style={{ background: 'var(--tint-danger)', padding: 16, borderRadius: '50%', display: 'inline-flex', marginBottom: 16 }}>
                <AlertTriangle size={32} color="var(--color-danger)" />
              </div>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 12 }}>શું તમે ખાતરીપૂર્વક સભા રદ કરવા માંગો છો?</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: 24, lineHeight: 1.6 }}>
                આ સભા રદ કરવાથી તેના સંકળાયેલા તમામ સભ્યોના હાજરી રેકોર્ડ કાયમ માટે રદ થઈ જશે. આ ક્રિયા પાછી વાળી શકાશે નહીં.
              </p>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button className="btn-secondary" onClick={() => setEventToDelete(null)} style={{ flex: 1 }}>રદ કરો (ના)</button>
                <button className="btn-danger" onClick={confirmDeleteEvent} style={{ flex: 1 }}>હા, કાઢી નાખો</button>
              </div>
            </div>
          </div>
        )
      }

      {/* --- MODAL 5: CREATE SEVA --- */}
      {
        showSevaModal && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-panel" style={{ maxWidth: 450 }}>
              <div className="modal-header">
                <h3 className="modal-title">નવી સેવા આયોજિત કરો</h3>
                <button
                  className="icon-btn"
                  onClick={() => setShowSevaModal(false)}
                  aria-label="બંધ કરો"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateSeva} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="form-label">સેવાની તારીખ (Date)</label>
                  <input
                    type="date"
                    className="glass-input"
                    value={sevaDate}
                    onChange={(e) => setSevaDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">સેવાનો પ્રકાર (Seva Type)</label>
                  <select
                    className="glass-input"
                    value={sevaTypeId}
                    onChange={(e) => setSevaTypeId(e.target.value)}
                    required
                  >
                    <option value="">-- સેવાનો પ્રકાર પસંદ કરો --</option>
                    {sevaTypes.map(t => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                    <option value="new_type" style={{ background: '#111827', fontWeight: 'bold', color: 'var(--color-primary)' }}>+ નવો પ્રકાર ઉમેરો...</option>
                  </select>
                </div>

                {sevaTypeId === 'new_type' && (
                  <div className="animate-fade-in">
                    <label className="form-label">નવા સેવાનો પ્રકાર લખો (New Seva Type Name)</label>
                    <input
                      type="text"
                      className="glass-input"
                      placeholder="ઉદા. રસોઈ સેવા, સફાઈ સેવા"
                      value={newSevaTypeNameInput}
                      onChange={(e) => setNewSevaTypeNameInput(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="form-label">સેવા લીડરનું નામ (Leader - Optional)</label>
                  <input
                    type="text"
                    className="glass-input"
                    placeholder="લીડરનું નામ લખો"
                    value={sevaLeader}
                    onChange={(e) => setSevaLeader(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowSevaModal(false)}>રદ કરો</button>
                  <button type="submit" className="btn-primary" disabled={creatingSeva}>
                    {creatingSeva ? <SpinnerLoader size={16} /> : 'સાચવો'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* --- MODAL 6: SEVA TYPES SETTINGS --- */}
      {
        showSevaTypeModal && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-panel" style={{ maxWidth: 500 }}>
              <div className="modal-header">
                <h3 className="modal-title">સેવા પ્રકાર વ્યવસ્થાપન</h3>
                <button
                  className="icon-btn"
                  onClick={() => setShowSevaTypeModal(false)}
                  aria-label="બંધ કરો"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateSevaType} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="નવો સેવાનો પ્રકાર, ઉદા. રસોઈ સેવા"
                  value={newSevaTypeName}
                  onChange={(e) => setNewSevaTypeName(e.target.value)}
                  required
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn-primary" disabled={creatingSevaType}>
                  {creatingSevaType ? <SpinnerLoader size={16} /> : 'ઉમેરો'}
                </button>
              </form>

              <h4 style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: 10, fontWeight: 600 }}>હાલના સેવા પ્રકારો:</h4>
              <div style={{ maxHeight: 250, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sevaTypes.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>કોઈ પ્રકાર ઉમેરેલ નથી.</p>
                ) : (
                  sevaTypes.map(t => (
                    <div
                      key={t._id}
                      className="glass-card"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 8px 8px 14px'
                      }}
                    >
                      <span style={{ fontSize: '0.9rem' }}>{t.name}</span>
                      <button
                        type="button"
                        className="icon-btn icon-btn-danger"
                        onClick={() => handleDeleteSevaType(t._id)}
                        aria-label={`${t.name} કાઢી નાખો`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                <button className="btn-secondary" onClick={() => setShowSevaTypeModal(false)}>બંધ કરો</button>
              </div>
            </div>
          </div>
        )
      }

      {/* --- MOBILE BOTTOM NAVIGATION --- */}
      {visibleNavItems.length > 1 && (
        <nav className="bottom-nav" aria-label="મુખ્ય નેવિગેશન">
          {visibleNavItems.map(item => (
            <button
              key={item.key}
              className={`bottom-nav-item ${currentTabKey === item.key ? 'active' : ''}`}
              onClick={() => handleTabClick(item.key)}
              aria-current={currentTabKey === item.key ? 'page' : undefined}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>
      )}

      {/* --- PRINT CONTAINER --- */}
      <div className="print-container">
        {printData && printData.type !== 'leaderboard' && (
          <div style={{ textAlign: 'center', marginBottom: 24, borderBottom: '2px solid #000', paddingBottom: 12 }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>જય સ્વામિનારાયણ</h1>
            <h2 style={{ fontSize: '1.2rem', marginTop: 6 }}>જ્ઞાન સત્સંગ મંડળ પાદરા</h2>
            <p style={{ fontSize: '1rem', fontWeight: 600, marginTop: 4 }}>{printData.title}</p>
          </div>
        )}

        {printData && printData.type === 'leaderboard' && printData.data && (
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center' }}>
            {/* --- PAGE 1: EARLY / ON-TIME TOP 10 (ASCENDING) --- */}
            <div style={{ minHeight: '92vh', pageBreakAfter: 'always', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <img
                src="/ravisabha_header.png"
                alt="રવિસભા હેડર"
                className="report-header-img"
              />
              
              <div style={{ textAlign: 'center', width: '100%', margin: '6px 0 16px 0' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 6px 0', color: '#000', textAlign: 'center' }}>
                  ૧. રવિસભા: સમયસર / વહેલા પહોંચનાર શ્રેષ્ઠ ૧૦ (વહેલા સરેરાશ સમય મુજબ)
                </h2>
                <div style={{ display: 'inline-block', borderBottom: '2px solid #000', paddingBottom: 4, minWidth: '200px' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#000' }}>
                    {printData.filterType && printData.filterType !== 'all' ? `સભ્ય પ્રકાર: ${CATEGORY_LABELS[printData.filterType] || printData.filterType}` : 'સભા સભ્ય પ્રકાર: બધા સભ્યો'}
                  </span>
                </div>
              </div>

              <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <table className="report-print-table" style={{ margin: '0 auto', width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'center', width: '85px' }}>ક્રમ (સંખ્યા)</th>
                      <th style={{ textAlign: 'left', width: 'auto' }}>સભ્ય / સભ્યોનું નામ</th>
                      <th style={{ textAlign: 'center', width: '170px' }}>સરેરાશ સમય (AVG Time)</th>
                      <th style={{ textAlign: 'right', width: '120px' }}>સભા હાજરી</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!printData.data.raviTopGroups || printData.data.raviTopGroups.length === 0) ? (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: 24 }}>
                          આ કેટેગરીમાં રવિસભામાં વહેલા/સમયસર પહોંચવાનો સમય નોંધાયેલ હોય તેવા કોઈ સભ્યો મળ્યા નથી.
                        </td>
                      </tr>
                    ) : (
                      printData.data.raviTopGroups.map((group) => (
                        <tr key={group.rank}>
                          <td style={{ textAlign: 'center', fontWeight: 800 }}>
                            {group.rankLabel}
                          </td>
                          <td>
                            <div key={group.rank} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {group.members.map((m, mIdx) => (
                                <div key={m._id || mIdx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontWeight: 700 }}>{m.name}</span>
                                  <span style={{ fontSize: '0.78rem', color: '#444' }}>({CATEGORY_TAGS[m.type] || m.type})</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 800 }}>
                            {group.avgTime}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>
                            {group.members.map(m => m.count).join(', ')} સભા
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* --- PAGE 2: LATE TOP 10 (FORCED SECOND PAGE) --- */}
            <div style={{ pageBreakBefore: 'always', breakBefore: 'page', paddingTop: 10, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <img
                src="/ravisabha_header.png"
                alt="રવિસભા હેડર"
                className="report-header-img"
              />
              
              <div style={{ textAlign: 'center', width: '100%', margin: '6px 0 16px 0' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 6px 0', color: '#000', textAlign: 'center' }}>
                  ૨. રવિસભા: મોડા પડનાર ૧૦ સભ્યો (મોડા સરેરાશ સમય મુજબ)
                </h2>
                <div style={{ display: 'inline-block', borderBottom: '2px solid #000', paddingBottom: 4, minWidth: '200px' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#000' }}>
                    {printData.filterType && printData.filterType !== 'all' ? `સભ્ય પ્રકાર: ${CATEGORY_LABELS[printData.filterType] || printData.filterType}` : 'સભા સભ્ય પ્રકાર: બધા સભ્યો'}
                  </span>
                </div>
              </div>

              <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <table className="report-print-table" style={{ margin: '0 auto', width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'center', width: '85px' }}>ક્રમ (સંખ્યા)</th>
                      <th style={{ textAlign: 'left', width: 'auto' }}>સભ્ય / સભ્યોનું નામ</th>
                      <th style={{ textAlign: 'center', width: '170px' }}>સરેરાશ સમય (AVG Time)</th>
                      <th style={{ textAlign: 'right', width: '120px' }}>મોડા પડ્યા</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!printData.data.raviLateGroups || printData.data.raviLateGroups.length === 0) ? (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: 24 }}>
                          આ કેટેગરીમાં રવિસભામાં મોડા પડ્યા હોય તેવા કોઈ સભ્યો મળ્યા નથી.
                        </td>
                      </tr>
                    ) : (
                      printData.data.raviLateGroups.map((group) => (
                        <tr key={group.rank}>
                          <td style={{ textAlign: 'center', fontWeight: 800 }}>
                            {group.rankLabel}
                          </td>
                          <td>
                            <div key={group.rank} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {group.members.map((m, mIdx) => (
                                <div key={m._id || mIdx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontWeight: 700 }}>{m.name}</span>
                                  <span style={{ fontSize: '0.78rem', color: '#444' }}>({CATEGORY_TAGS[m.type] || m.type})</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 800 }}>
                            {group.avgTime}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>
                            {group.members.map(m => m.count).join(', ')} વખત
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {printData && printData.type === 'particular_event' && printData.data && (
          <div>
            <h3 style={{ borderBottom: '1px solid #000', paddingBottom: 4, fontWeight: 700 }}>સભા હાજરી વિગત</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #000' }}>
                  <th style={{ textAlign: 'left', padding: 6 }}>ક્રમ</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>નામ</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>કોડ</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>પ્રકાર</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>હાજરી સ્થિતિ</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>સમય</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>રીમાર્ક (નોંધ)</th>
                </tr>
              </thead>
              <tbody>
                {printData.data.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: 6 }}>{idx + 1}</td>
                    <td style={{ padding: 6, fontWeight: 600 }}>{item.name}</td>
                    <td style={{ padding: 6 }}>{item.uniqueCode}</td>
                    <td style={{ padding: 6 }}>{CATEGORY_TAGS[item.type]}</td>
                    <td style={{ padding: 6, fontWeight: 600 }}>
                      {item.status === 'present' ? (item.isLate ? 'મોડા આવ્યા' : 'હાજર') : 'ગેરહાજર'}
                    </td>
                    <td style={{ padding: 6 }}>
                      {item.arrivalTime ? new Date(item.arrivalTime).toLocaleTimeString('gu-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td style={{ padding: 6, fontStyle: 'italic' }}>{item.remark || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {printData && printData.type === 'seva_report' && printData.data && (
          <div>
            <h3 style={{ borderBottom: '1px solid #000', paddingBottom: 4, fontWeight: 700 }}>સભ્યોના સેવા કલાકોનો અહેવાલ (કુલ વિગત)</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #000' }}>
                  <th style={{ textAlign: 'left', padding: 6 }}>ક્રમ</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>નામ</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>કોડ</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>પ્રકાર</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>સેવા સંખ્યા</th>
                  <th style={{ textAlign: 'right', padding: 6 }}>કુલ સેવા કલાક</th>
                </tr>
              </thead>
              <tbody>
                {printData.data.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: 6 }}>{idx + 1}</td>
                    <td style={{ padding: 6, fontWeight: 600 }}>{item.name}</td>
                    <td style={{ padding: 6 }}>{item.uniqueCode}</td>
                    <td style={{ padding: 6 }}>{SEVA_CATEGORY_TAGS[item.type] || item.type}</td>
                    <td style={{ padding: 6, textAlign: 'center' }}>{item.sevaCount} વખત</td>
                    <td style={{ padding: 6, textAlign: 'right', fontWeight: 600 }}>{item.totalHours} કલાક</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {printData && printData.type === 'seva_leaderboard' && printData.data && (
          <div>
            <h2 style={{ borderBottom: '2px solid #000', paddingBottom: 8, fontWeight: 800, textAlign: 'center', marginBottom: 20 }}>સેવા પ્રકાર વાઈઝ શ્રેષ્ઠ અહેવાલ (ટોપ ૧૦)</h2>
            {Object.entries(printData.data).map(([typeName, list]) => {
              if (!list || list.length === 0) return null;
              return (
                <div key={typeName} style={{ marginBottom: 32, pageBreakInside: 'avoid' }}>
                  <h3 style={{ borderBottom: '1px solid #333', paddingBottom: 4, fontWeight: 700, color: '#111', fontSize: '1.05rem', marginBottom: 8 }}>
                    {typeName}: શ્રેષ્ઠ ૧૦ સેવાકર્તા
                  </h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #000', fontSize: '0.85rem' }}>
                        <th style={{ textAlign: 'left', padding: 6, width: '8%' }}>ક્રમ</th>
                        <th style={{ textAlign: 'left', padding: 6, width: '40%' }}>નામ</th>
                        <th style={{ textAlign: 'left', padding: 6, width: '15%' }}>કોડ</th>
                        <th style={{ textAlign: 'center', padding: 6, width: '17%' }}>સેવા સંખ્યા</th>
                        <th style={{ textAlign: 'right', padding: 6, width: '20%' }}>કુલ સેવા કલાક</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb', fontSize: '0.8rem' }}>
                          <td style={{ padding: 6 }}>{idx + 1}</td>
                          <td style={{ padding: 6, fontWeight: 600 }}>{item.name}</td>
                          <td style={{ padding: 6 }}>{item.uniqueCode}</td>
                          <td style={{ padding: 6, textAlign: 'center' }}>{item.sevaCount} વખત</td>
                          <td style={{ padding: 6, textAlign: 'right', fontWeight: 600 }}>{item.totalHours} કલાક</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}

        {printData && printData.type === 'particular_seva' && printData.data && (
          <div>
            <h3 style={{ borderBottom: '1px solid #000', paddingBottom: 4, fontWeight: 700 }}>સેવા હાજરી અને કલાકોની વિગત</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #000' }}>
                  <th style={{ textAlign: 'left', padding: 6 }}>ક્રમ</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>નામ</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>કોડ</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>પ્રકાર</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>હાજરી સ્થિતિ</th>
                  <th style={{ textAlign: 'right', padding: 6 }}>સેવાના કલાકો</th>
                </tr>
              </thead>
              <tbody>
                {printData.data.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: 6 }}>{idx + 1}</td>
                    <td style={{ padding: 6, fontWeight: 600 }}>{item.name}</td>
                    <td style={{ padding: 6 }}>{item.uniqueCode}</td>
                    <td style={{ padding: 6 }}>{CATEGORY_TAGS[item.type] || item.type}</td>
                    <td style={{ padding: 6, textAlign: 'center', fontWeight: 600 }}>
                      {item.status === 'present' ? 'હાજર' : 'ગેરહાજર'}
                    </td>
                    <td style={{ padding: 6, textAlign: 'right' }}>
                      {item.status === 'present' ? `${item.hours} કલાક` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div >
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
