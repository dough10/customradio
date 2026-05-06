/**
 * remove "ref" query parameter
 * 
 * @param {String} URL 
 * 
 * @returns {String} url without ref query paramater
 */
module.exports = (urlString) => {
  try {
    const u = new URL(urlString);

    u.searchParams.delete('ref');
    u.searchParams.delete('uuid');
    u.searchParams.delete('t302');

    return u.toString();
  } catch {
    return urlString;
  }
};