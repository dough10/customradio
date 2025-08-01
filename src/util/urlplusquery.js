module.exports = (url, lang) => {
  const urlObj = new URL(url, 'http://localhost');
  const queryParams = new URLSearchParams(urlObj.search);

  if (lang) {
    queryParams.set('lang', lang);
  }

  return `${urlObj.pathname}?${queryParams.toString()}`;
};
