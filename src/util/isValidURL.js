const blockedPatterns = [
  /^(https?:\/\/)?(localhost|127\.\d+\.\d+\.\d+)/,
  /^(https?:\/\/)?192\.168\.\d+\.\d+/,
  /^(https?:\/\/)?10\.\d+\.\d+\.\d+/,
  /^(https?:\/\/)?172\.(1[6-9]|2[0-9]|3[01])\.\d+\.\d+/,
  /^(https?:\/\/)?169\.254\.\d+\.\d+/,
];

module.exports = (url) => {
  const isBlocked = blockedPatterns.some(pattern => pattern.test(url));
  if (isBlocked) {
    return false;
  }
  
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
};