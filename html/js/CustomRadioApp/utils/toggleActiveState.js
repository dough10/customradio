/**
 * toggles disabled state of download button
 * 
 * @param {HTMLElement} button
 * @param {Number} selected 
 */
export default function toggleActiveState(button, selected) {
  if (selected > 0) {
    button.removeAttribute('disabled');
    return;
  }
  if (!button.hasAttribute('disabled')) {
    button.toggleAttribute('disabled');
  }
}
