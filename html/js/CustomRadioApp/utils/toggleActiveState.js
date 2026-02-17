/**
 * toggles disabled state of download button
 * 
 * @param {HTMLElement} button
 * @param {Number} selected 
 */
export default function toggleActiveState(button, selected) {
  selected > 0 ? button.removeAttribute('disabled') : button.setAttribute('disabled', '');
}
