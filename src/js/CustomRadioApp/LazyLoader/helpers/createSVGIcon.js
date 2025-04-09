/**
 * creates an SVG icon 
 * 
 * @function
 * 
 * @param {Object} icon - Object containing SVG attributes.
 * @param {String} icon.viewbox - The viewBox attribute for the SVG element.
 * @param {String} icon.d - The path data for the SVG path element.
 * 
 * @returns {HTMLElement} SVG element with nested path
 */
export default function svgIcon({ viewbox, d }) {
  const path = document.createElementNS("http://www.w3.org/2000/svg", 'path');
  path.setAttribute("d", d);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
  svg.setAttribute('fill', 'currentColor');
  svg.setAttribute('viewBox', viewbox);
  svg.append(path);
  return svg;
}

// Example usage:
// const iconElement = svgIcon({ viewbox: "0 0 24 24", d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" });
// document.body.appendChild(iconElement);