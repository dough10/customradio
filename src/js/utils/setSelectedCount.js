/**
 * Updates the selected count displayed on the page and manages the state of the download button.
 * 
 * This function updates the text content of the element with the ID `#count` to display the provided number. 
 * It also enables or disables the download button (`#download`) based on whether the number is greater than zero.
 * If a global `_paq` tracking object is available, the function sends events to it based on the state of the button.
 * 
 * @param {number} number - The number to set as the selected count.
 * 
 * @fires _paq.push - If `_paq` is defined, the function tracks events related to enabling or disabling the download button.
 */
export default function setSelectedCount(number) {
  const count = document.querySelector('#count');
  const dlButton = document.querySelector('#download');
  count.textContent = `${number} station${number === 1 ? '' : 's'} selected`;
  if (number > 0) {
    dlButton.removeAttribute('disabled');
  } else {
    if (!dlButton.hasAttribute('disabled')) {
      dlButton.toggleAttribute('disabled');
    }
  }
}