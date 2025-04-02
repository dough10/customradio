import stamp from './timestamp.js';

/**
 * Generates a text file download from selected items
 *
 * @function
 * @param {Function} [scopedStamp] - Optional custom stamp function for testing
 * @returns {void}
 */
export default async function downloadTextfile(scopedStamp = stamp) {
  const container = document.querySelector('#stations');
  const elements = Array.from(container.querySelectorAll('li[selected]'));
  const str = elements
    .sort((a, b) => a.dataset.name.localeCompare(b.dataset.name))
    .map((el) => `${el.dataset.name}, ${el.dataset.url}`)
    .join('\n');

  const blob = new Blob([`${scopedStamp()}\n${str}`], {
    type: 'text/plain',
  });

  const filename = 'radio.txt';
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;

  document.body.append(link);

  if (typeof _paq !== 'undefined') _paq.push(['trackLink', 'download', link.href]);

  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}