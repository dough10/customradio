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

    return u.toString();
  } catch {
    return urlString;
  }
};