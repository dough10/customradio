const usedElements = new Map();

export function qs(selector) {
  const cached = usedElements.get(selector);
  if (cached?.isConnected) return cached;
  const el = document.querySelector(selector);
  usedElements.set(selector, el);
  return el;
}

export function qsAll(selector) {
  return document.querySelectorAll(selector);
}
