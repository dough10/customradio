import { qs } from './querySelectors.js';
import raf from './raf.js';

export function updateText(selector, text) {
  try {
    const $el = qs(selector);
    if (!$el) throw new Error('Element missing');
    const str = String(text);
    if ($el.textContent === str) return;
    $el.textContent = str;
  } catch (er) {
    console.error(`Error updating ${selector} text: ${er}`);
  }
}

export async function updateTexts(list) {
  if (!Array.isArray(list)) throw Error('"list" must be of type Array');
  await raf();
  for (const { el, str } of list) updateText(el, str);
}