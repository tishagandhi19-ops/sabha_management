/**
 * English (Latin/Hinglish/Gujlish) to Gujarati Phonetic Transliteration Engine
 * Accurately converts phonetic English typing to Gujarati script.
 */

// Common vocabulary dictionary for high-precision transliteration
const DICTIONARY = {
  // Late reasons requested
  'dukan': 'દુકાન',
  'dokaan': 'દુકાન',
  'dukaan': 'દુકાન',
  'dukane': 'દુકાને',
  'shop': 'દુકાન',
  'dhandharthe': 'ધંધાર્થે',
  'dhandharthey': 'ધંધાર્થે',
  'dhandha': 'ધંધો',
  'dhandhe': 'ધંધે',
  'dhandho': 'ધંધો',
  'business': 'ધંધો',
  'aadas': 'આળસ',
  'aals': 'આળસ',
  'aalas': 'આળસ',
  'alas': 'આળસ',
  'unghta': 'ઊંઘતા',
  'unghta hata': 'ઊંઘતા હતા',
  'unghata': 'ઊંઘતા',
  'ungh': 'ઊંઘ',
  'hata': 'હતા',
  'hati': 'હતી',
  'hato': 'હતો',
  'bahargam': 'બહારગામ',
  'bahar': 'બહાર',
  'gam': 'ગામ',
  'gaya': 'ગયા',
  'gaya hovathi': 'ગયા હોવાથી',
  'gayela': 'ગયેલા',
  'hovathi': 'હોવાથી',
  'bhanta': 'ભણતા',
  'bhanata': 'ભણતા',
  'bhanta hata': 'ભણતા હતા',
  'bhanva': 'ભણવા',
  'bhanvanu': 'ભણવાનું',
  'study': 'ભણતર',
  'any': 'અન્ય',
  'anya': 'અન્ય',
  'other': 'અન્ય',

  // Common additional late reasons & daily words
  'kaam': 'કામ',
  'kam': 'કામ',
  'kaame': 'કામે',
  'bimar': 'બીમાર',
  'bimari': 'બીમારી',
  'tabiyat': 'તબિયત',
  'kharab': 'ખરાબ',
  'gadi': 'ગાડી',
  'traffic': 'ટ્રાફિક',
  'office': 'ઓફિસ',
  'job': 'જોબ',
  'hospital': 'હોસ્પિટલ',
  'mehman': 'મહેમાન',
  'mehmaan': 'મહેમાન',
  'avya': 'આવ્યા',
  'aavya': 'આવ્યા',
  'parivar': 'પરિવાર',
  'ghar': 'ઘર',
  'ghare': 'ઘરે',
  'school': 'સ્કૂલ',
  'college': 'કોલેજ',
  'exam': 'પરીક્ષા',
  'pariksha': 'પરીક્ષા',
  'class': 'ક્લાસ',
  'classes': 'ક્લાસીસ',
  'tuition': 'ટ્યુશન',
  'late': 'લેટ',
  'thodu': 'થોડું',
  'samay': 'સમય',
  'raste': 'રસ્તે',
  'rokaya': 'રોકાયા',
  'vahila': 'વહેલા',
  'motar': 'મોટર',
  'puncture': 'પંચર',
  'panchar': 'પંચર',
  'rain': 'વરસાદ',
  'varsad': 'વરસાદ',
  'ma': 'માં',
  'thi': 'થી',
  'ne': 'ને',
  'no': 'નો',
  'ni': 'ની',
  'nu': 'નું',
  'na': 'ના'
};

// Multi-character consonant mapping (order by length desc)
const CONSONANTS = [
  { en: 'ksh', gu: 'ક્ષ' },
  { en: 'gny', gu: 'જ્ઞ' },
  { en: 'dny', gu: 'જ્ઞ' },
  { en: 'gnh', gu: 'જ્ઞ' },
  { en: 'gy', gu: 'જ્ઞ' },
  { en: 'gn', gu: 'જ્ઞ' },
  { en: 'chh', gu: 'છ' },
  { en: 'shh', gu: 'ષ' },
  { en: 'shr', gu: 'શ્ર' },
  { en: 'kh', gu: 'ખ' },
  { en: 'gh', gu: 'ઘ' },
  { en: 'ch', gu: 'ચ' },
  { en: 'jh', gu: 'ઝ' },
  { en: 'zh', gu: 'ઝ' },
  { en: 'th', gu: 'થ' },
  { en: 'dh', gu: 'ધ' },
  { en: 'ph', gu: 'ફ' },
  { en: 'bh', gu: 'ભ' },
  { en: 'sh', gu: 'શ' },
  { en: 'tr', gu: 'ત્ર' },
  { en: 'k', gu: 'ક' },
  { en: 'g', gu: 'ગ' },
  { en: 'j', gu: 'જ' },
  { en: 'z', gu: 'ઝ' },
  { en: 't', gu: 'ત' },
  { en: 'd', gu: 'દ' },
  { en: 'n', gu: 'ન' },
  { en: 'p', gu: 'પ' },
  { en: 'f', gu: 'ફ' },
  { en: 'b', gu: 'બ' },
  { en: 'm', gu: 'મ' },
  { en: 'y', gu: 'ય' },
  { en: 'r', gu: 'ર' },
  { en: 'l', gu: 'લ' },
  { en: 'v', gu: 'વ' },
  { en: 'w', gu: 'વ' },
  { en: 's', gu: 'સ' },
  { en: 'h', gu: 'હ' },
  { en: 'c', gu: 'ક' },
  { en: 'q', gu: 'ક' },
  { en: 'x', gu: 'ક્ષ' }
];

