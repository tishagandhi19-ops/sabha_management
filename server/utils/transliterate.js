/**
 * Gujarati to English Phonetic Transliteration Engine
 * Accurately converts Gujarati names to Latin/English script.
 */

const VOWEL_MAP = {
  '\u0A85': 'a',   // અ
  '\u0A86': 'aa',  // આ
  '\u0A87': 'i',   // ઇ
  '\u0A88': 'i',   // ઈ
  '\u0A89': 'u',   // ઉ
  '\u0A8A': 'u',   // ઊ
  '\u0A8B': 'ru',  // ઋ
  '\u0A8D': 'e',   // ઍ
  '\u0A8F': 'e',   // એ
  '\u0A90': 'ai',  // ઐ
  '\u0A91': 'o',   // ઑ
  '\u0A93': 'o',   // ઓ
  '\u0A94': 'au',  // ઔ
};

const MATRA_MAP = {
  '\u0ABE': 'a',   // ા
  '\u0ABF': 'i',   // િ
  '\u0AC0': 'i',   // ી
  '\u0AC1': 'u',   // ુ
  '\u0AC2': 'u',   // ૂ
  '\u0AC3': 'ru',  // ૃ
  '\u0AC4': 'ru',  // ૄ
  '\u0AC5': 'e',   // ૅ
  '\u0AC7': 'e',   // ે
  '\u0AC8': 'ai',  // ૈ
  '\u0AC9': 'o',   // ૉ
  '\u0ACB': 'o',   // ો
  '\u0ACC': 'au',  // ૌ
};

const CONSONANT_MAP = {
  '\u0A95': 'k',   // ક
  '\u0A96': 'kh',  // ખ
  '\u0A97': 'g',   // ગ
  '\u0A98': 'gh',  // ઘ
  '\u0A99': 'ng',  // ઙ
  '\u0A9A': 'ch',  // ચ
  '\u0A9B': 'chh', // છ
  '\u0A9C': 'j',   // જ
  '\u0A9D': 'z',   // ઝ
  '\u0A9E': 'ny',  // ઞ
  '\u0A9F': 't',   // ટ
  '\u0AA0': 'th',  // ઠ
  '\u0AA1': 'd',   // ડ
  '\u0AA2': 'dh',  // ઢ
  '\u0AA3': 'n',   // ણ
  '\u0AA4': 't',   // ત
  '\u0AA5': 'th',  // થ
  '\u0AA6': 'd',   // દ
  '\u0AA7': 'dh',  // ધ
  '\u0AA8': 'n',   // ન
  '\u0AAA': 'p',   // પ
  '\u0AAB': 'f',   // ફ
  '\u0AAC': 'b',   // બ
  '\u0AAD': 'bh',  // ભ
  '\u0AAE': 'm',   // મ
  '\u0AAF': 'y',   // ય
  '\u0AB0': 'r',   // ર
  '\u0AB2': 'l',   // લ
  '\u0AB3': 'l',   // ળ
  '\u0AB5': 'v',   // વ
  '\u0AB6': 'sh',  // શ
  '\u0AB7': 'sh',  // ષ
  '\u0AB8': 's',   // સ
  '\u0AB9': 'h',   // હ
};

const VIRAMA = '\u0ACD';     // ્ (Halant)
const ANUSVARA = '\u0A82';   // ં
const CANDRABINDU = '\u0A81';// ઁ
const VISARGA = '\u0A83';    // ઃ
const NUKTA = '\u0ABC';      // ઼

// Common Gujarati word exceptions/overrides for clean name transliteration
const CUSTOM_NAME_WORDS = {
  'ભાઈ': 'bhai',
  'બેન': 'ben',
  'કુમાર': 'kumar',
  'લાલ': 'lal',
  'ચંદ્ર': 'chandra',
  'કાંત': 'kant',
  'દાસ': 'das',
  'પ્રસાદ': 'prasad',
  'જી': 'ji',
  'શાહ': 'shah',
  'પટેલ': 'patel',
  'મહેતા': 'mehta',
  'જોશી': 'joshi',
  'ત્રિવેદી': 'trivedi',
  'વ્યાસ': 'vyas',
  'ગાંધી': 'gandhi',
  'મોદી': 'modi',
  'પારેખ': 'parekh',
  'સોની': 'soni',
  'પંડ્યા': 'pandya',
  'ઓઝા': 'ojha',
  'ભટ્ટ': 'bhatt',
  'રાવલ': 'raval',
  'દવે': 'dave',
  'જાની': 'jani',
  'દોશી': 'doshi',
  'શેઠ': 'sheth',
  'વાઘેલા': 'vaghela',
  'રાઠોડ': 'rathod',
  'ઝાલા': 'zhala',
  'ચૌહાણ': 'chauhan',
  'ગોહિલ': 'gohil',
  'સોલંકી': 'solanki',
  'ચાવડા': 'chavda',
  'પરમાર': 'parmar',
  'કૃષ્ણ': 'krishna',
  'અક્ષર': 'akshar',
  'ઘનશ્યામ': 'ghanshyam',
  'યશ': 'yash',
  'હર્ષ': 'harsh',
  'પાર્થ': 'parth',
  'ધ્રુવ': 'dhruv',
  'આરવ': 'aarav'
};

