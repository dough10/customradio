/**
 * Generates URL for downloading user's TXT file
 * 
 * @returns {String} URL for downloading user's TXT file
 */
export default function txtDownloadUrl() {
  if (!window.user || !window.user.id) {
    console.warn('User ID not found in global window object');
    return '';
  }
  return new URL(
    `/txt/${window.user.id.replace('user_', '')}`, 
    window.location.origin
  ).toString();
}