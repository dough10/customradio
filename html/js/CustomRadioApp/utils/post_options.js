export default (body = null) => {
  const options = {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content
    }
  };

  if (body instanceof HTMLFormElement) {
    options.body = new FormData(body);
  } else if (body && typeof body === 'object') {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  return options;
};
