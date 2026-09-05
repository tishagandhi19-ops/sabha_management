import * as XLSX from 'xlsx';

// Predefined Late Reasons in Gujarati
export const LATE_REASON_OPTIONS = [
  'દુકાન',
  'ધંધાર્થે',
  'આળસ',
  'ઊંઘતા હતા',
  'બહારગામ ગયા હોવાથી',
  'ભણતા હતા',
  'અન્ય'
];

// Localization mapping for categories
export const CATEGORY_LABELS = {
  all: 'બધા સભ્યો',
  bal: 'બાળ (૧૪ થી નીચે)',
  kishor: 'કિશોર (૧૪-૧૭)',
  yuva: 'યુવા (૧૮-૫૦)',
  proudh: 'પ્રૌઢ',
  vadil: 'વડીલ (૫૦+)'
};

export const CATEGORY_TAGS = {
  bal: 'બાળ',
  kishor: 'કિશોર',
  yuva: 'યુવા',
  proudh: 'પ્રૌઢ',
  vadil: 'વડીલ'
};

export const SEVA_CATEGORY_LABELS = {
  all: 'બધા સભ્યો',
  bal: 'બાળ (૧૪ થી નીચે)',
  kisori: 'કિશોરી (૧૪-૧૭)',
  yuvti: 'યુવતી (૧૮-૫૦)',
  prutha: 'પ્રૌઢા',
  vadil: 'વડીલ (૫૦+)'
};

export const SEVA_CATEGORY_TAGS = {
  bal: 'બાળ',
  kisori: 'કિશોરી',
  yuvti: 'યુવતી',
  prutha: 'પ્રૌઢા',
  vadil: 'વડીલ'
};

export const SABHA_TYPES = {
  ravi_sabha: 'રવિસભા'
};

export const formatTime12h = (time24) => {
  if (!time24) return '';
  const [hoursStr, minutesStr] = time24.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = minutesStr;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const paddedHours = String(hours).padStart(2, '0');
  return `${paddedHours}:${minutes} ${ampm}`;
};

export const parseExcelMembers = (file, isSeva) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet);

        if (rows.length > 0) {
          const hasGenderColumn = Object.keys(rows[0]).some(k => /[gz]ender/i.test(k) || /sex/i.test(k) || /જાતિ/i.test(k));
          if (!hasGenderColumn) {
            throw new Error('એક્સેલ ફાઇલમાં Gender/Zender (જાતિ) કોલમ હોવી જરૂરી છે.');
          }
        }

        const mapped = rows.map((row) => {
          const findValue = (regexes) => {
            for (const regex of regexes) {
              const key = Object.keys(row).find(k => regex.test(k));
              if (key !== undefined) return row[key];
            }
            return undefined;
          };

          const genderVal = findValue([/[gz]ender/i, /sex/i, /જાતિ/i]);
          const gStr = genderVal ? genderVal.toString().trim().toLowerCase() : '';
          const isMale = gStr.startsWith('m') || gStr === 'purush' || gStr === 'પુરુષ' || gStr === 'પુરૂષ';
          const isFemale = gStr.startsWith('f') || gStr === 'stri' || gStr === 'સ્ત્રી';

          if (isSeva && !isFemale) return null;
          if (!isSeva && !isMale) return null;

          const nameVal = findValue([/fullnameguj/i, /name/i]);
          const nameEnVal = findValue([/fullnameeng/i, /englishname/i, /nameen/i, /engname/i]);
          const ageVal = findValue([/age/i]);
          const mobileVal = findValue([/mobile\s*no\s*1/i, /mobile/i, /phone/i]);
          const smkVal = findValue([/smk/i, /uniquecode/i, /code/i]);

          let type = isSeva ? 'yuvti' : 'yuva';
          if (ageVal !== undefined && ageVal !== null && ageVal !== '') {
            const age = parseInt(ageVal, 10);
            if (!isNaN(age)) {
              if (age < 14) {
                type = 'bal';
              } else if (age <= 17) {
                type = isSeva ? 'kisori' : 'kishor';
              } else if (age <= 50) {
                type = isSeva ? 'yuvti' : 'yuva';
              } else {
                type = isSeva ? 'prutha' : 'proudh';
              }
            }
          }

          let formattedMobile = '';
          if (mobileVal !== undefined && mobileVal !== null) {
            const clean = mobileVal.toString().replace(/\D/g, '');
            if (clean.length >= 10) {
              formattedMobile = clean.slice(-10);
            }
          }

          let formattedCode = '';
          if (smkVal !== undefined && smkVal !== null) {
            formattedCode = smkVal.toString().trim();
          }

          return {
            name: nameVal ? nameVal.toString().trim() : '',
            nameEn: nameEnVal ? nameEnVal.toString().trim() : '',
            type,
            uniqueCode: formattedCode,
            mobileNumber: formattedMobile
          };
        }).filter(Boolean);

        resolve(mapped);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('ફાઇલ લોડ કરવામાં ભૂલ આવી'));
    reader.readAsArrayBuffer(file);
  });
};
