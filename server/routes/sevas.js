import express from 'express';
import SevaType from '../models/SevaType.js';
import Seva from '../models/Seva.js';
import SevaAttendance from '../models/SevaAttendance.js';
import SevaMember from '../models/SevaMember.js';
import auth from '../middleware/auth.js';
import { transliterateGujaratiToEnglish } from '../utils/transliterate.js';
import { sortMembersBySearchRank } from '../utils/searchRank.js';

const router = express.Router();

// --- SEVA TYPES ROUTES ---

// Get all seva types
router.get('/types', auth, async (req, res) => {
  try {
    const types = await SevaType.find().sort({ name: 1 });
    res.json(types);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('સર્વર ભૂલ');
  }
});

// Create seva type
router.post('/types', auth, async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ msg: 'કૃપા કરીને સેવાનો પ્રકાર દાખલ કરો' });
  }
  try {
    let typeExists = await SevaType.findOne({ name });
    if (typeExists) {
      return res.status(400).json({ msg: 'આ સેવાનો પ્રકાર પહેલેથી અસ્તિત્વમાં છે' });
    }
    const newType = new SevaType({ name });
    await newType.save();
    res.json(newType);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('સર્વર ભૂલ');
  }
});

// Delete seva type
router.delete('/types/:id', auth, async (req, res) => {
  try {
    await SevaType.findByIdAndDelete(req.params.id);
    res.json({ msg: 'સેવાનો પ્રકાર સફળતાપૂર્વક કાઢી નાખવામાં આવ્યો છે' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('સર્વર ભૂલ');
  }
});

// --- SEVAS ROUTES ---

// Get all sevas
router.get('/', auth, async (req, res) => {
  try {
    const sevas = await Seva.find()
      .populate('sevaType')
      .sort({ date: -1 });
    res.json(sevas);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('સર્વર ભૂલ');
  }
});

// Create new Seva
router.post('/', auth, async (req, res) => {
  const { date, sevaTypeId, leader } = req.body;
  if (!date || !sevaTypeId) {
    return res.status(400).json({ msg: 'કૃપા કરીને તારીખ અને સેવાનો પ્રકાર પસંદ કરો' });
  }
  try {
    const newSeva = new Seva({
      date,
      sevaType: sevaTypeId,
      leader: leader || ""
    });
    await newSeva.save();
    
    const populated = await Seva.findById(newSeva._id).populate('sevaType');
    res.json(populated);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('સર્વર ભૂલ');
  }
});



// --- SEVA MEMBERS ROUTES ---

// Get all Seva members with filters
router.get('/members', auth, async (req, res) => {
  try {
    const { search, type } = req.query;
    let query = {};

    const cleanSearch = search ? search.trim() : '';
    if (cleanSearch) {
      query.$or = [
        { name: { $regex: cleanSearch, $options: 'i' } },
        { nameEn: { $regex: cleanSearch, $options: 'i' } },
        { uniqueCode: { $regex: cleanSearch, $options: 'i' } },
        { mobileNumber: { $regex: cleanSearch, $options: 'i' } }
      ];
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    let members = await SevaMember.find(query);
    members = sortMembersBySearchRank(members, cleanSearch);
    res.json(members);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('સર્વર ભૂલ');
  }
});

// Create a new Seva member
router.post('/members', auth, async (req, res) => {
  const { name, nameEn, type, uniqueCode, mobileNumber } = req.body;

  if (!name || !type) {
    return res.status(400).json({ msg: 'કૃપા કરીને બધી માહિતી ભરો' });
  }

  try {
    const finalUniqueCode = uniqueCode && uniqueCode.trim()
      ? uniqueCode.trim()
      : 'SEVA-' + Math.random().toString(36).substr(2, 9).toUpperCase();

    let existingMember = await SevaMember.findOne({ uniqueCode: finalUniqueCode });
    if (existingMember) {
      return res.status(400).json({ msg: 'આ યુનિક કોડ વાળો સભ્ય પહેલેથી જ અસ્તિત્વમાં છે' });
    }

    const finalNameEn = nameEn && nameEn.trim()
      ? nameEn.trim()
      : transliterateGujaratiToEnglish(name);

    const newMember = new SevaMember({
      name: name.trim(),
      nameEn: finalNameEn,
      type,
      uniqueCode: finalUniqueCode,
      mobileNumber: mobileNumber ? mobileNumber.trim() : undefined
    });

    const member = await newMember.save();
    res.json(member);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('સર્વર ભૂલ');
  }
});

// Bulk create Seva members
router.post('/members/bulk', auth, async (req, res) => {
  const { members } = req.body;

  if (!members || !Array.isArray(members) || members.length === 0) {
    return res.status(400).json({ msg: 'અમાન્ય સભ્યોની લિસ્ટ' });
  }

  try {
    const savedMembers = [];
    const errors = [];

    for (let index = 0; index < members.length; index++) {
      const { name, nameEn, type, uniqueCode, mobileNumber } = members[index];
      if (!name || !type) {
        errors.push({ line: index + 1, msg: 'અપૂર્ણ માહિતી (નામ અથવા પ્રકાર ગુમ છે)' });
        continue;
      }

      const cleanCode = uniqueCode && uniqueCode.toString().trim()
        ? uniqueCode.toString().trim()
        : 'SEVA-' + Math.random().toString(36).substr(2, 9).toUpperCase();

      const existing = await SevaMember.findOne({ uniqueCode: cleanCode });
      if (existing) {
        errors.push({ line: index + 1, code: cleanCode, msg: `કોડ '${cleanCode}' પહેલેથી નોંધાયેલ છે` });
        continue;
      }

      const validTypes = ['bal', 'kisori', 'yuvti', 'prutha', 'vadil'];
      if (!validTypes.includes(type.toLowerCase())) {
        errors.push({ line: index + 1, msg: `અમાન્ય પ્રકાર: ${type}` });
        continue;
      }

      const finalNameEn = nameEn && nameEn.toString().trim()
        ? nameEn.toString().trim()
        : transliterateGujaratiToEnglish(name);

      const newMember = new SevaMember({
        name: name.trim(),
        nameEn: finalNameEn,
        type: type.toLowerCase(),
        uniqueCode: cleanCode,
        mobileNumber: mobileNumber ? mobileNumber.toString().trim() : undefined
      });

      const saved = await newMember.save();
      savedMembers.push(saved);
    }

    res.json({
      successCount: savedMembers.length,
      errorsCount: errors.length,
      savedMembers,
      errors
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('સર્વર ભૂલ');
  }
});

// Update a Seva member
router.put('/members/:id', auth, async (req, res) => {
  const { name, nameEn, type, uniqueCode, mobileNumber } = req.body;
  
  const updateFields = {};
  if (name) {
    updateFields.name = name.trim();
    updateFields.nameEn = nameEn && nameEn.trim()
      ? nameEn.trim()
      : transliterateGujaratiToEnglish(name);
  } else if (nameEn !== undefined) {
    updateFields.nameEn = nameEn ? nameEn.trim() : '';
  }

  if (type) updateFields.type = type;
  if (uniqueCode) updateFields.uniqueCode = uniqueCode.trim();
  if (mobileNumber !== undefined) updateFields.mobileNumber = mobileNumber ? mobileNumber.trim() : '';

  try {
    let member = await SevaMember.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ msg: 'સભ્ય મળ્યો નથી' });
    }

    if (uniqueCode && uniqueCode.trim() !== member.uniqueCode) {
      let existingCode = await SevaMember.findOne({ uniqueCode: uniqueCode.trim() });
      if (existingCode) {
        return res.status(400).json({ msg: 'આ યુનિક કોડ વાળો સભ્ય પહેલેથી જ અસ્તિત્વમાં છે' });
      }
    }

    member = await SevaMember.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );

    res.json(member);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('સર્વર ભૂલ');
  }
});

// Delete a Seva member
router.delete('/members/:id', auth, async (req, res) => {
  try {
    const member = await SevaMember.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ msg: 'સભ્ય મળ્યો નથી' });
    }

    await SevaAttendance.deleteMany({ member: req.params.id });
    await SevaMember.findByIdAndDelete(req.params.id);

    res.json({ msg: 'સભ્ય સફળતાપૂર્વક કાઢી નાખવામાં આવ્યો છે' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('સર્વર ભૂલ');
  }
});

