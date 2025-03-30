/**
 * Creates a loading animation in the element passed to the input
 * 
 * @param {HTMLElement} parent 
 * 
 * @returns {void}
 */
export default function loadingAnimation(parent) {
  if (parent.querySelector('.loading')) return;
  const div = document.createElement('div');
  div.classList.add('loading');
  for (let i = 0; i < 5; i++) {
    const circle = document.createElement('div');
    circle.classList.add('circle');
    div.append(circle);
  }
  parent.prepend(div);
}