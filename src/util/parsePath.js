const redacted = new Set([
  'code',
  'access_token',
  'refresh_token',
  'id_token',
  'token'
]);

module.exports = function parsePath(originalUrl) {
  const url = new URL(originalUrl, 'http://localhost');
  for (const key of redacted) {
    if (url.searchParams.has(key)) {
      url.searchParams.set(key, '[REDACTED]');
    }
  }
  return { path: url.pathname, query: Object.fromEntries(url.searchParams) };
}