// --- REPORT ROUTES ---

// Get overall Seva statistics (member-wise total hours and count)
router.get('/reports/summary', auth, async (req, res) => {
  try {
    const report = await SevaAttendance.aggregate([
      { $match: { status: 'present' } },
      {
        $group: {
          _id: '$member',
          totalHours: { $sum: '$hours' },
          sevaCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'sevamembers',
          localField: '_id',
          foreignField: '_id',
          as: 'memberDetails'
        }
      },
      { $unwind: '$memberDetails' },
      {
        $project: {
          _id: 1,
          totalHours: 1,
          sevaCount: 1,
          name: '$memberDetails.name',
          uniqueCode: '$memberDetails.uniqueCode',
          type: '$memberDetails.type'
        }
      },
      { $sort: { totalHours: -1, name: 1 } }
    ]);
    res.json(report);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('સર્વર ભૂલ');
  }
});

// Get Seva Type-wise leaderboard statistics
router.get('/reports/type-leaderboard', auth, async (req, res) => {
  try {
    const report = await SevaAttendance.aggregate([
      { $match: { status: 'present' } },
      {
        $lookup: {
          from: 'sevas',
          localField: 'seva',
          foreignField: '_id',
          as: 'sevaDetails'
        }
      },
      { $unwind: '$sevaDetails' },
      {
        $group: {
          _id: {
            member: '$member',
            sevaType: '$sevaDetails.sevaType'
          },
          totalHours: { $sum: '$hours' },
          sevaCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'sevamembers',
          localField: '_id.member',
          foreignField: '_id',
          as: 'memberDetails'
        }
      },
      { $unwind: '$memberDetails' },
      {
        $lookup: {
          from: 'sevatypes',
          localField: '_id.sevaType',
          foreignField: '_id',
          as: 'typeDetails'
        }
      },
      { $unwind: '$typeDetails' },
      {
        $project: {
          _id: 0,
          memberId: '$_id.member',
          sevaTypeId: '$_id.sevaType',
          totalHours: 1,
          sevaCount: 1,
          name: '$memberDetails.name',
          uniqueCode: '$memberDetails.uniqueCode',
          type: '$memberDetails.type',
          sevaTypeName: '$typeDetails.name'
        }
      },
      { $sort: { sevaTypeName: 1, totalHours: -1, name: 1 } }
    ]);
    res.json(report);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('સર્વર ભૂલ');
  }
});

