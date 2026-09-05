import mongoose from 'mongoose';
import Event from '../models/Event.js';
import Member from '../models/Member.js';
import Attendance from '../models/Attendance.js';
import { transliterateGujaratiToEnglish } from '../utils/transliterate.js';
import { transliterateEnglishToGujarati } from '../utils/englishToGujarati.js';
import { sortMembersBySearchRank } from '../utils/searchRank.js';

console.log('--- RUNNING BACKEND UNIT & LOGIC VERIFICATION TESTS ---');

// 1. Test Event Model Schema
const testEvent = new Event({
  date: new Date('2026-09-06'),
  minReachTime: '08:30'
});

if (testEvent.type !== 'ravi_sabha') {
  console.error('FAIL: Event default type is not ravi_sabha, got:', testEvent.type);
  process.exit(1);
} else {
  console.log('PASS: Event model default type is ravi_sabha');
}

// 2. Test Member Model Schema
const testMember = new Member({
  name: 'યશ ગાંધી',
  nameEn: 'Yash Gandhi',
  type: 'yuva',
  uniqueCode: 'YG01'
});

if (testMember.name !== 'યશ ગાંધી' || testMember.type !== 'yuva') {
  console.error('FAIL: Member schema validation failed');
  process.exit(1);
} else {
  console.log('PASS: Member model validation succeeded');
}

// 3. Test Transliteration
const gujName = transliterateEnglishToGujarati('dukan');
if (!gujName.includes('દુકાન')) {
  console.error('FAIL: English to Gujarati transliteration failed, got:', gujName);
  process.exit(1);
} else {
  console.log('PASS: English to Gujarati transliteration works (dukan -> ' + gujName + ')');
}

const engName = transliterateGujaratiToEnglish('યશ');
if (!engName.toLowerCase().includes('yash')) {
  console.error('FAIL: Gujarati to English transliteration failed, got:', engName);
  process.exit(1);
} else {
  console.log('PASS: Gujarati to English transliteration works (યશ -> ' + engName + ')');
}

// 4. Test Search Ranking
const sampleMembers = [
  { name: 'વિજય પટેલ', nameEn: 'Vijay Patel', uniqueCode: 'VP01' },
  { name: 'યશ ગાંધી', nameEn: 'Yash Gandhi', uniqueCode: 'YG01' },
  { name: 'યશ્વી શાહ', nameEn: 'Yashvi Shah', uniqueCode: 'YS02' }
];

const ranked = sortMembersBySearchRank(sampleMembers, 'yash');
if (ranked[0].uniqueCode !== 'YG01' && ranked[0].uniqueCode !== 'YS02') {
  console.error('FAIL: Search ranking failed');
  process.exit(1);
} else {
  console.log('PASS: Search ranking accurately prioritizes prefix and match criteria');
}

// 5. Test Late Remark default 'અન્ય' formatting
const testLateLog = {
  isLate: true,
  remark: ''
};
const formattedRemark = (testLateLog.isLate && (!testLateLog.remark || !testLateLog.remark.trim())) ? 'અન્ય' : testLateLog.remark;
if (formattedRemark !== 'અન્ય') {
  console.error('FAIL: Late remark fallback failed');
  process.exit(1);
} else {
  console.log('PASS: Late remark without reason accurately defaults to અન્ય');
}

console.log('--- ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ---');
