/**
 * Profanity Filter & Content Moderation System for J3A STORE
 * Implements full normalization:
 * 1. Unicode Normalize (NFKC)
 * 2. Lowercase conversion
 * 3. Zero-width character removal
 * 4. Punctuation & symbol removal
 * 5. Space removal for phonetic/hidden checks
 * 6. Character repeat reduction
 * 7. Substitute / leetspeak character normalization
 * 8. Comprehensive Thai & English abusive word blocklist
 */

// Comprehensive Thai & English abusive words list
const PROFANITY_WORDS = [
  'ไอเหี้ย',
  'ไอ้เหี้ย',
  'เหี้ย',
  'เชี่ย',
  'เชี้ย',
  'ไอ้เชี่ย',
  'สัส',
  'สัด',
  'ไอ้สัส',
  'ไอ้สัด',
  'ไอัส',
  'ไอสัส',
  'สัตว์',
  'ควย',
  'ไอ้ควย',
  'เย็ด',
  'เยด',
  'ไอ้เย็ด',
  'เย็ดแม่',
  'เย็ดพ่อ',
  'เย็ดมึง',
  'หี',
  'แตด',
  'รูหี',
  'หัวควย',
  'หัวดอ',
  'ดอ',
  'ดอกทอง',
  'อีดอก',
  'อีเหี้ย',
  'อีสัส',
  'อีควย',
  'อีห่า',
  'อีแก่',
  'อีเวร',
  'อีชั่ว',
  'ไอ้เวร',
  'ไอ้ระยำ',
  'ระยำ',
  'ชาติหมา',
  'ไอ้ชาติหมา',
  'ชาติชั่ว',
  'ไอ้ชาติชั่ว',
  'ส้นตีน',
  'หน้าหมา',
  'ไอ้หน้าหมา',
  'หน้าส้นตีน',
  'ไอ้หน้าส้นตีน',
  'แม่ง',
  'แม่มึง',
  'พ่อมึง',
  'พ่อมึงตาย',
  'แม่มึงตาย',
  'พ่อแม่มึง',
  'พ่อแม่มึงตาย',
  'พ่อมึงเป็นเหี้ย',
  'แม่มึงเป็นเหี้ย',
  'มึงตาย',
  'ไอ้เลว',
  'ไอ้ควาย',
  'โคตรโง่',
  'ไอ้โง่',
  'ไอ้หมา',
  'ไอ้สถุน',
  'สถุน',
  'ถ่อย',
  'อัปรีย์',
  'จัญไร',
  'อีจัญไร',
  'ห่า',
  'ไอ้ห่า',
  'เหี้ยมาก',
  'โคตรเหี้ย',
  'โคตรสัส',
  'โคตรควย',
  'สัสเอ้ย',
  'เหี้ยเอ้ย',
  'ควยเอ้ย',
  'ไอ้เหี้ยเอ้ย',
  'ไอ้สัสเอ้ย',
  'เย็ดเข้',
  'เย็ดแม่ง',
  'เย็ดโคตร',
  'ไปตาย',
  'ไปตายซะ',
  'ขอให้มึงตาย',
  'ขอให้แม่มึงตาย',
  'ขอให้พ่อมึงตาย',
  'ฆ่าตัวตาย',
  'ตายห่า',
  'ตายซะ',
  'ไปลงนรก',
  'สาปแช่ง',
  'fuck',
  'fucker',
  'fucking',
  'bitch',
  'shit',
  'asshole',
  'dick',
  'pussy',
  'cunt',
];

