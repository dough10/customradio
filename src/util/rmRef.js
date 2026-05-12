const trashParams = [
  'ref',
  'uuid',
  't302',
  'fromyp'
];

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
    for (const trash of trashParams) {
      u.searchParams.delete(trash);
    }
    return u.toString();
  } catch {
    return urlString;
  }
};