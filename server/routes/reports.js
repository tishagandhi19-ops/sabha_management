import express from 'express';
import Member from '../models/Member.js';
import Event from '../models/Event.js';
import Attendance from '../models/Attendance.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/reports/dashboard
// @desc    Get aggregate stats for dashboard reports
// @access  Private (Admin)
router.get('/dashboard', auth, async (req, res) => {
  try {
    const totalMembers = await Member.countDocuments();
    const totalEvents = await Event.countDocuments();

    // Group members by type
    const memberTypeBreakdown = await Member.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    // Create a quick lookup map for member types
    const typesMap = { kishor: 0, yuva: 0, proudh: 0, vadil: 0 };
    memberTypeBreakdown.forEach(item => {
      if (item._id in typesMap) {
        typesMap[item._id] = item.count;
      }
    });

    // Calculate total attendance rate
    const totalAttendanceDocs = await Attendance.countDocuments();
    const presentAttendanceDocs = await Attendance.countDocuments({ status: 'present' });
    const overallRate = totalAttendanceDocs > 0 ? (presentAttendanceDocs / totalAttendanceDocs) * 100 : 0;

    // Average attendance rate by event type
    const events = await Event.find();
    let savarKathaTotal = 0;
    let savarKathaPresent = 0;
    let raviSabhaTotal = 0;
    let raviSabhaPresent = 0;
    let raviSabhaLate = 0;

    for (let event of events) {
      const counts = await Attendance.aggregate([
        { $match: { event: event._id } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
            late: { $sum: { $cond: [{ $eq: ['$isLate', true] }, 1, 0] } }
          }
        }
      ]);

      if (counts.length > 0) {
        if (event.type === 'savar_ni_katha') {
          savarKathaTotal += counts[0].total;
          savarKathaPresent += counts[0].present;
        } else if (event.type === 'ravi_sabha') {
          raviSabhaTotal += counts[0].total;
          raviSabhaPresent += counts[0].present;
          raviSabhaLate += counts[0].late;
        }
      }
    }

    const savarKathaRate = savarKathaTotal > 0 ? (savarKathaPresent / savarKathaTotal) * 100 : 0;
    const raviSabhaRate = raviSabhaTotal > 0 ? (raviSabhaPresent / raviSabhaTotal) * 100 : 0;
    const raviSabhaLateRate = raviSabhaPresent > 0 ? (raviSabhaLate / raviSabhaPresent) * 100 : 0;

    res.json({
      totalMembers,
      totalEvents,
      memberTypeBreakdown: typesMap,
      overallAttendanceRate: Math.round(overallRate * 10) / 10,
      savarKathaRate: Math.round(savarKathaRate * 10) / 10,
      raviSabhaRate: Math.round(raviSabhaRate * 10) / 10,
      raviSabhaLateCount: raviSabhaLate,
      raviSabhaLateRate: Math.round(raviSabhaLateRate * 10) / 10
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('સર્વર ભૂલ');
  }
});

// @route   GET /api/reports/member/:id
// @desc    Get detailed individual member attendance reports
// @access  Private (Admin)
router.get('/member/:id', auth, async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ msg: 'સભ્ય મળ્યો નથી' });
    }

    // Get all attendance logs for this member
    const attendanceLogs = await Attendance.find({ member: req.params.id })
      .populate('event')
      .sort({ 'event.date': -1 });

    // Filter out populated logs with null events (in case an event was deleted but index is updating)
    const validLogs = attendanceLogs.filter(log => log.event != null);

    const totalEventCount = validLogs.length;
    const presentCount = validLogs.filter(log => log.status === 'present').length;
    const absentCount = totalEventCount - presentCount;
    const lateCount = validLogs.filter(log => log.status === 'present' && log.isLate).length;
    const attendanceRate = totalEventCount > 0 ? (presentCount / totalEventCount) * 100 : 0;

    // Filter events by type for breakdown
    const savarLogs = validLogs.filter(log => log.event.type === 'savar_ni_katha');
    const savarTotal = savarLogs.length;
    const savarPresent = savarLogs.filter(log => log.status === 'present').length;
    const savarRate = savarTotal > 0 ? (savarPresent / savarTotal) * 100 : 0;

    const raviLogs = validLogs.filter(log => log.event.type === 'ravi_sabha');
    const raviTotal = raviLogs.length;
    const raviPresent = raviLogs.filter(log => log.status === 'present').length;
    const raviRate = raviTotal > 0 ? (raviPresent / raviTotal) * 100 : 0;

    // Extract late remarks
    const remarks = validLogs
      .filter(log => log.isLate && log.remark)
      .map(log => ({
        date: log.event.date,
        remark: log.remark
      }));

    res.json({
      member,
      stats: {
        totalEvents: totalEventCount,
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        attendanceRate: Math.round(attendanceRate * 10) / 10,
        savarKathaRate: Math.round(savarRate * 10) / 10,
        raviSabhaRate: Math.round(raviRate * 10) / 10
      },
      history: validLogs.map(log => ({
        _id: log._id,
        eventId: log.event._id,
        date: log.event.date,
        type: log.event.type,
        status: log.status,
        arrivalTime: log.arrivalTime,
        isLate: log.isLate,
        remark: log.remark
      })),
      remarks
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('સર્વર ભૂલ');
  }
});

