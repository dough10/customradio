/**
 * Set of sensitive path segments that indicate potential attacks or probing.
 * @type {Set<string>}
 */
const sensitivePaths = new Set([
  '.env',
  '.git',
  '.ssh',
  '.json',
  'wp-admin',
  'wp-login',
  'wp-json',
  'phpmyadmin',
  'phpinfo',
  '.aws',
  '.old',
  '.save',
  '.php',
  'settings',
  'api',
  '.db',
  'actuator',
  'powershell',
  'firebase',
  'admin'
]);

module.exports = function pathIsSensative(path) {
  for (const sensitive of sensitivePaths) {
    if (path.includes(sensitive)) return true;
  }
  return false;
}