import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Member from './models/Member.js';
import Event from './models/Event.js';
import Attendance from './models/Attendance.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sabha-management';

async function seedAndVerify() {
  console.log('Connecting to database...');
  await mongoose.connect(MONGO_URI);
  console.log('Database connected successfully.');

  // Clear existing databases
  console.log('Cleaning existing database collections...');
  await Member.deleteMany({});
  await Event.deleteMany({});
  await Attendance.deleteMany({});
  console.log('Cleanup completed.');

  // 1. Create Members in Gujarati
  console.log('Seeding members...');
  const members = await Member.insertMany([
    { name: 'યશ ગાંધી', type: 'yuva', uniqueCode: 'YG01' },
    { name: 'અમિત પટેલ', type: 'kishor', uniqueCode: 'KP02' },
    { name: 'મહેન્દ્રભાઈ શાહ', type: 'proudh', uniqueCode: 'MP03' },
    { name: 'હરજીવનદાસ ભગત', type: 'vadil', uniqueCode: 'HB04' }
  ]);
  console.log(`Successfully seeded ${members.length} members.`);

  // 2. Create Events (Savar ni Katha and Ravi Sabha)
  console.log('Creating events...');
  const today = new Date();
  
  const savarKatha = await new Event({
    date: today,
    type: 'savar_ni_katha'
  }).save();

  const raviSabha = await new Event({
    date: today,
    type: 'ravi_sabha',
    minReachTime: '08:15'
  }).save();

  console.log('Events created successfully.');

  // 3. Mark Attendance for Savar Katha
  console.log('Recording Savar ni Katha attendance...');
  const timeSavarYG = new Date(today);
  timeSavarYG.setHours(6, 30, 0, 0); // 06:30 AM
  
  const timeSavarKP = new Date(today);
  timeSavarKP.setHours(6, 45, 0, 0); // 06:45 AM

  const timeSavarHB = new Date(today);
  timeSavarHB.setHours(7, 0, 0, 0); // 07:00 AM

  await Attendance.insertMany([
    { event: savarKatha._id, member: members[0]._id, status: 'present', arrivalTime: timeSavarYG, isLate: false },
    { event: savarKatha._id, member: members[1]._id, status: 'present', arrivalTime: timeSavarKP, isLate: false },
    { event: savarKatha._id, member: members[2]._id, status: 'absent' }, // MP03 absent
    { event: savarKatha._id, member: members[3]._id, status: 'present', arrivalTime: timeSavarHB, isLate: false }
  ]);

  // 4. Mark Attendance for Ravi Sabha (including late check)
  console.log('Recording Ravi Sabha attendance (checking arrival times)...');
  const timeRaviYG = new Date(today);
  timeRaviYG.setHours(8, 0, 0, 0); // 08:00 AM (On time)

  const timeRaviKP = new Date(today);
  timeRaviKP.setHours(8, 30, 0, 0); // 08:30 AM (Late!)

  const timeRaviMP = new Date(today);
  timeRaviMP.setHours(8, 45, 0, 0); // 08:45 AM (Late!)

  // Insert Ravi Sabha records
  await Attendance.insertMany([
    { 
      event: raviSabha._id, 
      member: members[0]._id, 
      status: 'present', 
      arrivalTime: timeRaviYG, 
      isLate: false 
    },
    { 
      event: raviSabha._id, 
      member: members[1]._id, 
      status: 'present', 
      arrivalTime: timeRaviKP, 
      isLate: true, 
      remark: 'મોબાઈલ એલાર્મ ન વાગ્યો' 
    },
    { 
      event: raviSabha._id, 
      member: members[2]._id, 
      status: 'present', 
      arrivalTime: timeRaviMP, 
      isLate: true, 
      remark: 'વાહન બગડી ગયું હતું' 
    },
    { 
      event: raviSabha._id, 
      member: members[3]._id, 
      status: 'absent' 
    }
  ]);
  console.log('Attendance records recorded successfully.');

  // 5. Verification calculations
  console.log('\n--- VERIFICATION STATS ---');
  const totalAttendance = await Attendance.countDocuments();
  const presentAttendance = await Attendance.countDocuments({ status: 'present' });
  const overallRate = (presentAttendance / totalAttendance) * 100;
  console.log(`Total Attendance Records: ${totalAttendance}`);
  console.log(`Present Count: ${presentAttendance}`);
  console.log(`Overall Attendance Rate: ${overallRate.toFixed(1)}%`);

  const lateRaviCount = await Attendance.countDocuments({ event: raviSabha._id, isLate: true });
  console.log(`Late Attendee Count for Ravi Sabha: ${lateRaviCount} (Expected: 2)`);

  const memberYGReport = await Attendance.find({ member: members[0]._id }).populate('event');
  console.log(`Member '${members[0].name}' Attendance Logs count: ${memberYGReport.length} (Expected: 2)`);
  
  const memberKPReport = await Attendance.find({ member: members[1]._id, isLate: true });
  console.log(`Member '${members[1].name}' Late Remark: "${memberKPReport[0].remark}" (Expected: "મોબાઈલ એલાર્મ ન વાગ્યો")`);

  console.log('\nVerification seeding completed successfully without issues!');
  await mongoose.disconnect();
}

seedAndVerify().catch(err => {
  console.error('Seeding verification failed:', err);
  process.exit(1);
});
