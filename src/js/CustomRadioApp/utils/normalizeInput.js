
export default function normalizeInput(str) {
  return str
  .toLowerCase()
  .replace(/&/g, 'and')
  .normalize("NFD").replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9\s]/gi, '')
  .split(/\s+/)
  .filter(Boolean).join(' ');
}