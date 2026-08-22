import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Member from '../models/Member.js';
import SevaMember from '../models/SevaMember.js';
import { transliterateGujaratiToEnglish } from '../utils/transliterate.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sabha-management';

async function transliterateAllMembers() {
  console.log('--- Starting Gujarati to English Transliteration Migration ---');
  console.log('Connecting to database...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB.');

  // 1. Transliterate Sabha Members
  console.log('\nProcessing Sabha Members...');
  const members = await Member.find({});
  let memberCount = 0;
  for (const m of members) {
    const transliterated = transliterateGujaratiToEnglish(m.name);
    m.nameEn = transliterated;
    await m.save();
    memberCount++;
    console.log(`[Sabha Member ${memberCount}/${members.length}] ${m.name} -> ${transliterated}`);
  }
  console.log(`Done: Updated ${memberCount} Sabha members.`);

  // 2. Transliterate Seva Members
  console.log('\nProcessing Seva Members...');
  const sevaMembers = await SevaMember.find({});
  let sevaCount = 0;
  for (const sm of sevaMembers) {
    const transliterated = transliterateGujaratiToEnglish(sm.name);
    sm.nameEn = transliterated;
    await sm.save();
    sevaCount++;
    console.log(`[Seva Member ${sevaCount}/${sevaMembers.length}] ${sm.name} -> ${transliterated}`);
  }
  console.log(`Done: Updated ${sevaCount} Seva members.`);

  console.log('\n--- Transliteration Migration Completed Successfully! ---');
  await mongoose.disconnect();
  console.log('Database disconnected.');
}

transliterateAllMembers().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
