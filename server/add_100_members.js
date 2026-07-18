import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Member from './models/Member.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sabha-management';

const gujaratiFirstNames = [
  'આરવ', 'ધ્રુવ', 'વિવાન', 'કબીર', 'અયાન', 'કૃષ્ણ', 'હર્ષ', 'પાર્થ', 'જય', 'દક્ષ',
  'મનન', 'કેયુર', 'દર્શન', 'નિલ', 'રાહુલ', 'જીત', 'પ્રેમ', 'યશ', 'આદિત્ય', 'રાજ',
  'ભાર્ગવ', 'ચિંતન', 'દિશાંત', 'ગૌરવ', 'હાર્દિક', 'ઈશાન', 'જૈમિન', 'કૃણાલ', 'નૈમિષ', 'પ્રણવ',
  'ઋષભ', 'સાર્થક', 'તપન', 'ઉત્સવ', 'વત્સલ', 'વ્યોમ', 'યુગ', 'અભિષેક', 'આકાશ', 'આનંદ',
  'મહેન્દ્ર', 'અમિત', 'પ્રફુલ', 'હરજીવન', 'વાસુદેવ', 'ધર્મરાજ', 'જયેશ', 'હસમુખ', 'કાંતિલાલ', 'ચોકસી'
];

const gujaratiLastNames = [
  'પટેલ', 'શાહ', 'મહેતા', 'જોશી', 'ત્રિવેદી', 'વ્યાસ', 'સોની', 'પંડ્યા', 'ઓઝા', 'ભટ્ટ',
  'કાપડિયા', 'દરજી', 'પંચાલ', 'રાવલ', 'દવે', 'જાની', 'દોશી', 'શેઠ', 'પારેખ', 'મોદી',
  'ગાંધી', 'અમીન', 'વાઘેલા', 'રાઠોડ', 'ઝાલા', 'ચૌહાણ', 'ગોહિલ', 'સોલંકી', 'ચાવડા', 'પરમાર'
];

const types = ['kishor', 'yuva', 'proudh', 'vadil'];

async function seed100Members() {
  console.log('Connecting to database...');
  await mongoose.connect(MONGO_URI);
  console.log('Database connected.');

  // Delete existing members first to prevent duplicate code issues
  console.log('Removing existing members...');
  await Member.deleteMany({});
  console.log('Existing members removed.');

  const newMembers = [];

  for (let i = 1; i <= 100; i++) {
    const fn = gujaratiFirstNames[Math.floor(Math.random() * gujaratiFirstNames.length)];
    const ln = gujaratiLastNames[Math.floor(Math.random() * gujaratiLastNames.length)];
    const fullName = `${fn} ${ln}`;
    
    // Distribute categories
    let type = 'yuva';
    if (i <= 25) type = 'kishor';
    else if (i <= 65) type = 'yuva';
    else if (i <= 85) type = 'proudh';
    else type = 'vadil';

    // Unique Code e.g. SM001 to SM100
    const padNum = String(i).padStart(3, '0');
    const uniqueCode = `SM${padNum}`;

    newMembers.push({
      name: fullName,
      type: type,
      uniqueCode: uniqueCode
    });
  }

  console.log('Inserting 100 members...');
  const inserted = await Member.insertMany(newMembers);
  console.log(`Successfully inserted ${inserted.length} members into MongoDB!`);
  
  await mongoose.disconnect();
}

seed100Members().catch(err => {
  console.error('Seeding 100 members failed:', err);
  process.exit(1);
});
