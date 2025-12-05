/**
 * Generates URL for downloading user's TXT file
 * 
 * @returns {String} URL for downloading user's TXT file
 */
export default function txtDownloadUrl() {
  return new URL(
    `/txt/${window.user.id.replace('user_', '')}`, 
    window.location.origin
  ).toString();
}