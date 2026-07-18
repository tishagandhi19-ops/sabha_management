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
// @desc    Get top 10 members for savarni katha, ravi sabha, early/on-time ravi sabha, and late ravi sabha
// @access  Private (Admin)
router.get('/top-attendees', auth, async (req, res) => {
  try {
    const savarEvents = await Event.find({ type: 'savar_ni_katha' }).select('_id');
    const savarEventIds = savarEvents.map(e => e._id);
    
    const raviEvents = await Event.find({ type: 'ravi_sabha' }).select('_id');
    const raviEventIds = raviEvents.map(e => e._id);

    // 1. Top 10 present in Savar ni Katha
    const topSavar = await Attendance.aggregate([
      { $match: { event: { $in: savarEventIds }, status: 'present' } },
      { $group: { _id: '$member', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'members', localField: '_id', foreignField: '_id', as: 'memberInfo' } },
      { $unwind: '$memberInfo' }
    ]);

    // 2. Top 10 present in Ravi Sabha
    const topRavi = await Attendance.aggregate([
      { $match: { event: { $in: raviEventIds }, status: 'present' } },
      { $group: { _id: '$member', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'members', localField: '_id', foreignField: '_id', as: 'memberInfo' } },
      { $unwind: '$memberInfo' }
    ]);

    // 3. Punctual (Early/On-Time) in Ravi Sabha - presents where isLate === false
    const earlyRavi = await Attendance.aggregate([
      { $match: { event: { $in: raviEventIds }, status: 'present', isLate: false } },
      { $group: { _id: '$member', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'members', localField: '_id', foreignField: '_id', as: 'memberInfo' } },
      { $unwind: '$memberInfo' }
    ]);

    // 4. Late in Ravi Sabha - presents where isLate === true
    const lateRavi = await Attendance.aggregate([
      { $match: { event: { $in: raviEventIds }, status: 'present', isLate: true } },
      { $group: { _id: '$member', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'members', localField: '_id', foreignField: '_id', as: 'memberInfo' } },
      { $unwind: '$memberInfo' }
    ]);

    res.json({
      topSavar: topSavar.map(item => ({
        member: item.memberInfo,
        count: item.count
      })),
      topRavi: topRavi.map(item => ({
        member: item.memberInfo,
        count: item.count
      })),
      earlyRavi: earlyRavi.map(item => ({
        member: item.memberInfo,
        count: item.count
      })),
      lateRavi: lateRavi.map(item => ({
        member: item.memberInfo,
        count: item.count
      }))
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('સર્વર ભૂલ');
  }
});

export default router;