function transliterateWord(word) {
  if (!word) return '';

  // Check if entire word matches custom dictionary
  if (CUSTOM_NAME_WORDS[word]) {
    return CUSTOM_NAME_WORDS[word];
  }

  // Handle common suffixes directly
  for (const [suffix, enSuffix] of Object.entries(CUSTOM_NAME_WORDS)) {
    if (word.endsWith(suffix) && word.length > suffix.length) {
      const prefix = word.slice(0, -suffix.length);
      return transliterateWord(prefix) + enSuffix;
    }
  }

  let result = '';
  const len = word.length;

  for (let i = 0; i < len; i++) {
    const char = word[i];
    const nextChar = i + 1 < len ? word[i + 1] : null;
    const prevChar = i > 0 ? word[i - 1] : null;

    // Skip Nukta
    if (char === NUKTA) continue;

    // Check independent vowels
    if (VOWEL_MAP[char]) {
      result += VOWEL_MAP[char];
      continue;
    }

    // Check Anusvara / Candrabindu
    if (char === ANUSVARA || char === CANDRABINDU) {
      // If followed by p, ph, b, bh, m -> use 'm', else 'n'
      if (nextChar && ['\u0AAA', '\u0AAB', '\u0AAC', '\u0AAD', '\u0AAE'].includes(nextChar)) {
        result += 'm';
      } else {
        result += 'n';
      }
      continue;
    }

    // Check Visarga
    if (char === VISARGA) {
      result += 'h';
      continue;
    }

    // Check Consonants
    if (CONSONANT_MAP[char]) {
      // Check special conjunct: જ્ઞ -> 'gn'
      if (char === '\u0A9C' && nextChar === VIRAMA && i + 2 < len && word[i + 2] === '\u0A9E') {
        result += 'gn';
        i += 2;
        const afterConjunct = i + 1 < len ? word[i + 1] : null;
        if (!afterConjunct || (!MATRA_MAP[afterConjunct] && afterConjunct !== VIRAMA)) {
          if (i + 1 < len) result += 'a';
        }
        continue;
      }

      // Check special conjunct: ક્ષ -> 'ksh'
      if (char === '\u0A95' && nextChar === VIRAMA && i + 2 < len && word[i + 2] === '\u0AB7') {
        result += 'ksh';
        i += 2;
        const afterConjunct = i + 1 < len ? word[i + 1] : null;
        if (!afterConjunct || (!MATRA_MAP[afterConjunct] && afterConjunct !== VIRAMA)) {
          if (i + 1 < len) result += 'a';
        }
        continue;
      }

      const consEn = CONSONANT_MAP[char];
      result += consEn;

      // Determine vowel after consonant
      if (nextChar === VIRAMA) {
        // Halant cancels inherent 'a'
        i++; // skip virama
        continue;
      } else if (nextChar && MATRA_MAP[nextChar]) {
        // Explicit matra vowel
        result += MATRA_MAP[nextChar];
        i++; // skip matra
        continue;
      } else {
        // Inherent 'a' handling:
        // In Gujarati names:
        // - At the end of word: no 'a' (e.g. પટેલ -> Patel, રમેશ -> Ramesh)
        // - Exception: single consonant word or conjunct before word end
        const isEnd = (i + 1 >= len);
        if (!isEnd) {
          result += 'a';
        }
      }
      continue;
    }

    // If regular Latin or number or punctuation, preserve
    result += char;
  }

  return result;
}

/**
 * Transliterates a full Gujarati name/string to title-cased English.
 * e.g., "રમેશભાઈ પટેલ" -> "Rameshbhai Patel"
 */
export function transliterateGujaratiToEnglish(text) {
  if (!text || typeof text !== 'string') return '';

  const words = text.trim().split(/\s+/);
  const transliteratedWords = words.map(w => {
    const raw = transliterateWord(w);
    if (!raw) return '';
    // Capitalize first letter of each word
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  });

  return transliteratedWords.join(' ');
}

export default transliterateGujaratiToEnglish;
