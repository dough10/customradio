export default function txtDownloadUrl() {
  return new URL(
    `/txt/${window.user.id.replace('user_', '')}`, 
    window.location.origin
  ).toString();
}