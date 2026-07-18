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

    const savedRecords = [];

    for (let record of records) {
      const { memberId, status, arrivalTime, isLate, remark } = record;

      if (!memberId || !status) {
        continue;
      }

      const updateFields = { status };

      if (status === 'present') {
        updateFields.arrivalTime = arrivalTime ? new Date(arrivalTime) : new Date();
        updateFields.isLate = !!isLate;
        updateFields.remark = remark || '';
      } else {
        // If absent, clear attendance metrics
        updateFields.arrivalTime = null;
        updateFields.isLate = false;
        updateFields.remark = '';
      }

      // Upsert: update if exists, insert if not
      const updatedAttendance = await Attendance.findOneAndUpdate(
        { event: eventId, member: memberId },
        { $set: updateFields },
        { upsert: true, new: true, runValidators: true }
      );

      savedRecords.push(updatedAttendance);
    }

    res.json({
      msg: 'હાજરી સફળતાપૂર્વક સાચવવામાં આવી છે', // "Attendance saved successfully"
      count: savedRecords.length,
      records: savedRecords
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('સર્વર ભૂલ');
  }
});

export default router;
