/**
 * Generates URL for downloading user's TXT file
 * 
 * @returns {String} URL for downloading user's TXT file
 */
export default async function txtDownloadUrl() {
  if (!window.user || !window.user.lookup) {
    return;
  }
  return new URL(
    `/txt/${window.user.lookup}`, 
    window.location.origin
  ).toString();
}