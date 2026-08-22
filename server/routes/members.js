import express from 'express';
import Member from '../models/Member.js';
import Attendance from '../models/Attendance.js';
import auth from '../middleware/auth.js';
import { transliterateGujaratiToEnglish } from '../utils/transliterate.js';

const router = express.Router();

// @route   GET /api/members
// @desc    Get all members with filters
// @access  Private (Admin)
router.get('/', auth, async (req, res) => {
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

    const members = await Member.find(query).sort({ name: 1 });
    res.json(members);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('સર્વર ભૂલ');
  }
});

// @route   POST /api/members
// @desc    Create a new member
// @access  Private (Admin)
router.post('/', auth, async (req, res) => {
  const { name, nameEn, type, uniqueCode, mobileNumber } = req.body;

  if (!name || !type) {
    return res.status(400).json({ msg: 'કૃપા કરીને બધી માહિતી ભરો' });
  }

  try {
    const finalUniqueCode = uniqueCode && uniqueCode.trim()
      ? uniqueCode.trim()
      : 'SMK-' + Math.random().toString(36).substr(2, 9).toUpperCase();

    let existingMember = await Member.findOne({ uniqueCode: finalUniqueCode });
    if (existingMember) {
      return res.status(400).json({ msg: 'આ યુનિક કોડ વાળો સભ્ય પહેલેથી જ અસ્તિત્વમાં છે' });
    }

    const finalNameEn = nameEn && nameEn.trim()
      ? nameEn.trim()
      : transliterateGujaratiToEnglish(name);

    const newMember = new Member({
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

// @route   POST /api/members/bulk
// @desc    Bulk create members
// @access  Private (Admin)
router.post('/bulk', auth, async (req, res) => {
  const { members } = req.body; // Array of { name, nameEn, type, uniqueCode, mobileNumber }

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
        : 'SMK-' + Math.random().toString(36).substr(2, 9).toUpperCase();

      const existing = await Member.findOne({ uniqueCode: cleanCode });
      if (existing) {
        errors.push({ line: index + 1, code: cleanCode, msg: `કોડ '${cleanCode}' પહેલેથી નોંધાયેલ છે` });
        continue;
      }

      const validTypes = ['bal', 'kishor', 'yuva', 'proudh', 'vadil'];
      if (!validTypes.includes(type.toLowerCase())) {
        errors.push({ line: index + 1, msg: `અમાન્ય પ્રકાર: ${type}` });
        continue;
      }

      const finalNameEn = nameEn && nameEn.toString().trim()
        ? nameEn.toString().trim()
        : transliterateGujaratiToEnglish(name);

      const newMember = new Member({
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

// @route   PUT /api/members/:id
// @desc    Update a member
// @access  Private (Admin)
router.put('/:id', auth, async (req, res) => {
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
    let member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ msg: 'સભ્ય મળ્યો નથી' }); // "Member not found"
    }

    if (uniqueCode && uniqueCode.trim() !== member.uniqueCode) {
      let existingCode = await Member.findOne({ uniqueCode: uniqueCode.trim() });
      if (existingCode) {
        return res.status(400).json({ msg: 'આ યુનિક કોડ વાળો સભ્ય પહેલેથી જ અસ્તિત્વમાં છે' });
      }
    }

    member = await Member.findByIdAndUpdate(
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

// @route   DELETE /api/members/:id
// @desc    Delete a member
// @access  Private (Admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ msg: 'સભ્ય મળ્યો નથી' });
    }

    // Delete associated attendance record
    await Attendance.deleteMany({ member: req.params.id });
    await Member.findByIdAndDelete(req.params.id);

    res.json({ msg: 'સભ્ય સફળતાપૂર્વક કાઢી નાખવામાં આવ્યો છે' }); // "Member deleted successfully"
  } catch (err) {
    console.error(err.message);
    res.status(500).send('સર્વર ભૂલ');
  }
});

export default router;
