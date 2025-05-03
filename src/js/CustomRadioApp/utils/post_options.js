export default (body = null) => {
  const options = {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content
    }
  };

  if (body) {
    options.body = new FormData(body);
  }

  return options;
};