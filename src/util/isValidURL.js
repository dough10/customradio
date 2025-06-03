module.exports = (url) => {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
}