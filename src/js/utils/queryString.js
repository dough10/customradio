/**
 * add query string based on length of input value 
 * 
 * @param {String} value
 * 
 * @returns {String}
 */
export default function queryString(value) {
  const uriEncoded = encodeURIComponent(value);
  return (value.length === 0) ? '' : `?genres=${uriEncoded}`;
}