const usedElements = new Map();

export function qs(selector, scope=document) {
  const cached = usedElements.get(selector);
  if (cached?.isConnected) return cached;
  const el = scope.querySelector(selector);
  usedElements.set(selector, el);
  return el;
}

export function qsAll(selector, scope=document) {
  return scope.querySelectorAll(selector);
}
