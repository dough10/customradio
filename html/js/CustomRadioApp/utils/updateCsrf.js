/**
 * Updates CSRF token by fetching a new one from server
 * 
 * @returns {Promise<boolean>} True if token was updated successfully
 * @throws {Error} If token update fails
 */
export default async function updateCsrf() {
  let parser = null;
  let html = null;

  try {
    const tokenMeta = document.querySelector('meta[name="csrf-token"]');
    if (!tokenMeta) {
      throw new Error('CSRF meta tag not found in document');
    }

    const res = await fetch('/', {
      method: 'GET',
      headers: {
        'Accept': 'text/html',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
    }

    const text = await res.text();
    parser = new DOMParser();
    html = parser.parseFromString(text, "text/html");

    const newTokenMeta = html.querySelector('meta[name="csrf-token"]');
    if (!newTokenMeta?.content) {
      throw new Error('New CSRF token not found in response');
    }

    tokenMeta.content = newTokenMeta.content;
    return true;

  } catch (error) {
    console.error('Failed to update CSRF token:', error);
    return false;

  } finally {
    // Clean up
    parser = null;
    html = null;
  }
}