// @route   GET /api/reports/top-attendees
// @desc    Get Ravi Sabha Top 10 on-time and points leader groups, with category filtering
// @access  Private (Admin)
router.get('/top-attendees', auth, async (req, res) => {
  try {
    const { type } = req.query;
    const raviEvents = await Event.find({ type: 'ravi_sabha' });
    const raviEventIds = raviEvents.map(e => e._id);

    const eventMap = new Map();
    for (const ev of raviEvents) {
      let cutoffMinutes = 1110; // Default 6:30 PM (18:30)
      if (ev.minReachTime && ev.minReachTime.trim()) {
        const parts = ev.minReachTime.trim().split(':');
        let h = parseInt(parts[0], 10);
        const m = parseInt(parts[1] || '0', 10);
        if (!isNaN(h) && !isNaN(m)) {
          if (h < 12) h += 12; // 06:30 PM
          cutoffMinutes = h * 60 + m;
        }
      }
      const startMinutes = 1050; // 5:30 PM
      eventMap.set(ev._id.toString(), {
        event: ev,
        startMinutes,
        cutoffMinutes
      });
    }

    const formatMinutesTo12h = (totalMins) => {
      const roundedMins = Math.round(totalMins);
      const h24 = Math.floor(roundedMins / 60) % 24;
      const mins = roundedMins % 60;
      const ampm = h24 >= 12 ? 'PM' : 'AM';
      const h12 = (h24 % 12) || 12;
      return `${String(h12).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${ampm}`;
    };

    const getISTMinutes = (dateInput) => {
      const d = new Date(dateInput);
      const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      const parts = formatter.format(d).split(':');
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      return h * 60 + m;
    };

    const computePointsForRecord = (record, evConfig) => {
      if (record.status !== 'present') return 0;
      const startMinutes = evConfig ? evConfig.startMinutes : 1050;
      const cutoffMinutes = evConfig ? evConfig.cutoffMinutes : 1110;

      if (!record.arrivalTime) {
        return record.isLate ? 30 : 60;
      }

      const arrMins = getISTMinutes(record.arrivalTime);

      if (record.isLate || arrMins > cutoffMinutes) {
        return 30; // Late (30 points)
      }

      // Early / On-time points distribution
      if (arrMins <= startMinutes + 15) {
        return 100; // Super Early: 5:30 - 5:45 PM (100 points)
      } else if (arrMins <= startMinutes + 45) {
        return 80;  // On Time: 5:45 - 6:15 PM (80 points)
      } else if (arrMins <= cutoffMinutes) {
        return 60;  // Borderline: 6:15 - 6:30 PM (60 points)
      } else {
        return 30;  // Late
      }
    };

    // 1. Compute Top Attendees Leaderboard by Points & Arrival Time
    const computeTopPointsGroups = async () => {
      const records = await Attendance.find({
        event: { $in: raviEventIds },
        status: 'present'
      }).populate('member');

      const memberScoreMap = new Map();

      for (const record of records) {
        if (!record.member) continue;
        if (type && type !== 'all' && record.member.type !== type) continue;

        const memberId = record.member._id.toString();
        const evConfig = eventMap.get(record.event.toString());
        const pts = computePointsForRecord(record, evConfig);
        const arrivalMins = record.arrivalTime ? getISTMinutes(record.arrivalTime) : 0;

        if (!memberScoreMap.has(memberId)) {
          memberScoreMap.set(memberId, {
            member: record.member,
            totalPoints: 0,
            totalMinutes: 0,
            minutesCount: 0,
            count: 0
          });
        }

        const data = memberScoreMap.get(memberId);
        data.totalPoints += pts;
        data.count += 1;
        if (arrivalMins > 0) {
          data.totalMinutes += arrivalMins;
          data.minutesCount += 1;
        }
      }

      const calculated = [];
      for (const [id, data] of memberScoreMap.entries()) {
        const avgMinutes = data.minutesCount > 0 ? (data.totalMinutes / data.minutesCount) : 0;
        const avgTimeFormatted = avgMinutes > 0 ? formatMinutesTo12h(avgMinutes) : '-';
        calculated.push({
          member: data.member,
          count: data.count,
          totalPoints: data.totalPoints,
          avgMinutes: Math.round(avgMinutes),
          avgTime: avgTimeFormatted
        });
      }

      // Sort: Highest Points -> Earliest Avg Time -> Highest Sabha Count -> Name
      calculated.sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) {
          return b.totalPoints - a.totalPoints;
        }
        if (a.avgMinutes > 0 && b.avgMinutes > 0 && a.avgMinutes !== b.avgMinutes) {
          return a.avgMinutes - b.avgMinutes;
        }
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return (a.member.name || '').localeCompare(b.member.name || '', 'gu');
      });

      const groups = [];
      let currentRank = 1;
      let index = 0;

      while (index < calculated.length && currentRank <= 10) {
        const currentPoints = calculated[index].totalPoints;
        const currentAvgMinutes = calculated[index].avgMinutes;
        const currentCount = calculated[index].count;
        const currentAvgTime = calculated[index].avgTime;
        const groupMembers = [];

        while (
          index < calculated.length &&
          calculated[index].totalPoints === currentPoints &&
          calculated[index].avgMinutes === currentAvgMinutes &&
          calculated[index].count === currentCount
        ) {
          const item = calculated[index];
          groupMembers.push({
            _id: item.member._id,
            name: item.member.name,
            nameEn: item.member.nameEn,
            uniqueCode: item.member.uniqueCode,
            type: item.member.type,
            count: item.count,
            totalPoints: item.totalPoints,
            avgTime: item.avgTime
          });
          index++;
        }

        groups.push({
          rank: currentRank,
          rankLabel: groupMembers.length > 1 ? `${currentRank}(${groupMembers.length})` : `${currentRank}`,
          count: groupMembers.length,
          totalPoints: currentPoints,
          avgTime: currentAvgTime,
          avgMinutes: currentAvgMinutes,
          members: groupMembers
        });

        currentRank++;
      }

      return groups;
    };

    // 2. Compute Most Late Attendees Group
    const computeLateGroups = async () => {
      const records = await Attendance.find({
        event: { $in: raviEventIds },
        status: 'present',
        isLate: true
      }).populate('member');

      const memberLateMap = new Map();

      for (const record of records) {
        if (!record.member) continue;
        if (type && type !== 'all' && record.member.type !== type) continue;

        const memberId = record.member._id.toString();
        const arrivalMins = record.arrivalTime ? getISTMinutes(record.arrivalTime) : 0;

        if (!memberLateMap.has(memberId)) {
          memberLateMap.set(memberId, {
            member: record.member,
            lateCount: 0,
            totalLateMinutes: 0,
            minutesCount: 0
          });
        }

        const data = memberLateMap.get(memberId);
        data.lateCount += 1;
        if (arrivalMins > 0) {
          data.totalLateMinutes += arrivalMins;
          data.minutesCount += 1;
        }
      }

      const calculated = [];
      for (const [id, data] of memberLateMap.entries()) {
        const avgMinutes = data.minutesCount > 0 ? (data.totalLateMinutes / data.minutesCount) : 0;
        const avgTimeFormatted = avgMinutes > 0 ? formatMinutesTo12h(avgMinutes) : '-';
        calculated.push({
          member: data.member,
          count: data.lateCount,
          avgMinutes: Math.round(avgMinutes),
          avgTime: avgTimeFormatted
        });
      }

      calculated.sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        if (b.avgMinutes !== a.avgMinutes) {
          return b.avgMinutes - a.avgMinutes;
        }
        return (a.member.name || '').localeCompare(b.member.name || '', 'gu');
      });

      const groups = [];
      let currentRank = 1;
      let index = 0;

      while (index < calculated.length && currentRank <= 10) {
        const currentCount = calculated[index].count;
        const currentAvgMinutes = calculated[index].avgMinutes;
        const groupMembers = [];

        while (
          index < calculated.length &&
          calculated[index].count === currentCount &&
          calculated[index].avgMinutes === currentAvgMinutes
        ) {
          const item = calculated[index];
          groupMembers.push({
            _id: item.member._id,
            name: item.member.name,
            nameEn: item.member.nameEn,
            uniqueCode: item.member.uniqueCode,
            type: item.member.type,
            count: item.count,
            avgTime: item.avgTime
          });
          index++;
        }

        groups.push({
          rank: currentRank,
          rankLabel: `${currentRank}(${groupMembers.length})`,
          count: groupMembers.length,
          avgTime: calculated[index - 1]?.avgTime || '-',
          avgMinutes: currentAvgMinutes,
          members: groupMembers
        });

        currentRank++;
      }

      return groups;
    };

    const raviTopGroups = await computeTopPointsGroups();
    const raviLateGroups = await computeLateGroups();

    res.json({
      raviTopGroups,
      raviLateGroups
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('સર્વર ભૂલ');
  }
});

export default router;
