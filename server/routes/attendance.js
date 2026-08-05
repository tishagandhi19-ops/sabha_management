import express from 'express';
import Attendance from '../models/Attendance.js';
import Event from '../models/Event.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/attendance/bulk
// @desc    Submit bulk attendance for an event
// @access  Private (Admin)
router.post('/bulk', auth, async (req, res) => {
  const { eventId, records } = req.body; // records = Array of { memberId, status, arrivalTime, isLate, remark }

  if (!eventId || !records || !Array.isArray(records)) {
    return res.status(400).json({ msg: 'અમાન્ય ડેટા સબમિટ થયો છે' }); // "Invalid data submitted"
  }

  try {
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ msg: 'સભા મળી નથી' });
    }

    const operations = [];

    for (let record of records) {
      const { memberId, status, arrivalTime, isLate, remark } = record;

      if (!memberId || !status) {
        continue;
      }

      if (status === 'absent') {
        operations.push({
          deleteOne: {
            filter: { event: eventId, member: memberId }
          }
        });
      } else {
        const updateFields = {
          status,
          arrivalTime: status === 'present' ? (arrivalTime ? new Date(arrivalTime) : new Date()) : null,
          isLate: status === 'present' ? !!isLate : false,
          remark: remark || ''
        };

        operations.push({
          updateOne: {
            filter: { event: eventId, member: memberId },
            update: { $set: updateFields },
            upsert: true
          }
        });
      }
    }

    if (operations.length > 0) {
      await Attendance.bulkWrite(operations);
    }

    res.json({
      msg: 'હાજરી સફળતાપૂર્વક સાચવવામાં આવી છે',
      count: operations.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('સર્વર ભૂલ');
  }
});

export default router;
