function postOptions(data) {
  const formData = new FormData();
  for (const [key, val] of Object.entries(data)) {
    formData.append(key, val);
  }
  return {
    method: "POST",
    body: formData,
  };
}

function unauthorized(res) {
  res.status(401).json({ error: 'Unauthorized' });
}

module.exports = async function authenticate(req, res, next) {
  try {
    const token = req.cookies['access_token'].split(' ')[1];
    if (!token) {
      return unauthorized(res);
    }
    const r = await fetch(`${process.env.AUTH_SERVER_URL}/token/verify`, postOptions({ token }));
    if (!r.ok) {
      return unauthorized(res);
    }
    const data = await r.json();
    if (!data.valid) {
      return unauthorized(res);
    }
    next();
  } catch(e) {
    return unauthorized(res);
  }
}