// Regex for masked profanity like ค*ย, ค_วย, ส*ส, etc.
const MASKED_PATTERNS = [
  /ค[\s*_\-.~#@$%^&*+=]+ย/i,
  /ค[\s*_\-.~#@$%^&*+=]*ว[\s*_\-.~#@$%^&*+=]*ย/i,
  /ไอ้?[\s*_\-.~#@$%^&*+=]*ค[\s*_\-.~#@$%^&*+=]*[ว*_\-.~#@$%^&*+=]*ย/i,
  /ไอ้?[\s*_\-.~#@$%^&*+=]*ั[\s*_\-.~#@$%^&*+=]*ส/i, // ไอัส, ไอั-ส
  /ส[\s*_\-.~#@$%^&*+=]+ส/i,
  /ส[\s*_\-.~#@$%^&*+=]+ด/i,
  /เหี้[\s*_\-.~#@$%^&*+=]+ย/i,
  /เ[\s*_\-.~#@$%^&*+=]*หี้[\s*_\-.~#@$%^&*+=]*ย/i,
  /เย็[\s*_\-.~#@$%^&*+=]+ด/i,
  /เ[\s*_\-.~#@$%^&*+=]*เย็[\s*_\-.~#@$%^&*+=]*ด/i,
];

/**
 * Normalize text to detect obfuscated profanity:
 * Examples:
 * ไ อ้ เ หี้ ย -> ไอ้เหี้ย
 * ค ว ย -> ควย
 * เหี้--ย -> เหี้ย
 * ค*ย, ค_วย -> ควย
 * ไอ้สัสสสส -> ไอ้สัส
 */
export function normalizeText(rawText: string): string {
  if (!rawText) return '';

  // 1. Unicode Normalize (NFKC)
  let text = rawText.normalize('NFKC');

  // 2. Convert to lowercase
  text = text.toLowerCase();

  // 3. Remove zero-width characters
  text = text.replace(/[\u200B-\u200D\uFEFF]/g, '');

  // 4. Normalize common leetspeak / lookalikes
  text = text
    .replace(/[0]/g, 'o')
    .replace(/[1]/g, 'i')
    .replace(/[3]/g, 'e')
    .replace(/[4]/g, 'a')
    .replace(/[5]/g, 's')
    .replace(/[@]/g, 'a')
    .replace(/[$]/g, 's');

  // 5. Remove punctuation and separators between characters (e.g. ค*ย, ค_วย, เหี้-ย, ส.ั.ส)
  // Preserve Thai vowels/marks
  text = text.replace(/[_\-*.,\/\\#~`!%^&():;'"<>?+=\[\]{}|]/g, '');

  // 6. Reduce duplicate characters (e.g. สัสสสส -> สัส, ควยยยย -> ควย, เหี้ยยยย -> เหี้ย)
  text = text.replace(/(.)\1{2,}/g, '$1$1');

  return text;
}

/**
 * Remove all spaces between characters to detect spaced words:
 * e.g. "ไ อ้ เ หี้ ย" -> "ไอ้เหี้ย"
 */
export function removeAllSpaces(text: string): string {
  return text.replace(/\s+/g, '');
}

export interface ProfanityCheckResult {
  hasProfanity: boolean;
  matchedWord?: string;
  cleanedText?: string;
}

/**
 * Check if the text contains any prohibited or abusive words
 */
export function checkProfanity(text: string): ProfanityCheckResult {
  if (!text || !text.trim()) {
    return { hasProfanity: false };
  }

  // 1. Check Masked Regex Patterns on raw text first (e.g. ค*ย, ค_วย, เหี้--ย, ไอัส)
  for (const pattern of MASKED_PATTERNS) {
    if (pattern.test(text)) {
      return { hasProfanity: true, matchedWord: 'คำไม่สุภาพ (รูปแบบซ่อนคำ)' };
    }
  }

  const rawLower = text.toLowerCase();
  const normalized = normalizeText(text);
  const normalizedNoSpaces = removeAllSpaces(normalized);

  // 2. Check against blocklist
  for (const badWord of PROFANITY_WORDS) {
    const cleanBadWord = removeAllSpaces(normalizeText(badWord));

    // Exclude false-positive contexts
    if (badWord === 'สัตว์') {
      if (
        rawLower.includes('สัตว์เลี้ยง') ||
        rawLower.includes('สัตว์ป่า') ||
        rawLower.includes('สัตว์น้ำ') ||
        rawLower.includes('สัตวแพทย์') ||
        rawLower.includes('สัตว์โลก')
      ) {
        continue;
      }
    }

    if (badWord === 'ดอ') {
      // Standalone 'ดอ' causes false positives in ดอกไม้, ดอนเมือง etc.
      // Only match if it's head/tail of insult like หัวดอ, ไอ้ดอ
      if (
        rawLower.includes('หัวดอ') ||
        rawLower.includes('ไอ้ดอ') ||
        rawLower.includes('อีดอ') ||
        /(^|\s)ดอ(\s|$)/.test(rawLower)
      ) {
        return { hasProfanity: true, matchedWord: badWord };
      }
      continue;
    }

    if (badWord === 'ดอก') {
      // Allow legitimate uses like ดอกไม้, ดอกเบี้ย, ดอกบัว
      if (
        rawLower.includes('ดอกไม้') ||
        rawLower.includes('ดอกเบี้ย') ||
        rawLower.includes('ดอกบัว') ||
        rawLower.includes('ดอกกุหลาบ') ||
        rawLower.includes('ดอกเห็ด') ||
        rawLower.includes('ดอกมะลิ')
      ) {
        continue;
      }
      // If it's อีดอก or ดอกทอง, match!
      if (rawLower.includes('อีดอก') || rawLower.includes('ดอกทอง')) {
        return { hasProfanity: true, matchedWord: badWord };
      }
      // If isolated "ดอก"
      if (/(^|\s)ดอก(\s|$)/.test(rawLower)) {
        return { hasProfanity: true, matchedWord: badWord };
      }
      continue;
    }

    if (badWord === 'หี') {
      // Avoid matching 'หีบ' (หีบห่อ, หีบสมบัติ)
      if (rawLower.includes('หีบ') && !rawLower.includes('รูหี') && !rawLower.includes('อีหี')) {
        continue;
      }
    }

    if (badWord === 'กู') {
      // Avoid matching 'กูเกิล' (Google) or 'กู้'
      if (rawLower.includes('กูเกิล') || rawLower.includes('กูเกิ้ล') || rawLower.includes('กู้')) {
        continue;
      }
      if (/(^|\s)กู(\s|$)/.test(rawLower) || rawLower.includes('ไอ้กู') || rawLower.includes('มึงกู')) {
        return { hasProfanity: true, matchedWord: badWord };
      }
      continue;
    }

    // 1. Check exact word in raw text
    if (rawLower.includes(badWord.toLowerCase())) {
      return { hasProfanity: true, matchedWord: badWord };
    }

    // 2. Check in normalized without punctuation / repeats
    if (normalized.includes(cleanBadWord)) {
      return { hasProfanity: true, matchedWord: badWord };
    }

    // 3. Check in no-space normalized string (detects "ค ว ย", "ไ อ้ เ หี้ ย")
    if (normalizedNoSpaces.includes(cleanBadWord)) {
      return { hasProfanity: true, matchedWord: badWord };
    }
  }

  return { hasProfanity: false };
}

