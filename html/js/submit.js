window.addEventListener('DOMContentLoaded', () => {
  function opt(body = null) {
    const options = {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content
      }
    };

    if (body && body instanceof HTMLFormElement) {
      options.body = new FormData(body);
    } else if (body && typeof body === 'object') {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }

    return options;
  }

  function addParagraph(value, container) {
    const input = document.createElement('input');
    if (value) input.value = value;
    input.type = 'text';
    input.name = 'paragraphs[]';

    container.append(document.createElement('br'), input);
  }

  let selectedAlert = null;

  const form = document.querySelector('form');
  const add = document.getElementById('add-paragraph');
  const container = document.getElementById('paragraph-container');
  const del = document.querySelector('#del');

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();

    const data = {
      id: form.id.value,
      title: form.title.value,
      paragraphs: [...document.querySelectorAll('[name="paragraphs[]"]')]
        .map(input => input.value).filter(Boolean)
    };

    if (!data.id || !data.title || data.paragraphs.length < 1) {
      return alert('id, title and 1 or more paragraphs are required');
    }

    const res = await fetch('/addAlert', opt(data));

    if (!res.ok) return alert('Submit Failed');
    window.location.href = window.location.href;
  });

  add.addEventListener('click', _ => addParagraph(null, container));

  del.addEventListener('click', async _ => {
    const res = await fetch('/dismissAlert', opt({
      id: selectedAlert.dataset.id,
      version: selectedAlert.dataset.version
    }));
    if (!res.ok) return alert('Failed to dismiss alert');
    window.location.href = window.location.href;
  });

  [...document.querySelectorAll('ul>li')].forEach(alert => {
    const {id, title} = alert.dataset;
    if (!id || !title) return;

    alert.addEventListener('click', () => {
      selectedAlert = alert;

      form.id.value = id;
      form.title.value = title;

      container.replaceChildren();

      const paragraphs = JSON.parse(alert.dataset.p);
      for (const p of paragraphs) {
        addParagraph(p, container);
      }

      del.disabled = false;
    });
  });
});