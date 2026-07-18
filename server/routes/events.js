import express from 'express';
import Event from '../models/Event.js';
import Attendance from '../models/Attendance.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/events
// @desc    Get all events
// @access  Private (Admin)
router.get('/', auth, async (req, res) => {
  try {
    const events = await Event.find().sort({ date: -1 });
    res.json(events);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('સર્વર ભૂલ');
  }
});

// @route   POST /api/events
// @desc    Create a new event
// @access  Private (Admin)
router.post('/', auth, async (req, res) => {
  const { date, type, minReachTime } = req.body;

  if (!date || !type) {
    return res.status(400).json({ msg: 'કૃપા કરીને તારીખ અને સભાનો પ્રકાર પસંદ કરો' }); // "Please select date and event type"
  }

  try {
    const newEvent = new Event({
      date: new Date(date),
      type,
      minReachTime: type === 'ravi_sabha' ? minReachTime || '' : ''
    });

    const event = await newEvent.save();
    res.json(event);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('સર્વર ભૂલ');
  }
});

// @route   GET /api/events/:id
// @desc    Get event by ID with attendance details
// @access  Private (Admin)
router.get('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ msg: 'સભા મળી નથી' }); // "Event not found"
    }

    // Get attendance for this event
    const attendance = await Attendance.find({ event: req.params.id }).populate('member');

    res.json({ event, attendance });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('સર્વર ભૂલ');
  }
});

// @route   PUT /api/events/:id
// @desc    Update an event
// @access  Private (Admin)
router.put('/:id', auth, async (req, res) => {
  const { date, type, minReachTime } = req.body;

  const updateFields = {};
  if (date) updateFields.date = new Date(date);
  if (type) updateFields.type = type;
  if (type === 'ravi_sabha') {
    updateFields.minReachTime = minReachTime || '';
  } else {
    updateFields.minReachTime = ''; // Clear minReachTime if changed to savar_ni_katha
  }

  try {
    let event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ msg: 'સભા મળી નથી' });
    }

    event = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );

    res.json(event);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('સર્વર ભૂલ');
  }
});

// @route   DELETE /api/events/:id
// @desc    Delete an event
// @access  Private (Admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ msg: 'સભા મળી નથી' });
    }

    // Delete associated attendance records
    await Attendance.deleteMany({ event: req.params.id });
    await Event.findByIdAndDelete(req.params.id);

    res.json({ msg: 'સભા સફળતાપૂર્વક રદ કરવામાં આવી છે' }); // "Event deleted successfully"
  } catch (err) {
    console.error(err.message);
    res.status(500).send('સર્વર ભૂલ');
  }
});

export default router;
