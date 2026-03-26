module.exports = (req) => {
  const adminID = process.env.ADMIN_ID;
  if (!adminID || !req.user) return false;
  return adminID === req.user.id;
};