// Vowel mapping: Independent (start of word / after vowel) & Dependent (matra after consonant)
const VOWELS = [
  { en: 'aee', ind: 'આઈ', dep: 'ાઈ' },
  { en: 'aai', ind: 'આઈ', dep: 'ાઈ' },
  { en: 'aau', ind: 'આઉ', dep: 'ાઉ' },
  { en: 'aaw', ind: 'આવ', dep: 'ાવ' },
  { en: 'aao', ind: 'આઓ', dep: 'ાઓ' },
  { en: 'ai', ind: 'ઐ', dep: 'ૈ' },
  { en: 'au', ind: 'ઔ', dep: 'ૌ' },
  { en: 'ou', ind: 'ઔ', dep: 'ૌ' },
  { en: 'aa', ind: 'આ', dep: 'ા' },
  { en: 'ee', ind: 'ઈ', dep: 'ી' },
  { en: 'ii', ind: 'ઈ', dep: 'ી' },
  { en: 'oo', ind: 'ઊ', dep: 'ૂ' },
  { en: 'uu', ind: 'ઊ', dep: 'ૂ' },
  { en: 'ey', ind: 'એ', dep: 'ે' },
  { en: 'ay', ind: 'એ', dep: 'ે' },
  { en: 'a', ind: 'અ', dep: '' },     // inherent vowel
  { en: 'i', ind: 'ઇ', dep: 'િ' },
  { en: 'u', ind: 'ઉ', dep: 'ુ' },
  { en: 'e', ind: 'એ', dep: 'ે' },
  { en: 'o', ind: 'ઓ', dep: 'ો' }
];

const VIRAMA = '્';

/**
 * Transliterates a single English word to Gujarati script phonetically.
 */
function transliterateSingleWord(word) {
  if (!word) return '';

  const lower = word.toLowerCase();

  // 1. Direct dictionary match
  if (DICTIONARY[lower]) {
    return DICTIONARY[lower];
  }

  // 2. Already Gujarati characters or digits/symbols
  if (/^[\u0A80-\u0AFF\d\s\W]+$/.test(word)) {
    return word;
  }

  let result = '';
  let i = 0;
  const len = lower.length;
  let lastWasConsonant = false;

  while (i < len) {
    const remaining = lower.slice(i);

    // Check Anusvara ('n' before consonants at word end or before stop)
    if (remaining.startsWith('ng') && i + 2 < len) {
      result += 'ંગ';
      i += 2;
      lastWasConsonant = true;
      continue;
    }

    // Try matching vowels first
    let matchedVowel = null;
    for (const v of VOWELS) {
      if (remaining.startsWith(v.en)) {
        matchedVowel = v;
        break;
      }
    }

    if (matchedVowel) {
      if (lastWasConsonant) {
        // Apply matra
        if (matchedVowel.en === 'a') {
          // If 'a' follows a consonant, it just fulfills the inherent 'a' (no matra or trailing 'ા')
          // If followed by nothing or another vowel, do nothing; if word-final 'a' in names, sometimes 'ા'
          // Standard: do not add virama
        } else {
          result += matchedVowel.dep;
        }
      } else {
        // Independent vowel
        result += matchedVowel.ind;
      }
      i += matchedVowel.en.length;
      lastWasConsonant = false;
      continue;
    }

    // Try matching consonants
    let matchedConsonant = null;
    for (const c of CONSONANTS) {
      if (remaining.startsWith(c.en)) {
        matchedConsonant = c;
        break;
      }
    }

    if (matchedConsonant) {
      if (lastWasConsonant) {
        // Half consonant / conjunct (join with virama)
        result += VIRAMA;
      }
      result += matchedConsonant.gu;
      i += matchedConsonant.en.length;
      lastWasConsonant = true;
      continue;
    }

    // Unrecognized character (punctuation, numbers, symbols)
    result += lower[i];
    i++;
    lastWasConsonant = false;
  }

  return result;
}

/**
 * Transliterates an entire text string from English / Gujlish to Gujarati.
 * Preserves spaces, line breaks, and punctuation.
 */
export function transliterateEnglishToGujarati(text) {
  if (!text || typeof text !== 'string') return '';

  // If the text has no Latin letters (a-z, A-Z), return as is
  if (!/[a-zA-Z]/.test(text)) {
    return text;
  }

  // Check whole phrase dictionary matches first
  const cleanTrimmed = text.trim().toLowerCase();
  if (DICTIONARY[cleanTrimmed]) {
    return DICTIONARY[cleanTrimmed];
  }

  // Split by tokens (words vs non-words/spaces/punctuation)
  const tokens = text.split(/([a-zA-Z]+)/);
  return tokens
    .map(token => {
      if (/^[a-zA-Z]+$/.test(token)) {
        return transliterateSingleWord(token);
      }
      return token;
    })
    .join('');
}
