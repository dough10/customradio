/**
 * Simplified but more systematic approach to fixing Icecast mojibake
 * Focuses on the most common patterns seen in real-world data
 */
function fixEncoding(str) {
  if (!str || typeof str !== 'string') return str;
  
  // console.log(`\n=== Processing: "${str.substring(0, 50)}${str.length > 50 ? '...' : ''}" ===`);
  
  try {
    let result = str;
    
    const utf8Fix = fixUtf8AsLatin1Simple(str);
    if (utf8Fix !== str && isSignificantlyBetter(str, utf8Fix)) {
      // console.log('✓ UTF-8 as Latin-1 fix successful');
      result = utf8Fix;
    }
    
    if (hasHeavyCorruption(result)) {
      // console.log('Still heavily corrupted, trying pattern reconstruction...');
      const patternFix = reconstructFromPatterns(result);
      if (isSignificantlyBetter(result, patternFix)) {
        // console.log('✓ Pattern reconstruction successful');
        result = patternFix;
      }
    }
    
    result = cleanupResult(result);
    
    // console.log(`Final result: "${result}"`);
    return result;
    
  } catch (error) {
    console.warn('Encoding fix failed:', error.message);
    return str;
  }
}

/**
 * Simple UTF-8 as Latin-1 fix - handles the most common case
 */
function fixUtf8AsLatin1Simple(str) {
  try {
    let fixed = str.replace(/Ð /g, 'Ð\xA0');
    
    const bytes = [];
    for (let i = 0; i < fixed.length; i++) {
      const code = fixed.charCodeAt(i);
      bytes.push(code <= 255 ? code : (code & 0xFF));
    }
    
    const decoded = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes));
    
    const originalReplacements = (str.match(/�/g) || []).length;
    const decodedReplacements = (decoded.match(/�/g) || []).length;
    
    if (decodedReplacements <= originalReplacements && decoded !== str) {
      return decoded;
    }
    
    return str;
  } catch (e) {
    return str;
  }
}

/**
 * Check if a string has heavy corruption patterns
 */
function hasHeavyCorruption(str) {
  const corruptionIndicators = [
    /[ÐÑ][^\u0400-\u04FF\s]/g,  // Cyrillic prefix not followed by Cyrillic
    /N[\u0080-\u009F]/g,        // N followed by control chars
    /[⁄∕][0-9]/g,               // Fraction patterns
    /[\u0080-\u009F]/g,         // Standalone control chars
    /μ/g,                       // Greek mu in wrong context
  ];
  
  const totalMatches = corruptionIndicators.reduce((count, pattern) => {
    const matches = str.match(pattern);
    return count + (matches ? matches.length : 0);
  }, 0);
  
  return totalMatches > (str.length * 0.2);
}

/**
 * Attempt to reconstruct from known corruption patterns
 */
function reconstructFromPatterns(str) {
  let result = str;
  
  // Most common Cyrillic mojibake patterns
  const commonPatterns = {
    // UTF-8 Cyrillic that got double-corrupted
    'ÐµÐ': 'е',    // е (Cyrillic ie)
    'Ð°Ð': 'а',    // а (Cyrillic a)
    'Ð¾Ð': 'о',    // о (Cyrillic o)
    'Ñ€Ñ': 'р',    // р (Cyrillic er)
    'ÐºÐ': 'к',    // к (Cyrillic ka)
    'Ð½Ñ': 'н',    // н (Cyrillic en)
    'Ð¸Ñ': 'и',    // и (Cyrillic i)
    'ÑƒÑ': 'у',    // у (Cyrillic u)
    'Ñ‚Ñ': 'т',    // т (Cyrillic te)
    'Ð»Ñ': 'л',    // л (Cyrillic el)
    'Ð¿Ñ': 'п',    // п (Cyrillic pe)
    'Ð²Ñ': 'в',    // в (Cyrillic ve)
    'Ð¼Ñ': 'м',    // м (Cyrillic em)
    'Ñ‹Ñ': 'ы',    // ы (Cyrillic yery)
    'Ñ‡Ñ': 'ч',    // ч (Cyrillic che)
    'Ñˆ': 'ш',     // ш (Cyrillic sha)
    'Ñ‰': 'щ',     // щ (Cyrillic shcha)
    'Ñ': 'я',      // я (Cyrillic ya)
    'ÑŽ': 'ю',     // ю (Cyrillic yu)
    
    // Fraction artifacts that represent Cyrillic
    'Ð3⁄4': 'Ро',   // Common pattern
    'Ð1⁄2': 'Ру',   // Common pattern  
    '3⁄4': 'о',     // Standalone fraction -> o
    '1⁄2': 'у',     // Standalone fraction -> u
    '1⁄4': 'я',     // 1/4 fraction -> ya
    
    // N + control char patterns (most common ones)
    'Nѓ': 'г',      // г (Cyrillic ghe)
    'NЃ': 'с',      // с (Cyrillic es)  
    'Nя': 'е',      // е (Cyrillic ie)
    'N∂': 'д',      // д (Cyrillic de)
    'N†': 'т',      // т (Cyrillic te)
    'N‹': 'к',      // к (Cyrillic ka)
    'N›': 'л',      // л (Cyrillic el)
    'N‰': 'м',      // м (Cyrillic em)
    'Nѓ': 'н',      // н (Cyrillic en)
  };
  
  // Apply pattern fixes
  for (const [pattern, replacement] of Object.entries(commonPatterns)) {
    if (result.includes(pattern)) {
      // console.log(`Applying pattern fix: "${pattern}" -> "${replacement}"`);
      result = result.replaceAll(pattern, replacement);
    }
  }
  
  // Remove obvious artifacts
  result = result
    .replace(/[Q@\u0080-\u009F]/g, '') // Remove obvious corruption artifacts
    .replace(/Ð([0-9])/g, '$1')        // Remove Ð before numbers
    .replace(/\s+/g, ' ')              // Normalize spaces
    .trim();
  
  return result;
}

/**
 * Check if one string is significantly better than another
 */
function isSignificantlyBetter(original, candidate) {
  if (!candidate || candidate === original) return false;
  
  const origScore = calculateQualityScore(original);
  const candScore = calculateQualityScore(candidate);
  
  // console.log(`Quality scores: original=${origScore}, candidate=${candScore}`);
  
  return candScore > (origScore * 1.2);
}

/**
 * Calculate a quality score for text
 */
function calculateQualityScore(str) {
  let score = 0;
  
  const readable = str.match(/[a-zA-Z0-9А-Яа-я\u0400-\u04FF\s\-()]/g);
  score += readable ? readable.length * 2 : 0;
  
  const corruption = str.match(/[ÐÑμ][^А-Яа-я\u0400-\u04FF\s]/g);
  score -= corruption ? corruption.length * 3 : 0;
  
  const artifacts = str.match(/[Q@\u0080-\u009F⁄∕]/g);
  score -= artifacts ? artifacts.length * 2 : 0;
  
  const replacements = str.match(/�/g);
  score -= replacements ? replacements.length * 5 : 0;
  
  return Math.max(0, score);
}

/**
 * Final cleanup of the result
 */
function cleanupResult(str) {
  return str
    .replace(/\s+/g, ' ')               // Normalize spaces
    .replace(/[^\u0000-\u007F\u00A0-\u00FF\u0400-\u04FF\u2010-\u2015\u2018-\u201F\(\)\-\s]/g, '') // Remove weird chars
    .trim();
}

module.exports = fixEncoding;