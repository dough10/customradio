// normalizeMemo.js
import normalizeInput from './normalizeInput.js';

const cache = new Map();

export default function normalizeMemo(str) {
  if (!str) return '';
  if (cache.has(str)) return cache.get(str);
  const normalized = normalizeInput(str);
  cache.set(str, normalized);
  return normalized;
}
