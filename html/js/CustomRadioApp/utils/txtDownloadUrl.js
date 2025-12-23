async function compress(str) {
  const cs = new CompressionStream("gzip");
  const writer = cs.writable.getWriter();
  writer.write(new TextEncoder().encode(str));
  writer.close();

  const compressed = await new Response(cs.readable).arrayBuffer();
  return Buffer.from(compressed).toString("base64url");
}

/**
 * Generates URL for downloading user's TXT file
 * 
 * @returns {String} URL for downloading user's TXT file
 */
export default async function txtDownloadUrl() {
  if (!window.user || !window.user.id) {
    return;
  }
  const compressed = await compress(window.user.id.replace('user_', ''));
  return new URL(
    `/txt/${compressed}`, 
    window.location.origin
  ).toString();
}