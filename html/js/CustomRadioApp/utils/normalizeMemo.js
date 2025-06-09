// normalizeMemo.js
import normalizeInput from './normalizeInput.js';

const cache = new Map();

export default function normalizeMemo(str) {
  if (!str) return '';
  if (cache.has(str)) return cache.get(str);
  const normalized = str.split(',').map(part => normalizeInput(part)).join(',');
  cache.set(str, normalized);
  return normalized;
}