// Get detailed individual member seva reports
router.get('/reports/member/:id', auth, async (req, res) => {
  try {
    const member = await SevaMember.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ msg: 'સભ્ય મળ્યો નથી' });
    }

    const attendanceLogs = await SevaAttendance.find({ member: req.params.id })
      .populate({
        path: 'seva',
        populate: { path: 'sevaType' }
      });

    // Filter out null sevas
    const validLogs = attendanceLogs.filter(log => log.seva != null);

    const totalSevaCount = validLogs.length;
    const presentLogs = validLogs.filter(log => log.status === 'present');
    const presentCount = presentLogs.length;
    const totalHours = presentLogs.reduce((acc, log) => acc + (log.hours || 0), 0);

    const history = validLogs.map(log => ({
      _id: log._id,
      date: log.seva.date,
      sevaType: log.seva.sevaType ? log.seva.sevaType.name : 'અજ્ઞાત સેવા',
      status: log.status,
      hours: log.hours
    })).sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      member,
      stats: {
        totalSevas: totalSevaCount,
        present: presentCount,
        absent: totalSevaCount - presentCount,
        totalHours: totalHours
      },
      history
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('સર્વર ભૂલ');
  }
});

// Get details of a single seva with its attendance list
router.get('/:id', auth, async (req, res) => {
  try {
    const seva = await Seva.findById(req.params.id).populate('sevaType');
    if (!seva) {
      return res.status(404).json({ msg: 'સેવા મળી નથી' });
    }
    const attendance = await SevaAttendance.find({ seva: req.params.id }).populate('member');
    res.json({ seva, attendance });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('સર્વર ભૂલ');
  }
});

// Save or Update attendance for a Seva
router.post('/:id/attendance', auth, async (req, res) => {
  const { attendanceRecords } = req.body; // Array of { member: memberId, status, hours }
  if (!attendanceRecords || !Array.isArray(attendanceRecords)) {
    return res.status(400).json({ msg: 'અમાન્ય હાજરી માહિતી' });
  }
  try {
    const sevaId = req.params.id;
    const seva = await Seva.findById(sevaId);
    if (!seva) {
      return res.status(404).json({ msg: 'સેવા મળી નથી' });
    }

    const operations = [];

    for (let record of attendanceRecords) {
      const { memberId, status, hours } = record;
      if (!memberId || !status) {
        continue;
      }

      if (status === 'absent') {
        operations.push({
          deleteOne: {
            filter: { seva: sevaId, member: memberId }
          }
        });
      } else {
        operations.push({
          updateOne: {
            filter: { seva: sevaId, member: memberId },
            update: { $set: { status, hours: status === 'present' ? (hours || 0) : 0 } },
            upsert: true
          }
        });
      }
    }

    if (operations.length > 0) {
      await SevaAttendance.bulkWrite(operations);
    }

    res.json({ msg: 'હાજરી સફળતાપૂર્વક સાચવવામાં આવી છે' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('સર્વર ભૂલ');
  }
});

// Delete a Seva
router.delete('/:id', auth, async (req, res) => {
  try {
    // Delete attendance records of this seva first
    await SevaAttendance.deleteMany({ seva: req.params.id });
    await Seva.findByIdAndDelete(req.params.id);
    res.json({ msg: 'સેવા સફળતાપૂર્વક કાઢી નાખવામાં આવી છે' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('સર્વર ભૂલ');
  }
});

export default router;
