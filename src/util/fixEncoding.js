/**
 * Safe mojibake fixer focused on UTF-8 ↔ Latin-1 issues
 * - Non-destructive
 * - No language bias
 * - Handles double-encoded strings
 */

function fixEncoding(input) {
  if (!input || typeof input !== 'string') return input;

  let current = input;

  for (let i = 0; i < 3; i++) {
    const next = tryLatin1ToUtf8(current);
    if (next === current || !looksBetter(current, next)) break;
    current = next;
  }

  return cleanup(current);
}

/**
 * Core fix: reinterpret Latin-1 bytes as UTF-8
 */
function tryLatin1ToUtf8(str) {
  try {
    return Buffer.from(str, 'latin1').toString('utf8');
  } catch {
    return str;
  }
}

/**
 * Heuristic: is the candidate actually better?
 * (very conservative to avoid corrupting valid text)
 */
function looksBetter(original, candidate) {
  if (!candidate || candidate === original) return false;

  return (
    countReplacementChars(candidate) < countReplacementChars(original) ||
    countSuspiciousSequences(candidate) < countSuspiciousSequences(original)
  );
}

/**
 * Count � (replacement char)
 */
function countReplacementChars(str) {
  return (str.match(/�/g) || []).length;
}

/**
 * Detect common mojibake patterns
 */
function countSuspiciousSequences(str) {
  const matches = str.match(/(Ã.|Â.|Ð.|Ñ.|Î.|Ï.)/g);
  return matches ? matches.length : 0;
}

/**
 * Minimal cleanup (DO NOT remove valid Unicode)
 */
function cleanup(str) {
  return str
    .replace(/\s+/g, ' ')
    .trim();
}

module.exports = fixEncoding;