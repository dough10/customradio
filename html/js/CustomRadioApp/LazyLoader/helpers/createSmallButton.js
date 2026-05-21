import svgIcon from './createSVGIcon.js';

/**
 * creates a HTML button with svg icon 
 * 
 * @function
 * 
 * @param {Object} buttonData - Object containing button details.
 * @param {Object} buttonData.icon - Object containing SVG attributes.
 * @param {String} buttonData.icon.viewbox - The viewBox attribute for the SVG element.
 * @param {String} buttonData.icon.d - The path data for the SVG path element.
 * @param {String} buttonData.cssClass - The CSS class to be added to the button.
 * @param {Function} buttonData.func - The function to be called on button click.
 * @param {String} buttonData.title - The button's title.
 * @param {String} buttonData.ns - event listener namespace
 * @param {Class} buttonData.em - EventManager instance
 * 
 * @returns {HTMLElement} button
 */
export default function createSmallButton({ icon, cssClass, func, title, ns, em }) {
  const $button = document.createElement('button');
  $button.title = title;
  $button.type = 'button';
  $button.classList.add('small-button', cssClass);
  $button.append(svgIcon(icon));
  em.add($button, em.types.click, func, null, ns);
  return $button;
}