/**
 * Language utilities for audio track display
 */

const languageNames: Record<string, string> = {
  // ISO 639-1 (2-letter codes)
  'en': 'English',
  'bn': 'বাংলা (Bengali)',
  'hi': 'हिन्दी (Hindi)',
  'es': 'Español (Spanish)',
  'fr': 'Français (French)',
  'de': 'Deutsch (German)',
  'ar': 'العربية (Arabic)',
  'zh': '中文 (Chinese)',
  'ja': '日本語 (Japanese)',
  'ko': '한국어 (Korean)',
  'pt': 'Português (Portuguese)',
  'ru': 'Русский (Russian)',
  'it': 'Italiano (Italian)',
  'tr': 'Türkçe (Turkish)',
  'th': 'ไทย (Thai)',
  'vi': 'Tiếng Việt (Vietnamese)',
  'id': 'Indonesia',
  'ms': 'Bahasa Melayu',
  'ta': 'தமிழ் (Tamil)',
  'te': 'తెలుగు (Telugu)',
  'ml': 'മലയാളം (Malayalam)',
  'kn': 'ಕನ್ನಡ (Kannada)',
  'mr': 'मराठी (Marathi)',
  'gu': 'ગુજરાતી (Gujarati)',
  'pa': 'ਪੰਜਾਬੀ (Punjabi)',
  'ur': 'اردو (Urdu)',
  'ne': 'नेपाली (Nepali)',
  'si': 'සිංහල (Sinhala)',
  
  // ISO 639-2 (3-letter codes)
  'eng': 'English',
  'ben': 'বাংলা (Bengali)',
  'hin': 'हिन्दी (Hindi)',
  'spa': 'Español (Spanish)',
  'fra': 'Français (French)',
  'deu': 'Deutsch (German)',
  'ara': 'العربية (Arabic)',
  'zho': '中文 (Chinese)',
  'jpn': '日本語 (Japanese)',
  'kor': '한국어 (Korean)',
  'por': 'Português (Portuguese)',
  'rus': 'Русский (Russian)',
  'ita': 'Italiano (Italian)',
  'tur': 'Türkçe (Turkish)',
  'tha': 'ไทย (Thai)',
  'vie': 'Tiếng Việt (Vietnamese)',
  'ind': 'Indonesia',
  'msa': 'Bahasa Melayu',
  'tam': 'தமிழ் (Tamil)',
  'tel': 'తెలుగు (Telugu)',
  'mal': 'മലയാളം (Malayalam)',
  'kan': 'ಕನ್ನಡ (Kannada)',
  'mar': 'मराठी (Marathi)',
  'guj': 'ગુજરાતી (Gujarati)',
  'pan': 'ਪੰਜਾਬੀ (Punjabi)',
  'urd': 'اردو (Urdu)',
  'nep': 'नेपाली (Nepali)',
  'sin': 'සිංහල (Sinhala)',
  
  // Common variations
  'chi': '中文 (Chinese)',
  'ger': 'Deutsch (German)',
  'fre': 'Français (French)',
  'und': 'Unknown',
  'mul': 'Multiple Languages',
  'other': 'Other',
  'oth': 'Other',
};

/**
 * Convert a language code to a human-readable language name
 */
export const getLanguageName = (langCode: string): string => {
  if (!langCode) return 'Unknown';
  
  const normalized = langCode.toLowerCase().trim();
  return languageNames[normalized] || langCode.toUpperCase();
};

/**
 * Get a short language name (just the native name without parenthetical)
 */
export const getShortLanguageName = (langCode: string): string => {
  const fullName = getLanguageName(langCode);
  // Return just the first part before parentheses
  return fullName.split(' (')[0];
};

export interface AudioTrack {
  id: number;
  name: string;
  lang: string;
  url?: string; // URL to separate audio file (for external audio tracks)
}
